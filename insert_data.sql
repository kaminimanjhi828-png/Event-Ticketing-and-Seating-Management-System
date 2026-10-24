-- USERS
INSERT INTO USERS (full_name, email, phone, password, role) VALUES
('Ashika Jyoti', 'ashika@email.com', '9876543210', 'hash_1', 'User'),
('Rohan Verma', 'rohan@email.com', '9876500001', 'hash_2', 'User'),
('Neha Sharma', 'neha@email.com', '9876500002', 'hash_3', 'Staff'),
('Admin One', 'admin@email.com', '9876500003', 'hash_4', 'Admin');


-- EVENT_CATEGORY
INSERT INTO EVENT_CATEGORY (category_name, description) VALUES
('Concert', 'Live music shows'),
('Sports', 'Matches and tournaments'),
('Theatre', 'Plays and stage shows');


-- ORGANIZER
INSERT INTO ORGANIZER (organizer_name, phone, email, address) VALUES
('StarLive Events', '9811100001', 'info@starlive.com', 'Bhopal, MP'),
('City Sports Club', '9811100002', 'contact@citysports.com', 'Indore, MP');


-- VENUE
INSERT INTO VENUE (venue_name, address, city, capacity) VALUES
('Rang Bhawan Auditorium', 'Shamla Hills', 'Bhopal', 500),
('Nehru Stadium', 'AB Road', 'Indore', 20000);


-- SEAT_CATEGORY
INSERT INTO SEAT_CATEGORY (category_name, description) VALUES
('VIP', 'Front row premium seats'),
('Gold', 'Middle section seats'),
('General', 'Standard seats');


-- SEAT
INSERT INTO SEAT (venue_id, category_id, seat_number, seat_type) VALUES
(1, 1, 'A1', 'Recliner'),
(1, 1, 'A2', 'Recliner'),
(1, 2, 'B1', 'Standard'),
(1, 3, 'C1', 'Standard'),
(2, 3, 'G1', 'Standard');


-- EVENT
INSERT INTO EVENT
(event_name, description, event_date, start_time, end_time, category_id, venue_id, organizer_id)
VALUES
('Sufi Night', 'Evening of Sufi music', '2026-11-20', '19:00:00', '22:00:00', 1, 1, 1),
('City Cup Final', 'Football final', '2026-12-05', '16:00:00', '18:30:00', 2, 2, 2);


-- TICKET
INSERT INTO TICKET
(user_id, event_id, seat_id, qr_code, status, price)
VALUES
(1, 1, 1, 'QR-0001', 'Booked', 1500.00),
(2, 1, 3, 'QR-0002', 'Booked', 1000.00),
(1, 1, 4, 'QR-0003', 'Cancelled', 500.00);


-- PAYMENT
INSERT INTO PAYMENT
(ticket_id, amount, payment_method, payment_status, payment_date, transaction_id)
VALUES
(1, 1500.00, 'UPI', 'Success', '2026-10-01 10:30:00', 'TXN1001'),
(2, 1000.00, 'Card', 'Success', '2026-10-02 12:15:00', 'TXN1002'),
(3, 500.00, 'UPI', 'Success', '2026-10-02 18:00:00', 'TXN1003');


-- REFUND
INSERT INTO REFUND
(payment_id, refund_amount, refund_date, refund_status, reason)
VALUES
(3, 500.00, '2026-10-03 09:00:00', 'Processed', 'Ticket cancelled by user');


-- SCAN_LOG
INSERT INTO SCAN_LOG
(ticket_id, scanned_by, scan_status)
VALUES
(1, 3, 'Valid'),
(1, 3, 'Duplicate');