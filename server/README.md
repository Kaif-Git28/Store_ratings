# Store Rating App - Backend

This is the backend API for the Store Rating application.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a PostgreSQL database named `store_rating_db`.

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/store_rating_db
   JWT_SECRET=store_rating_jwt_secret_key
   JWT_EXPIRE=30d
   ```

4. Seed the database with initial data:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user

### Stores
- `GET /api/stores` - Get all stores
- `GET /api/stores/:id` - Get a single store
- `POST /api/stores` - Create a new store (store owner only)
- `PUT /api/stores/:id` - Update a store (store owner only)
- `DELETE /api/stores/:id` - Delete a store (store owner or admin only)

### Ratings
- `GET /api/ratings` - Get all ratings (admin only)
- `GET /api/stores/:storeId/ratings` - Get all ratings for a store
- `POST /api/stores/:storeId/ratings` - Add a rating to a store (normal user only)
- `PUT /api/ratings/:id` - Update a rating (owner of rating or admin only)
- `DELETE /api/ratings/:id` - Delete a rating (owner of rating or admin only)

## User Roles

1. **System Administrator**
   - Can view all ratings
   - Can delete any store or rating
   - Cannot rate stores

2. **Normal User**
   - Can rate stores (1-5 stars)
   - Can update or delete their own ratings
   - Cannot create stores

3. **Store Owner**
   - Can create, update, and delete their own stores
   - Cannot rate stores

## Default Users (after seeding)

- Admin: admin@example.com / admin123
- Store Owner: owner@example.com / owner123
- Normal User: user@example.com / user123
- Another Normal User: user2@example.com / user123 