const { URL } = require('url');
const {
  cancelBooking,
  createBooking,
  getBookingById,
  getBookingsByEmail,
  getEventById,
  getStats,
  listEvents
} = require('../lib/ticket-service');

function setJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let size = 0;
    const maxSize = 1024 * 1024;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxSize) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
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

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const origin = `https://${req.headers.host || 'localhost'}`;
    const url = new URL(req.url, origin);
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    if (req.method === 'GET' && pathname === '/api/events') {
      const category = url.searchParams.get('category');
      const data = await listEvents(category);
      setJson(res, 200, { success: true, data });
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/events/')) {
      const eventId = pathname.split('/').pop();
      const data = await getEventById(eventId);

      if (!data) {
        setJson(res, 404, { success: false, message: 'Event not found' });
        return;
      }

      setJson(res, 200, { success: true, data });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/bookings') {
      const body = await parseBody(req);
      const data = await createBooking(body);
      setJson(res, 201, { success: true, data, message: 'Booking confirmed!' });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/bookings') {
      const email = url.searchParams.get('email');
      const data = await getBookingsByEmail(email);
      setJson(res, 200, { success: true, data });
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/api/bookings/')) {
      const bookingId = pathname.split('/').pop();
      const data = await getBookingById(bookingId);

      if (!data) {
        setJson(res, 404, { success: false, message: 'Booking not found' });
        return;
      }

      setJson(res, 200, { success: true, data });
      return;
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/bookings/')) {
      const bookingId = pathname.split('/').pop();
      const data = await cancelBooking(bookingId);
      setJson(res, 200, {
        success: true,
        message: 'Booking cancelled successfully',
        data
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/stats') {
      const data = await getStats();
      setJson(res, 200, { success: true, data });
      return;
    }

    setJson(res, 404, { success: false, message: 'Route not found' });
  } catch (error) {
    setJson(res, error.statusCode || 500, {
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};
