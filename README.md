# Event Ticketing and Seating Management System

## Database Management System (DBMS) Project

The Event Ticketing and Seating Management System is a DBMS project
designed to manage events, users, organizers, venues, seats, ticket
bookings, payments, refunds, and ticket scanning. Its primary focus is
relational database design and SQL operations using MySQL 8.0.

The repository also includes a website interface and a Node.js/Express
backend prototype. The database schema and SQL scripts are the core of
this academic project.

## Project Objectives

-   Design a relational database for an event-ticketing workflow.
-   Store connected information about users, events, venues, seats,
    tickets, payments, refunds, and ticket scans.
-   Apply primary keys, foreign keys, unique constraints, check
    constraints, and indexes.
-   Use SQL joins, filtering, aggregation, and subqueries to retrieve
    useful information.
-   Demonstrate how a unique constraint can prevent duplicate event-seat
    bookings.

## Technology Stack

-   **Database:** MySQL 8.0
-   **Database language:** SQL
-   **Frontend:** HTML, CSS, JavaScript
-   **Backend prototype:** Node.js and Express
-   **Database tools:** MySQL Workbench
-   **Version control:** Git and GitHub

## Database Information

**Database name:** `EventTicketingDB`

The schema contains 11 relational tables:

  -----------------------------------------------------------------------
  Table                               Purpose
  ----------------------------------- -----------------------------------
  `USERS`                             Stores user details and roles such
                                      as Admin, User, and Staff

  `EVENT_CATEGORY`                    Classifies events

  `ORGANIZER`                         Stores event organizer details

  `VENUE`                             Stores venue details and capacity

  `SEAT_CATEGORY`                     Defines seat categories such as
                                      VIP, Gold, and General

  `SEAT`                              Stores seats associated with venues
                                      and seat categories

  `EVENT`                             Stores event schedules and links
                                      events to categories, venues, and
                                      organizers

  `TICKET`                            Records bookings, seats, prices, QR
                                      codes, and booking status

  `PAYMENT`                           Records payment amounts, methods,
                                      statuses, dates, and transaction
                                      IDs

  `REFUND`                            Records refund requests, amounts,
                                      reasons, and statuses

  `SCAN_LOG`                          Records ticket scans, the staff
                                      member scanning, time, and scan
                                      result
  -----------------------------------------------------------------------

## Relationships and Integrity Rules

The database uses foreign keys to connect related records:

-   An event references an event category, venue, and organizer.
-   A seat references a venue and a seat category.
-   A ticket references a user, event, and seat.
-   A payment references a ticket.
-   A refund references a payment.
-   A scan log references a ticket and the user who scanned it.

Integrity rules include primary keys, required fields, unique email
addresses, unique seat numbers within a venue, unique ticket QR codes,
status checks, and non-negative ticket prices.

The `TICKET` table includes this constraint:

``` sql
UNIQUE (event_id, seat_id)
```

It prevents the same seat from being inserted more than once for the
same event. In the current schema, the constraint also blocks rebooking
that seat after its previous ticket is marked Cancelled. This limitation
is useful to note when discussing the database design.

Indexes are defined for ticket lookup by user, event lookup by venue,
payment lookup by ticket, and scan-log lookup by ticket.

## Repository Structure

``` text
.
├── README.md
├── database.sql
├── table_creation.sql
├── insert_data.sql
├── queries.sql
├── index.html
├── about.html
├── services.html
├── legal.html
├── login.html
├── register.html
├── payment.html
├── confirmation.html
├── css/
├── js/
├── images/
├── backend/
└── database/
    ├── schema.sql
    ├── seed.sql
    └── demo_queries.sql
```

The root-level SQL scripts document the database design and sample query
work. The `database/` directory contains schema, seed data, and
demonstration queries used by the website/backend prototype.

## SQL Files

  -----------------------------------------------------------------------
  File                                Description
  ----------------------------------- -----------------------------------
  `database.sql`                      Creates and selects the
                                      `EventTicketingDB` database

  `table_creation.sql`                Creates the 11 tables,
                                      relationships, constraints, and
                                      indexes

  `insert_data.sql`                   Inserts sample records for
                                      demonstration

  `queries.sql`                       Demonstrates joins,
                                      seat-availability lookup, revenue
                                      aggregation, refund lookup, scan
                                      history, and a duplicate-booking
                                      test

  `database/schema.sql`               Schema script used by the prototype

  `database/seed.sql`                 Sample data for the prototype

  `database/demo_queries.sql`         Demonstration queries for the
                                      prototype
  -----------------------------------------------------------------------

## How to Run the SQL Project

1.  Install and start MySQL Server 8.0.
2.  Open MySQL Workbench and connect to your local MySQL instance.
3.  Open and execute `database.sql` to create and select the database.
4.  Execute `table_creation.sql` to create the tables and indexes.
5.  Execute `insert_data.sql` to add the sample records.
6.  Execute statements from `queries.sql` to explore the data and test
    the database rules.

Run the scripts in this order on a fresh database. If using the scripts
in `database/` for the website/backend prototype, follow that
prototype's setup instructions and avoid inserting the same seed data
repeatedly.

**Note:** The final statement in `queries.sql` is a duplicate-booking
test. It attempts to reuse an event-seat pair that already exists, so
MySQL is expected to reject it with a unique-constraint error. Run that
statement separately when demonstrating the constraint.

## Example Database Operations

The included queries demonstrate:

-   Joining tickets with users, events, and seats.
-   Finding seats not assigned to a non-cancelled ticket.
-   Calculating successful payment totals by event.
-   Retrieving refund details alongside the associated user.
-   Reviewing ticket scan history and the staff member who scanned a
    ticket.
-   Testing the unique constraint for duplicate event-seat bookings.

## Academic Scope

This project demonstrates relational schema creation, entity
relationships, referential integrity, constraints, indexes, sample-data
insertion, and SQL queries for an event-ticketing scenario. It is an
academic DBMS prototype, not a production payment or ticketing service.
