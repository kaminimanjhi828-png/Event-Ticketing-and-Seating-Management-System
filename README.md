# Event Ticketing and Seating Management System

## Project Overview

The Event Ticketing and Seating Management System is a database management system designed to manage events, users, venues, seats, tickets, payments, refunds, and ticket scanning.

The system helps prevent duplicate seat booking and maintains organized event and ticketing information.

## Technologies Used

- MySQL 8.0
- SQL
- GitHub

## Database Name

EventTicketingDB

## Main Features

- User management
- Event category management
- Organizer management
- Venue management
- Seat and seat category management
- Event management
- Ticket booking
- Payment management
- Refund management
- Ticket scanning
- Double booking prevention

## Database Tables

The database contains the following 11 tables:

1. USERS
2. EVENT_CATEGORY
3. ORGANIZER
4. VENUE
5. SEAT_CATEGORY
6. SEAT
7. EVENT
8. TICKET
9. PAYMENT
10. REFUND
11. SCAN_LOG

## SQL Files

| File | Description |
|---|---|
| `database.sql` | Database creation |
| `table_creation.sql` | Table and index creation |
| `sample_data.sql` | Sample data insertion |
| `queries.sql` | Sample queries and double booking test |

## Key Database Feature

The `TICKET` table uses a unique constraint on:

```sql
UNIQUE (event_id, seat_id)