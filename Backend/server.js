const express = require('express');
const path = require('path');
const {
  cancelBooking,
  createBooking,
  getBookingById,
  getBookingsByEmail,
  getEventById,
  getStats,
  listEvents
} = require('../lib/ticket-service');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../Frontend')));

app.get('/api/events', async (req, res) => {
  try {
    const data = await listEvents(req.query.category);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const data = await getEventById(req.params.id);

    if (!data) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const data = await createBooking(req.body);
    res.status(201).json({ success: true, data, message: 'Booking confirmed!' });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  try {
    const data = await getBookingById(req.params.id);

    if (!data) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const data = await getBookingsByEmail(req.query.email);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const data = await cancelBooking(req.params.id);
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const data = await getStats();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Ticket Booking API running at http://localhost:${PORT}`);
});
