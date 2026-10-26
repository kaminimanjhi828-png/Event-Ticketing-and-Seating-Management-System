USE EventTicketingDB;

-- 1. Verify registered users (password hashes intentionally excluded).
SELECT user_id, full_name, email, phone, role, created_at
FROM USERS ORDER BY user_id DESC;

-- 2. Events are joined to category, venue and organizer.
SELECT e.event_id, e.event_name, c.category_name, v.venue_name,
       e.event_date, e.start_time, e.end_time, e.base_price
FROM EVENT e
JOIN EVENT_CATEGORY c ON c.category_id=e.category_id
JOIN VENUE v ON v.venue_id=e.venue_id
ORDER BY e.event_date;

-- 3. Check seats and their availability for a given event ID (replace 1 if needed).
SELECT e.event_name, s.seat_id, s.seat_number,
       CASE WHEN t.ticket_id IS NULL THEN 'Available' ELSE t.status END AS seat_status
FROM EVENT e
JOIN SEAT s ON s.venue_id=e.venue_id
LEFT JOIN TICKET t ON t.event_id=e.event_id AND t.seat_id=s.seat_id
  AND t.status IN ('Booked','Used')
WHERE e.event_id=1
ORDER BY s.seat_number;

-- 4. Ticket/payment records joined with user, event, venue and seat.
SELECT u.full_name, u.email, e.event_name, v.venue_name, s.seat_number,
       t.ticket_id, t.qr_code, t.status AS ticket_status, t.price,
       p.payment_id, p.amount, p.payment_method, p.payment_status,
       p.transaction_id, p.payment_date
FROM TICKET t
JOIN USERS u ON u.user_id=t.user_id
JOIN EVENT e ON e.event_id=t.event_id
JOIN VENUE v ON v.venue_id=e.venue_id
JOIN SEAT s ON s.seat_id=t.seat_id
LEFT JOIN PAYMENT p ON p.ticket_id=t.ticket_id
ORDER BY t.booking_date DESC;

-- 5. Revenue by event, based on successful demo payment rows.
SELECT e.event_name, COUNT(DISTINCT t.ticket_id) AS tickets_sold,
       COALESCE(SUM(p.amount),0) AS recorded_payment_total
FROM EVENT e
LEFT JOIN TICKET t ON t.event_id=e.event_id AND t.status IN ('Booked','Used')
LEFT JOIN PAYMENT p ON p.ticket_id=t.ticket_id AND p.payment_status='Success'
GROUP BY e.event_id,e.event_name
ORDER BY recorded_payment_total DESC;

-- 6. User booking history.
SELECT u.full_name, t.ticket_id, e.event_name, s.seat_number,
       t.booking_date, t.price, t.status
FROM USERS u
JOIN TICKET t ON t.user_id=u.user_id
JOIN EVENT e ON e.event_id=t.event_id
JOIN SEAT s ON s.seat_id=t.seat_id
WHERE u.email='replace-with-demo-email@example.com'
ORDER BY t.booking_date DESC;

-- 7. Database-level summary.
SELECT (SELECT COUNT(*) FROM USERS) AS users,
       (SELECT COUNT(*) FROM EVENT) AS events,
       (SELECT COUNT(*) FROM TICKET) AS tickets,
       (SELECT COUNT(*) FROM PAYMENT WHERE payment_status='Success') AS successful_payments,
       (SELECT COALESCE(SUM(amount),0) FROM PAYMENT WHERE payment_status='Success') AS recorded_revenue;
