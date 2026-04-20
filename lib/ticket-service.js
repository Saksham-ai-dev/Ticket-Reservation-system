const { randomUUID } = require('crypto');
const defaultEvents = require('./default-events');
const { getDatabase, getMongoClient } = require('./mongodb');

let bootstrapPromise;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function ensureNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    const error = new Error(`${fieldName} is required`);
    error.statusCode = 400;
    throw error;
  }

  return value.trim();
}

function parseQuantity(value) {
  const quantity = Number.parseInt(String(value), 10);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    const error = new Error('Quantity must be between 1 and 10');
    error.statusCode = 400;
    throw error;
  }

  return quantity;
}

function validateUserInfo(userInfo) {
  if (!userInfo || typeof userInfo !== 'object' || Array.isArray(userInfo)) {
    const error = new Error('User details are required');
    error.statusCode = 400;
    throw error;
  }

  const name = ensureNonEmptyString(userInfo.name, 'Name');
  const email = normalizeEmail(userInfo.email);
  const phone = ensureNonEmptyString(userInfo.phone, 'Phone');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('A valid email is required');
    error.statusCode = 400;
    throw error;
  }

  if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    const error = new Error('A valid phone number is required');
    error.statusCode = 400;
    throw error;
  }

  return { name, email, phone };
}

function enrichEvent(event) {
  return {
    ...event,
    tickets: event.tickets.map((ticket) => ({
      ...ticket,
      available: ticket.total - ticket.booked
    }))
  };
}

async function getCollections() {
  const db = await getDatabase();
  return {
    events: db.collection('events'),
    bookings: db.collection('bookings')
  };
}

async function ensureSeedData() {
  if (bootstrapPromise) {
    await bootstrapPromise;
    return;
  }

  bootstrapPromise = (async () => {
    const { events, bookings } = await getCollections();
    await Promise.all([
      events.createIndex({ id: 1 }, { unique: true }),
      events.createIndex({ category: 1 }),
      bookings.createIndex({ id: 1 }, { unique: true }),
      bookings.createIndex({ eventId: 1 }),
      bookings.createIndex({ 'userInfo.email': 1 })
    ]);

    await events.bulkWrite(
      clone(defaultEvents).map((event) => ({
        updateOne: {
          filter: { id: event.id },
          update: { $setOnInsert: event },
          upsert: true
        }
      }))
    );
  })();

  try {
    await bootstrapPromise;
  } catch (error) {
    bootstrapPromise = undefined;
    throw error;
  }
}

function createBookingId() {
  return `BK-${randomUUID().slice(0, 8).toUpperCase()}`;
}

async function listEvents(category) {
  await ensureSeedData();
  const { events } = await getCollections();
  const query = category && category !== 'All' ? { category } : {};
  const items = await events.find(query, { projection: { _id: 0 } }).toArray();
  return items.map(enrichEvent);
}

async function getEventById(eventId) {
  await ensureSeedData();
  const { events } = await getCollections();
  const event = await events.findOne({ id: eventId }, { projection: { _id: 0 } });
  return event ? enrichEvent(event) : null;
}

async function createBooking(payload) {
  await ensureSeedData();

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    const error = new Error('Missing required fields');
    error.statusCode = 400;
    throw error;
  }

  const eventId = ensureNonEmptyString(payload.eventId, 'Event');
  const ticketType = ensureNonEmptyString(payload.ticketType, 'Ticket type');
  const quantity = parseQuantity(payload.quantity);
  const userInfo = validateUserInfo(payload.userInfo);

  const client = await getMongoClient();
  const db = await getDatabase();
  const events = db.collection('events');
  const bookings = db.collection('bookings');

  const session = client.startSession();

  try {
    let createdBooking;

    await session.withTransaction(async () => {
      const event = await events.findOne({ id: eventId }, { projection: { _id: 0 }, session });

      if (!event) {
        const error = new Error('Event not found');
        error.statusCode = 404;
        throw error;
      }

      const ticket = event.tickets.find((entry) => entry.type === ticketType);

      if (!ticket) {
        const error = new Error('Invalid ticket type');
        error.statusCode = 400;
        throw error;
      }

      const available = ticket.total - ticket.booked;

      if (quantity > available) {
        const error = new Error(`Only ${available} tickets available`);
        error.statusCode = 400;
        throw error;
      }

      const updateResult = await events.updateOne(
        {
          id: eventId,
          tickets: {
            $elemMatch: {
              type: ticketType,
              booked: ticket.booked
            }
          }
        },
        {
          $inc: {
            'tickets.$.booked': quantity
          }
        },
        { session }
      );

      if (updateResult.matchedCount === 0) {
        const refreshedEvent = await events.findOne({ id: eventId }, { projection: { _id: 0 }, session });
        const refreshedTicket = refreshedEvent?.tickets.find((entry) => entry.type === ticketType);
        const currentAvailable = refreshedTicket ? refreshedTicket.total - refreshedTicket.booked : 0;
        const error = new Error(currentAvailable > 0 ? `Only ${currentAvailable} tickets available` : 'Selected tickets are sold out');
        error.statusCode = 409;
        throw error;
      }

      for (let attempts = 0; attempts < 3; attempts += 1) {
        const booking = {
          id: createBookingId(),
          eventId,
          eventTitle: event.title,
          venue: event.venue,
          date: event.date,
          time: event.time,
          ticketType,
          quantity,
          pricePerTicket: ticket.price,
          totalAmount: ticket.price * quantity,
          userInfo,
          bookedAt: new Date().toISOString(),
          status: 'Confirmed'
        };

        try {
          await bookings.insertOne(booking, { session });
          createdBooking = booking;
          return;
        } catch (error) {
          if (error.code !== 11000 || attempts === 2) {
            throw error;
          }
        }
      }
    });

    return createdBooking;
  } finally {
    await session.endSession();
  }
}

async function getBookingById(bookingId) {
  await ensureSeedData();
  const normalizedBookingId = ensureNonEmptyString(bookingId, 'Booking ID');
  const { bookings } = await getCollections();
  return bookings.findOne({ id: normalizedBookingId }, { projection: { _id: 0 } });
}

async function getBookingsByEmail(email) {
  await ensureSeedData();

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    const error = new Error('Email query param required');
    error.statusCode = 400;
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const error = new Error('A valid email query param is required');
    error.statusCode = 400;
    throw error;
  }

  const { bookings } = await getCollections();
  return bookings.find({ 'userInfo.email': normalizedEmail }, { projection: { _id: 0 } }).sort({ bookedAt: -1 }).toArray();
}

async function cancelBooking(bookingId) {
  await ensureSeedData();
  const normalizedBookingId = ensureNonEmptyString(bookingId, 'Booking ID');
  const client = await getMongoClient();
  const db = await getDatabase();
  const events = db.collection('events');
  const bookings = db.collection('bookings');
  const session = client.startSession();

  try {
    let updatedBooking;

    await session.withTransaction(async () => {
      const booking = await bookings.findOne({ id: normalizedBookingId }, { projection: { _id: 0 }, session });

      if (!booking) {
        const error = new Error('Booking not found');
        error.statusCode = 404;
        throw error;
      }

      if (booking.status === 'Cancelled') {
        updatedBooking = booking;
        return;
      }

      const eventUpdate = await events.updateOne(
        {
          id: booking.eventId,
          tickets: {
            $elemMatch: {
              type: booking.ticketType,
              booked: { $gte: booking.quantity }
            }
          }
        },
        { $inc: { 'tickets.$.booked': -booking.quantity } },
        { session }
      );

      if (eventUpdate.matchedCount === 0) {
        const error = new Error('Ticket inventory is inconsistent for this booking');
        error.statusCode = 409;
        throw error;
      }

      await bookings.updateOne(
        { id: normalizedBookingId, status: 'Confirmed' },
        { $set: { status: 'Cancelled', cancelledAt: new Date().toISOString() } },
        { session }
      );

      updatedBooking = await bookings.findOne({ id: normalizedBookingId }, { projection: { _id: 0 }, session });
    });

    return updatedBooking;
  } finally {
    await session.endSession();
  }
}

async function getStats() {
  await ensureSeedData();
  const { events, bookings } = await getCollections();
  const [totalEvents, aggregate] = await Promise.all([
    events.countDocuments(),
    bookings.aggregate([
      { $match: { status: 'Confirmed' } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalTicketsSold: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]).toArray()
  ]);

  const summary = aggregate[0] || {
    totalBookings: 0,
    totalTicketsSold: 0,
    totalRevenue: 0
  };

  return {
    totalEvents,
    totalBookings: summary.totalBookings,
    totalTicketsSold: summary.totalTicketsSold,
    totalRevenue: summary.totalRevenue
  };
}

module.exports = {
  cancelBooking,
  createBooking,
  getBookingById,
  getBookingsByEmail,
  getEventById,
  getStats,
  listEvents
};
