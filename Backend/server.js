const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ─── In-memory database ───────────────────────────────────────────────────────

let events = [
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
    title: 'The Dark Knight Returns – Live Score',
    category: 'Movie',
    venue: 'PVR IMAX, Delhi',
    date: '2026-05-10',
    time: '18:00',
    image: 'movie',
    description: "A cinematic event like no other — Batman's legendary tale screened with Hans Zimmer's iconic score performed live by a full orchestra.",
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
    description: 'India\'s most loved singer performs his greatest hits in an intimate acoustic evening that will leave you spellbound.',
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
    description: 'The most anticipated night in kabaddi — two powerhouse teams battle for the ultimate Pro Kabaddi League trophy.',
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

let bookings = [];

// ─── Helper ───────────────────────────────────────────────────────────────────
function getEventById(id) {
  return events.find(e => e.id === id);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET all events (with optional category filter)
app.get('/api/events', (req, res) => {
  const { category } = req.query;
  let result = events;
  if (category && category !== 'All') {
    result = events.filter(e => e.category === category);
  }
  // Return events with availability info
  const enriched = result.map(e => ({
    ...e,
    tickets: e.tickets.map(t => ({
      ...t,
      available: t.total - t.booked
    }))
  }));
  res.json({ success: true, data: enriched });
});

// GET single event
app.get('/api/events/:id', (req, res) => {
  const event = getEventById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  const enriched = {
    ...event,
    tickets: event.tickets.map(t => ({ ...t, available: t.total - t.booked }))
  };
  res.json({ success: true, data: enriched });
});

// POST book tickets
app.post('/api/bookings', (req, res) => {
  const { eventId, ticketType, quantity, userInfo } = req.body;

  if (!eventId || !ticketType || !quantity || !userInfo) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  if (!userInfo.name || !userInfo.email || !userInfo.phone) {
    return res.status(400).json({ success: false, message: 'Name, email and phone are required' });
  }

  const event = getEventById(eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  const ticketIndex = event.tickets.findIndex(t => t.type === ticketType);
  if (ticketIndex === -1) return res.status(400).json({ success: false, message: 'Invalid ticket type' });

  const ticket = event.tickets[ticketIndex];
  const available = ticket.total - ticket.booked;

  if (quantity > available) {
    return res.status(400).json({ success: false, message: `Only ${available} tickets available` });
  }
  if (quantity < 1 || quantity > 10) {
    return res.status(400).json({ success: false, message: 'Quantity must be between 1 and 10' });
  }

  // Update availability
  event.tickets[ticketIndex].booked += quantity;

  const booking = {
    id: `BK-${uuidv4().slice(0, 8).toUpperCase()}`,
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

  bookings.push(booking);
  res.status(201).json({ success: true, data: booking, message: 'Booking confirmed!' });
});

// GET booking by ID
app.get('/api/bookings/:id', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  res.json({ success: true, data: booking });
});

// GET all bookings for an email
app.get('/api/bookings', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, message: 'Email query param required' });
  const userBookings = bookings.filter(b => b.userInfo.email === email);
  res.json({ success: true, data: userBookings });
});

// DELETE cancel booking
app.delete('/api/bookings/:id', (req, res) => {
  const index = bookings.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Booking not found' });

  const booking = bookings[index];
  // Restore seat availability
  const event = getEventById(booking.eventId);
  if (event) {
    const ticketIndex = event.tickets.findIndex(t => t.type === booking.ticketType);
    if (ticketIndex !== -1) event.tickets[ticketIndex].booked -= booking.quantity;
  }

  bookings[index].status = 'Cancelled';
  res.json({ success: true, message: 'Booking cancelled successfully', data: bookings[index] });
});

// GET stats (admin)
app.get('/api/stats', (req, res) => {
  const totalRevenue = bookings
    .filter(b => b.status === 'Confirmed')
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const totalBookings = bookings.filter(b => b.status === 'Confirmed').length;
  const totalTicketsSold = bookings
    .filter(b => b.status === 'Confirmed')
    .reduce((sum, b) => sum + b.quantity, 0);

  res.json({
    success: true,
    data: {
      totalEvents: events.length,
      totalBookings,
      totalTicketsSold,
      totalRevenue
    }
  });
});

// Catch-all: serve frontend
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎟️  Ticket Booking API running at http://localhost:${PORT}`);
  console.log(`📡  API Endpoints:`);
  console.log(`    GET  /api/events`);
  console.log(`    GET  /api/events/:id`);
  console.log(`    POST /api/bookings`);
  console.log(`    GET  /api/bookings/:id`);
  console.log(`    GET  /api/bookings?email=...`);
  console.log(`    DELETE /api/bookings/:id`);
  console.log(`    GET  /api/stats\n`);
});