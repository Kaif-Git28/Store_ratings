const { sequelize } = require('../config/db');
const { User, ROLES, Store, Rating } = require('../models');
const bcrypt = require('bcryptjs');

// Seed database with initial data
const seedDatabase = async () => {
  try {
    // Sync database
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: ROLES.ADMIN
    });
    console.log('Admin user created');

    // Create store owner
    const ownerPassword = await bcrypt.hash('owner123', 10);
    const storeOwner = await User.create({
      name: 'Store Owner',
      email: 'owner@example.com',
      password: ownerPassword,
      role: ROLES.STORE_OWNER
    });
    console.log('Store owner created');

    // Create normal user
    const userPassword = await bcrypt.hash('user123', 10);
    const normalUser = await User.create({
      name: 'Normal User',
      email: 'user@example.com',
      password: userPassword,
      role: ROLES.NORMAL_USER
    });
    console.log('Normal user created');

    // Create another normal user
    const user2Password = await bcrypt.hash('user123', 10);
    const normalUser2 = await User.create({
      name: 'Another User',
      email: 'user2@example.com',
      password: user2Password,
      role: ROLES.NORMAL_USER
    });
    console.log('Second normal user created');

    // Create stores
    const store1 = await Store.create({
      name: 'Tech Store',
      description: 'A store selling the latest tech gadgets',
      address: '123 Tech St, Tech City',
      ownerId: storeOwner.id
    });
    console.log('Tech Store created');

    const store2 = await Store.create({
      name: 'Book Store',
      description: 'A store with a wide range of books',
      address: '456 Book St, Book City',
      ownerId: storeOwner.id
    });
    console.log('Book Store created');

    // Create ratings
    await Rating.create({
      score: 5,
      comment: 'Great tech products and service!',
      userId: normalUser.id,
      storeId: store1.id
    });
    console.log('Rating 1 created');

    await Rating.create({
      score: 4,
      comment: 'Good selection of books',
      userId: normalUser.id,
      storeId: store2.id
    });
    console.log('Rating 2 created');

    await Rating.create({
      score: 3,
      comment: 'Average experience, could be better',
      userId: normalUser2.id,
      storeId: store1.id
    });
    console.log('Rating 3 created');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 