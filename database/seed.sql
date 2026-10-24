USE EventTicketingDB;

INSERT IGNORE INTO EVENT_CATEGORY(category_name, description) VALUES
('Music','Live music and concerts'),('Technology','Technology and developer events'),('Sports','Sports and championships'),('Workshop','Hands-on learning'),('Food','Food and cultural festivals'),('Comedy','Stand-up comedy');
INSERT IGNORE INTO SEAT_CATEGORY(category_name, description) VALUES
('Standard','Standard seating'),('Premium','Premium seating');
INSERT IGNORE INTO ORGANIZER(organizer_name, phone, email, address) VALUES
('Astra Events','9999000001','events@astra.example','Bhopal, Madhya Pradesh');

INSERT INTO VENUE(venue_name,address,city,capacity)
SELECT v.venue_name, v.address, 'Bhopal', 40 FROM (
 SELECT 'Astra Arena' venue_name, 'Central Bhopal' address UNION ALL
 SELECT 'Innovation Convention Centre','MP Nagar, Bhopal' UNION ALL
 SELECT 'City Sports Stadium','TT Nagar, Bhopal' UNION ALL
 SELECT 'The Creative Studio','Arera Colony, Bhopal' UNION ALL
 SELECT 'Central Gardens','New Market, Bhopal' UNION ALL
 SELECT 'Laugh House Auditorium','Bhopal, Madhya Pradesh'
) v WHERE NOT EXISTS (SELECT 1 FROM VENUE x WHERE x.venue_name=v.venue_name);

INSERT INTO EVENT(event_name,description,event_date,start_time,end_time,category_id,venue_id,organizer_id,base_price)
SELECT x.event_name,x.description,x.event_date,x.start_time,x.end_time,c.category_id,v.venue_id,o.organizer_id,x.base_price
FROM (
 SELECT 'Live Music Concert' event_name,'An unforgettable evening filled with live performances and great music.' description,'2026-11-07' event_date,'18:00:00' start_time,'21:00:00' end_time,'Music' category_name,'Astra Arena' venue_name,999.00 base_price UNION ALL
 SELECT 'Tech Conference 2026','Discover new technologies and connect with developers and industry experts.','2026-11-14','09:00:00','17:00:00','Technology','Innovation Convention Centre',799.00 UNION ALL
 SELECT 'Championship Night','Experience the energy of a thrilling championship event with fellow fans.','2026-11-21','17:00:00','21:00:00','Sports','City Sports Stadium',599.00 UNION ALL
 SELECT 'Creative Art Workshop','Learn new creative skills while meeting other passionate artists and creators.','2026-11-28','10:00:00','14:00:00','Workshop','The Creative Studio',499.00 UNION ALL
 SELECT 'City Food Festival','Taste exciting flavours, local favourites and delicious street-food creations.','2026-12-05','11:00:00','20:00:00','Food','Central Gardens',399.00 UNION ALL
 SELECT 'Stand-Up Comedy Night','Take a break, laugh out loud and enjoy a night of live comedy.','2026-12-12','19:00:00','21:00:00','Comedy','Laugh House Auditorium',699.00
) x JOIN EVENT_CATEGORY c ON c.category_name=x.category_name JOIN VENUE v ON v.venue_name=x.venue_name JOIN ORGANIZER o ON o.email='events@astra.example'
WHERE NOT EXISTS (SELECT 1 FROM EVENT e WHERE e.event_name=x.event_name);

-- Create 40 seats (A1-H5) for every seeded venue, only when they do not already exist.
INSERT INTO SEAT(venue_id,category_id,seat_number,seat_type)
SELECT v.venue_id, sc.category_id, CONCAT(CHAR(65 + rows_data.r), rows_data.n), 'Standard'
FROM VENUE v
JOIN SEAT_CATEGORY sc ON sc.category_name='Standard'
JOIN (
 SELECT a.n + b.n*10 n, c.n r FROM
 (SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5) a
 CROSS JOIN (SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7) c
 CROSS JOIN (SELECT 0 n) b
) rows_data ON rows_data.n BETWEEN 1 AND 5 AND rows_data.r BETWEEN 0 AND 7
WHERE NOT EXISTS (SELECT 1 FROM SEAT s WHERE s.venue_id=v.venue_id AND s.seat_number=CONCAT(CHAR(65 + rows_data.r), rows_data.n));
