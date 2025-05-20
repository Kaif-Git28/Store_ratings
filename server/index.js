const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./config/db');
const { User, ROLES, Store, Rating } = require('./models');

// Load environment variables
dotenv.config();

// Import route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const storeRoutes = require('./routes/storeRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Initialize app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Store ratings routes (nested)
app.use('/api/stores/:storeId/ratings', require('./routes/ratingRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Store Rating API' });
});

// Sync database models and initialize with sample data
const syncDatabase = async () => {
  try {
    // Sync all models with { alter: true } to avoid data loss
    await sequelize.sync({ alter: true });
    console.log('Database synced');
    
    // Check if we need to seed initial data
    const adminCount = await User.count({ where: { role: ROLES.ADMIN } });
    
    if (adminCount === 0) {
      console.log('No admin users found, seeding initial data...');
      
      // Create admin user
      await User.create({
        name: "System Administrator",
        email: "admin@example.com",
        password: "Admin123!",
        role: ROLES.ADMIN
      });
  
      // Create store owner
      const storeOwner = await User.create({
        name: "Store Owner",
        email: "owner@example.com",
        password: "Owner123!",
        role: ROLES.STORE_OWNER
      });
  
      // Create normal user
      const normalUser = await User.create({
        name: "Regular User",
        email: "user@example.com",
        password: "User123!",
        role: ROLES.NORMAL_USER
      });
  
      // Create some stores
      const store1 = await Store.create({
        name: "Coffee Shop",
        description: "A cozy coffee shop with great atmosphere",
        address: "123 Main St, City",
        ownerId: storeOwner.id
      });
  
      const store2 = await Store.create({
        name: "Book Store",
        description: "Wide selection of books for all ages",
        address: "456 Oak Ave, City",
        ownerId: storeOwner.id
      });
  
      // Create some ratings
      await Rating.create({
        score: 5,
        comment: "Great service and atmosphere!",
        userId: normalUser.id,
        storeId: store1.id
      });
  
      await Rating.create({
        score: 4,
        comment: "Good selection but prices are a bit high",
        userId: normalUser.id,
        storeId: store2.id
      });
      
      console.log('Sample data created successfully');
    }
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

syncDatabase();

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Serve React app for any request not handled by API routes in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} 