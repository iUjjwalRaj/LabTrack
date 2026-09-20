require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Asset = require('./models/Asset');
const Request = require('./models/Request');
const Maintenance = require('./models/Maintenance');

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_tracking';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections for a fresh demo state
    await User.deleteMany({});
    await Asset.deleteMany({});
    await Request.deleteMany({});
    await Maintenance.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Demo Users
    const passwordHash = await bcrypt.hash('admin123', 10);
    const inchargeHash = await bcrypt.hash('incharge123', 10);
    const studentHash = await bcrypt.hash('student123', 10);

    const admin = await User.create({
      name: 'Prof. Sharma (Admin)',
      email: 'admin@lab.com',
      password: passwordHash,
      role: 'admin'
    });

    const incharge = await User.create({
      name: 'Mr. Verma (Lab In-charge)',
      email: 'incharge@lab.com',
      password: inchargeHash,
      role: 'lab_incharge'
    });

    const student = await User.create({
      name: 'Aarav Patel (Student)',
      email: 'student@lab.com',
      password: studentHash,
      role: 'requester'
    });

    console.log('Created 3 demo users (Admin, Lab In-charge, Student).');

    // 2. Create Sample Assets
    const assets = await Asset.create([
      {
        assetTag: 'LAB-EQ-101',
        name: 'Digital Storage Oscilloscope 100MHz',
        category: 'Electronics',
        location: 'Lab 204, Rack A-1',
        condition: 'OK',
        quantity: 4,
        availableQuantity: 3 // 1 unit issued in overdue demo below
      },
      {
        assetTag: 'LAB-EQ-102',
        name: 'Auto-Ranging Digital Multimeter',
        category: 'Electronics',
        location: 'Lab 204, Shelf B',
        condition: 'OK',
        quantity: 10,
        availableQuantity: 10
      },
      {
        assetTag: 'LAB-EQ-103',
        name: 'Raspberry Pi 4 Model B (4GB)',
        category: 'Computing',
        location: 'IoT Lab, Box 12',
        condition: 'OK',
        quantity: 8,
        availableQuantity: 8
      },
      {
        assetTag: 'LAB-EQ-104',
        name: 'Soldering Station 60W ESD Safe',
        category: 'Hardware',
        location: 'Workshop Bench 4',
        condition: 'OK',
        quantity: 5,
        availableQuantity: 5
      },
      {
        assetTag: 'LAB-EQ-105',
        name: 'Arbitrary Function Generator 25MHz',
        category: 'Electronics',
        location: 'Lab 204, Rack C-2',
        condition: 'Damaged', // Demonstrates damaged inventory condition
        quantity: 2,
        availableQuantity: 2
      }
    ]);

    console.log(`Created ${assets.length} sample assets.`);

    // 3. Create a demonstration Overdue Request (issued 5 days ago, return was 2 days ago)
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    await Request.create({
      asset: assets[0]._id,
      requester: student._id,
      quantity: 1,
      purpose: 'B.Tech Capstone Project waveform analysis',
      expectedReturnDate: twoDaysAgo, // in the past = Overdue!
      status: 'Issued',
      issuedAt: fiveDaysAgo
    });

    console.log('Created sample overdue request for instant classroom demonstration.');

    // 4. Create sample maintenance record
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await Maintenance.create({
      asset: assets[0]._id,
      serviceDate: fiveDaysAgo,
      cost: 45.00,
      nextServiceDue: nextMonth,
      notes: 'Calibrated analog channels 1 and 2. Replaced ground lead.'
    });

    console.log('Created sample maintenance record.');
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
