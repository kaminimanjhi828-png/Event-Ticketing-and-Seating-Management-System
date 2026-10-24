require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'EventTicketingDB',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true
});

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get('/api/health', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query('SELECT DATABASE() AS database_name, NOW() AS server_time');
  res.json({ ok: true, database: rows[0].database_name, serverTime: rows[0].server_time });
}));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const fullName = String(req.body.fullName || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').trim();
  const password = String(req.body.password || '');
  if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || phone.length < 7 || password.length < 8) {
    return res.status(400).json({ error: 'Enter a name, valid email, phone number and password of at least 8 characters.' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.execute(
      'INSERT INTO USERS(full_name,email,phone,password,role) VALUES(?,?,?,?,?)',
      [fullName, email, phone, hash, 'User']
    );
    res.status(201).json({ message: 'Registration successful.', user: { user_id: result.insertId, full_name: fullName, email, phone, role: 'User' } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'An account with this email already exists.' });
    throw err;
  }
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const [rows] = await pool.execute('SELECT user_id,full_name,email,phone,password,role FROM USERS WHERE email=? LIMIT 1', [email]);
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) return res.status(401).json({ error: 'Email or password is incorrect.' });
  const user = rows[0];
  res.json({ message: 'Login successful.', user: { user_id: user.user_id, full_name: user.full_name, email: user.email, phone: user.phone, role: user.role } });
}));

app.get('/api/events', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT e.event_id, e.event_name, e.description, e.event_date, e.start_time, e.end_time,
           e.base_price, c.category_name, v.venue_id, v.venue_name, v.city,
           (SELECT COUNT(*) FROM SEAT s WHERE s.venue_id=v.venue_id) AS seat_count,
           (SELECT COUNT(*) FROM TICKET t WHERE t.event_id=e.event_id AND t.status IN ('Booked','Used')) AS sold_count
    FROM EVENT e JOIN EVENT_CATEGORY c ON c.category_id=e.category_id
    JOIN VENUE v ON v.venue_id=e.venue_id ORDER BY e.event_date, e.start_time`);
  res.json(rows);
}));

app.get('/api/events/:eventId/seats', asyncRoute(async (req, res) => {
  const eventId = Number(req.params.eventId);
  if (!Number.isInteger(eventId) || eventId < 1) return res.status(400).json({ error: 'Invalid event ID.' });
  const [rows] = await pool.execute(`
    SELECT s.seat_id, s.seat_number, s.seat_type,
           CASE WHEN t.ticket_id IS NULL THEN 1 ELSE 0 END AS available
    FROM EVENT e JOIN SEAT s ON s.venue_id=e.venue_id
    LEFT JOIN TICKET t ON t.event_id=e.event_id AND t.seat_id=s.seat_id AND t.status IN ('Booked','Used')
    WHERE e.event_id=? ORDER BY s.seat_number`, [eventId]);
  if (!rows.length) {
    const [event] = await pool.execute('SELECT event_id FROM EVENT WHERE event_id=?', [eventId]);
    if (!event.length) return res.status(404).json({ error: 'Event not found.' });
  }
  res.json(rows);
}));

app.post('/api/bookings', asyncRoute(async (req, res) => {
  const userId = Number(req.body.userId);
  const eventId = Number(req.body.eventId);
  const seatIds = Array.isArray(req.body.seatIds) ? [...new Set(req.body.seatIds.map(Number))] : [];
  const paymentMethod = String(req.body.paymentMethod || 'Demo').slice(0, 20);
  if (!Number.isInteger(userId) || userId < 1 || !Number.isInteger(eventId) || eventId < 1 || !seatIds.length || seatIds.some(id => !Number.isInteger(id) || id < 1)) {
    return res.status(400).json({ error: 'A logged-in user, event and at least one valid seat are required.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [users] = await conn.execute('SELECT user_id FROM USERS WHERE user_id=?', [userId]);
    const [events] = await conn.execute('SELECT event_id,venue_id,base_price,event_name,event_date FROM EVENT WHERE event_id=? FOR UPDATE', [eventId]);
    if (!users.length) { await conn.rollback(); return res.status(401).json({ error: 'Please register or log in again.' }); }
    if (!events.length) { await conn.rollback(); return res.status(404).json({ error: 'Event not found.' }); }
    const event = events[0];
    const placeholders = seatIds.map(() => '?').join(',');
    const [seats] = await conn.query(`SELECT seat_id,seat_number FROM SEAT WHERE venue_id=? AND seat_id IN (${placeholders}) FOR UPDATE`, [event.venue_id, ...seatIds]);
    if (seats.length !== seatIds.length) { await conn.rollback(); return res.status(400).json({ error: 'One or more selected seats do not belong to this event venue.' }); }
    const [taken] = await conn.query(`SELECT seat_id FROM TICKET WHERE event_id=? AND seat_id IN (${placeholders}) AND status IN ('Booked','Used')`, [eventId, ...seatIds]);
    if (taken.length) { await conn.rollback(); return res.status(409).json({ error: 'One or more seats have just been booked. Refresh the seat map and try again.' }); }

    const reference = 'EVT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const created = [];
    const ticketPrice = Number(event.base_price);
    const total = ticketPrice * seats.length + 50;
    for (let seatIndex = 0; seatIndex < seats.length; seatIndex++) {
      const seat = seats[seatIndex];
      const qr = 'EVTQ-' + crypto.randomBytes(8).toString('hex').toUpperCase();
      const [ticketResult] = await conn.execute(
        'INSERT INTO TICKET(user_id,event_id,seat_id,qr_code,status,price) VALUES(?,?,?,?,?,?)',
        [userId,eventId,seat.seat_id,qr,'Booked',ticketPrice]
      );
      const transactionId = 'DEMO-' + crypto.randomBytes(8).toString('hex').toUpperCase();
      await conn.execute(
        'INSERT INTO PAYMENT(ticket_id,amount,payment_method,payment_status,payment_date,transaction_id) VALUES(?,?,?,?,NOW(),?)',
        [ticketResult.insertId, ticketPrice + (seatIndex === 0 ? 50 : 0), paymentMethod, 'Success', transactionId]
      );
      created.push({ ticketId: ticketResult.insertId, seat: seat.seat_number, qrCode: qr });
    }
    await conn.commit();
    res.status(201).json({ message: 'Demo payment successful and booking saved in MySQL.', reference, eventName: event.event_name, eventDate: event.event_date, seats: created.map(x => x.seat), tickets: created, quantity: created.length, subtotal: ticketPrice * created.length, fee: 50, total, paymentStatus: 'Success' });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A selected seat is already booked. Refresh and choose another seat.' });
    throw err;
  } finally { conn.release(); }
}));

app.get('/api/users/:userId/bookings', asyncRoute(async (req, res) => {
  const userId = Number(req.params.userId);
  const [rows] = await pool.execute(`
    SELECT t.ticket_id,t.qr_code,t.status AS ticket_status,t.price,t.booking_date,
           e.event_name,e.event_date,v.venue_name,s.seat_number,p.payment_id,p.amount,p.payment_method,p.payment_status,p.transaction_id
    FROM TICKET t JOIN EVENT e ON e.event_id=t.event_id JOIN VENUE v ON v.venue_id=e.venue_id
    JOIN SEAT s ON s.seat_id=t.seat_id LEFT JOIN PAYMENT p ON p.ticket_id=t.ticket_id
    WHERE t.user_id=? ORDER BY t.booking_date DESC,t.ticket_id DESC`, [userId]);
  res.json(rows);
}));

app.get('/api/admin/summary', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`SELECT
    (SELECT COUNT(*) FROM USERS) users,
    (SELECT COUNT(*) FROM EVENT) events,
    (SELECT COUNT(*) FROM TICKET WHERE status IN ('Booked','Used')) tickets,
    (SELECT COUNT(*) FROM PAYMENT WHERE payment_status='Success') successful_payments,
    (SELECT COALESCE(SUM(amount),0) FROM PAYMENT WHERE payment_status='Success') revenue`);
  res.json(rows[0]);
}));

app.use('/api', (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server or database error. Check MySQL is running and your backend/.env settings are correct.' });
});

const port = Number(process.env.PORT || 3000);
(async () => {
  try {
    await pool.query('SELECT 1');
    app.listen(port, () => console.log(`Eventify running at http://localhost:${port}`));
  } catch (err) {
    console.error('Could not connect to MySQL. Check backend/.env and ensure the schema has been imported.');
    console.error(err.message);
    process.exit(1);
  }
})();
