        CREATE TABLE USERS (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(15) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('Admin','User','Staff')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );


        CREATE TABLE EVENT_CATEGORY (
        category_id INT PRIMARY KEY AUTO_INCREMENT,
        category_name VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(255)
        );


        CREATE TABLE ORGANIZER (
        organizer_id INT PRIMARY KEY AUTO_INCREMENT,
        organizer_name VARCHAR(100) NOT NULL,
        phone VARCHAR(15) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        address VARCHAR(255)
        );


        CREATE TABLE VENUE (
        venue_id INT PRIMARY KEY AUTO_INCREMENT,
        venue_name VARCHAR(100) NOT NULL,
        address VARCHAR(255) NOT NULL,
        city VARCHAR(50) NOT NULL,
        capacity INT NOT NULL CHECK (capacity > 0)
        );


        CREATE TABLE SEAT_CATEGORY (
        category_id INT PRIMARY KEY AUTO_INCREMENT,
        category_name VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(255)
        );


        CREATE TABLE SEAT (
         seat_id INT PRIMARY KEY AUTO_INCREMENT,
         venue_id INT NOT NULL,
         category_id INT NOT NULL,
         seat_number VARCHAR(10) NOT NULL,
         seat_type VARCHAR(30) NOT NULL,
         UNIQUE (venue_id, seat_number),
         FOREIGN KEY (venue_id) REFERENCES VENUE(venue_id),
         FOREIGN KEY (category_id) REFERENCES SEAT_CATEGORY(category_id)
         );


        CREATE TABLE EVENT (
        event_id INT PRIMARY KEY AUTO_INCREMENT,
        event_name VARCHAR(150) NOT NULL,
        description TEXT,
        event_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        category_id INT NOT NULL,
        venue_id INT NOT NULL,
        organizer_id INT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES EVENT_CATEGORY(category_id),
        FOREIGN KEY (venue_id) REFERENCES VENUE(venue_id),
        FOREIGN KEY (organizer_id) REFERENCES ORGANIZER(organizer_id)
        );


        CREATE TABLE TICKET (
        ticket_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        event_id INT NOT NULL,
        seat_id INT NOT NULL,
        booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        qr_code VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'Booked'
             CHECK (status IN ('Booked','Cancelled','Used')),
         price DECIMAL(10,2) NOT NULL
            CHECK (price >= 0),
         UNIQUE (event_id, seat_id),
        FOREIGN KEY (user_id) REFERENCES USERS(user_id),
        FOREIGN KEY (event_id) REFERENCES EVENT(event_id),
        FOREIGN KEY (seat_id) REFERENCES SEAT(seat_id)
        );


        CREATE TABLE PAYMENT (
        payment_id INT PRIMARY KEY AUTO_INCREMENT,
        ticket_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        payment_method VARCHAR(20) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'Pending'
            CHECK (payment_status IN ('Pending','Success','Failed')),
         payment_date DATETIME,
         transaction_id VARCHAR(50) UNIQUE,
         FOREIGN KEY (ticket_id) REFERENCES TICKET(ticket_id)
     );


        CREATE TABLE REFUND (
        refund_id INT PRIMARY KEY AUTO_INCREMENT,
        payment_id INT NOT NULL,
        refund_amount DECIMAL(10,2) NOT NULL CHECK (refund_amount > 0),
        refund_date DATETIME,
        refund_status VARCHAR(20) DEFAULT 'Requested'
            CHECK (refund_status IN ('Requested','Approved','Rejected','Processed')),
        reason VARCHAR(255),
        FOREIGN KEY (payment_id) REFERENCES PAYMENT(payment_id)
        );


        CREATE TABLE SCAN_LOG (
        scan_id INT PRIMARY KEY AUTO_INCREMENT,
        ticket_id INT NOT NULL,
        scanned_by INT NOT NULL,
         scan_time DATETIME DEFAULT CURRENT_TIMESTAMP,
         scan_status VARCHAR(20) NOT NULL
            CHECK (scan_status IN ('Valid','Invalid','Duplicate')),
         FOREIGN KEY (ticket_id) REFERENCES TICKET(ticket_id),
         FOREIGN KEY (scanned_by) REFERENCES USERS(user_id)
     );
CREATE INDEX idx_ticket_user ON TICKET(user_id);
CREATE INDEX idx_event_venue ON EVENT(venue_id);
CREATE INDEX idx_payment_ticket ON PAYMENT(ticket_id);
CREATE INDEX idx_scan_ticket ON SCAN_LOG(ticket_id);
