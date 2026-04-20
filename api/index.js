const { URL } = require('url');
const { randomUUID } = require('crypto');

const defaultEvents = [
  {
    id: 'evt-001',
    title: 'Coldplay: Music of the Spheres',
    category: 'Concert',
    venue: 'DY Patil Stadium, Mumbai',
    date: '2026-05-15',
    time: '19:30',
    image: 'concert',
    description: 'Experience the world-famous Coldplay live in concert with their spectacular light show and iconic hits spanning two decades.',
    tickets: [
      { type: 'General', price: 2500, total: 200, booked: 45 },
      { type: 'Premium', price: 6500, total: 100, booked: 30 },
      { type: 'VIP', price: 15000, total: 30, booked: 12 }
    ]
  },
  {
    id: 'evt-002',
    title: 'IPL 2026: MI vs CSK',
    category: 'Sports',
    venue: 'Wankhede Stadium, Mumbai',
    date: '2026-05-22',
    time: '20:00',
    image: 'sports',
    description: 'The ultimate clash of titans! Mumbai Indians face Chennai Super Kings in this high-voltage IPL encounter.',
    tickets: [
      { type: 'General Stand', price: 1200, total: 500, booked: 210 },
      { type: 'Pavilion', price: 3500, total: 200, booked: 88 },
      { type: 'Corporate Box', price: 12000, total: 50, booked: 20 }
    ]
  },
  {
    id: 'evt-003',
    title: 'The Dark Knight Returns - Live Score',
    category: 'Movie',
    venue: 'PVR IMAX, Delhi',
    date: '2026-05-10',
    time: '18:00',
    image: 'movie',
    description: "A cinematic event like no other - Batman's legendary tale screened with Hans Zimmer's iconic score performed live by a full orchestra.",
    tickets: [
      { type: 'Standard', price: 400, total: 150, booked: 60 },
      { type: 'IMAX', price: 850, total: 80, booked: 35 },
      { type: 'Gold Lounge', price: 2200, total: 20, booked: 8 }
    ]
  },
  {
    id: 'evt-004',
    title: 'Arijit Singh Live 2026',
    category: 'Concert',
    venue: 'NSCI Dome, Mumbai',
    date: '2026-06-01',
    time: '20:00',
    image: 'concert',
    description: "India's most loved singer performs his greatest hits in an intimate acoustic evening that will leave you spellbound.",
    tickets: [
      { type: 'Standing', price: 1800, total: 300, booked: 95 },
      { type: 'Seated', price: 4500, total: 150, booked: 40 },
      { type: 'Front Row', price: 9999, total: 40, booked: 15 }
    ]
  },
  {
    id: 'evt-005',
    title: 'Pro Kabaddi League Finals',
    category: 'Sports',
    venue: 'EKA Arena, Ahmedabad',
    date: '2026-05-28',
    time: '21:00',
    image: 'sports',
    description: 'The most anticipated night in kabaddi - two powerhouse teams battle for the ultimate Pro Kabaddi League trophy.',
    tickets: [
      { type: 'East Stand', price: 800, total: 400, booked: 120 },
      { type: 'West Pavilion', price: 2000, total: 180, booked: 60 },
      { type: 'VIP Lounge', price: 8000, total: 40, booked: 18 }
    ]
  },
  {
    id: 'evt-006',
    title: 'Dune: Awakening - Premiere',
    category: 'Movie',
    venue: 'Cinepolis, Bangalore',
    date: '2026-05-05',
    time: '21:30',
    image: 'movie',
    description: 'Be among the first to witness the next chapter of the Dune saga on the grandest screen with Dolby Atmos sound.',
    tickets: [
      { type: 'Standard', price: 350, total: 200, booked: 70 },
      { type: '4DX', price: 950, total: 60, booked: 25 },
      { type: 'Luxury Recliner', price: 1800, total: 30, booked: 10 }
    ]
  }
];

function cloneEvents() {
  return JSON.parse(JSON.stringify(defaultEvents));
}

const state = globalThis.__ticketBookingState || {
  events: cloneEvents(),
  bookings: []
};

globalThis.__ticketBookingState = state;

function setJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(payload));
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

function getEventById(id) {
  return state.events.find((event) => event.id === id);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
    });

    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

function createBookingId() {
  return `BK-${randomUUID().slice(0, 8).toUpperCase()}`;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setJson(res, 200, { success: true });
    return;
  }

  const origin = `https://${req.headers.host || 'localhost'}`;
  const url = new URL(req.url, origin);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'GET' && pathname === '/api/events') {
    const category = url.searchParams.get('category');
    let result = state.events;

    if (category && category !== 'All') {
      result = state.events.filter((event) => event.category === category);
    }

    setJson(res, 200, { success: true, data: result.map(enrichEvent) });
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/api/events/')) {
    const eventId = pathname.split('/').pop();
    const event = getEventById(eventId);

    if (!event) {
      setJson(res, 404, { success: false, message: 'Event not found' });
      return;
    }

    setJson(res, 200, { success: true, data: enrichEvent(event) });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/bookings') {
    let body;

    try {
      body = await parseBody(req);
    } catch (error) {
      setJson(res, 400, { success: false, message: error.message });
      return;
    }

    const { eventId, ticketType, quantity, userInfo } = body;

    if (!eventId || !ticketType || !quantity || !userInfo) {
      setJson(res, 400, { success: false, message: 'Missing required fields' });
      return;
    }

    if (!userInfo.name || !userInfo.email || !userInfo.phone) {
      setJson(res, 400, { success: false, message: 'Name, email and phone are required' });
      return;
    }

    const event = getEventById(eventId);

    if (!event) {
      setJson(res, 404, { success: false, message: 'Event not found' });
      return;
    }

    const ticketIndex = event.tickets.findIndex((ticket) => ticket.type === ticketType);

    if (ticketIndex === -1) {
      setJson(res, 400, { success: false, message: 'Invalid ticket type' });
      return;
    }

    const ticket = event.tickets[ticketIndex];
    const available = ticket.total - ticket.booked;

    if (quantity > available) {
      setJson(res, 400, { success: false, message: `Only ${available} tickets available` });
      return;
    }

    if (quantity < 1 || quantity > 10) {
      setJson(res, 400, { success: false, message: 'Quantity must be between 1 and 10' });
      return;
    }

    event.tickets[ticketIndex].booked += quantity;

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

    state.bookings.push(booking);
    setJson(res, 201, { success: true, data: booking, message: 'Booking confirmed!' });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/bookings') {
    const email = url.searchParams.get('email');

    if (!email) {
      setJson(res, 400, { success: false, message: 'Email query param required' });
      return;
    }

    const userBookings = state.bookings.filter((booking) => booking.userInfo.email === email);
    setJson(res, 200, { success: true, data: userBookings });
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/api/bookings/')) {
    const bookingId = pathname.split('/').pop();
    const booking = state.bookings.find((entry) => entry.id === bookingId);

    if (!booking) {
      setJson(res, 404, { success: false, message: 'Booking not found' });
      return;
    }

    setJson(res, 200, { success: true, data: booking });
    return;
  }

  if (req.method === 'DELETE' && pathname.startsWith('/api/bookings/')) {
    const bookingId = pathname.split('/').pop();
    const bookingIndex = state.bookings.findIndex((entry) => entry.id === bookingId);

    if (bookingIndex === -1) {
      setJson(res, 404, { success: false, message: 'Booking not found' });
      return;
    }

    const booking = state.bookings[bookingIndex];
    const event = getEventById(booking.eventId);

    if (event) {
      const ticketIndex = event.tickets.findIndex((ticket) => ticket.type === booking.ticketType);
      if (ticketIndex !== -1) {
        event.tickets[ticketIndex].booked -= booking.quantity;
      }
    }

    state.bookings[bookingIndex].status = 'Cancelled';
    setJson(res, 200, {
      success: true,
      message: 'Booking cancelled successfully',
      data: state.bookings[bookingIndex]
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/stats') {
    const confirmedBookings = state.bookings.filter((booking) => booking.status === 'Confirmed');
    const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const totalTicketsSold = confirmedBookings.reduce((sum, booking) => sum + booking.quantity, 0);

    setJson(res, 200, {
      success: true,
      data: {
        totalEvents: state.events.length,
        totalBookings: confirmedBookings.length,
        totalTicketsSold,
        totalRevenue
      }
    });
    return;
  }

  setJson(res, 404, { success: false, message: 'Route not found' });
};
