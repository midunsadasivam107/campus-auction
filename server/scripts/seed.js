const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Bid = require('../models/Bid');
const Question = require('../models/Question');
const connectDB = require('../config/db');
const { LISTING_STATUS } = require('../utils/constants');

const demoStudents = [
  {
    name: 'Rahul Kumar',
    email: 'rahul@campus.edu',
    password: 'Password123!',
    studentId: 'CS2026-042',
    graduationYear: 2026,
    bio: 'Final year CS student selling textbooks, gadgets, and campus gear.',
  },
  {
    name: 'Priya Sharma',
    email: 'priya@campus.edu',
    password: 'Password123!',
    studentId: 'EE2027-118',
    graduationYear: 2027,
    bio: 'Junior year EE student looking for affordable lab equipment and books.',
  },
  {
    name: 'Amit Patel',
    email: 'amit@campus.edu',
    password: 'Password123!',
    studentId: 'ME2028-095',
    graduationYear: 2028,
    bio: 'Sophomore mechanical engineering student.',
  },
];

const seedData = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding database...');

    // Clear existing sample collections
    await User.deleteMany({ email: { $in: demoStudents.map((s) => s.email) } });
    await Listing.deleteMany({});
    await Bid.deleteMany({});
    await Question.deleteMany({});

    // Create students
    const users = [];
    for (const student of demoStudents) {
      const user = await User.create({
        name: student.name,
        email: student.email,
        passwordHash: student.password,
        studentId: student.studentId,
        graduationYear: student.graduationYear,
        bio: student.bio,
      });
      users.push(user);
    }
    console.log(`✅ Created ${users.length} demo students.`);

    const [rahul, priya, amit] = users;

    // Create sample listings
    const now = new Date();
    const closeIn2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const closeIn24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const closeIn3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const listings = [
      {
        title: 'TI-84 Plus CE Graphing Calculator',
        description: 'Excellent condition TI-84 Plus CE in blue. Battery holds charge for weeks. Essential for Calculus, Linear Algebra, and Statistics. Comes with original charging cable.',
        category: 'calculators',
        condition: 'like_new',
        startingPrice: 500,
        currentPrice: 500,
        minBidIncrement: 20,
        closingTime: closeIn24Hours,
        seller: rahul._id,
        photos: [
          'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
        ],
        status: LISTING_STATUS.ACTIVE,
      },
      {
        title: 'Hero Sprint Pro 21-Speed Mountain Bike',
        description: 'Sturdy 21-speed mountain bicycle with dual disc brakes, front suspension, and mudguards. Perfect for daily commutes between campus hostels and lecture halls.',
        category: 'bicycles',
        condition: 'good',
        startingPrice: 1800,
        currentPrice: 1800,
        minBidIncrement: 50,
        closingTime: closeIn3Days,
        seller: rahul._id,
        photos: [
          'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
        ],
        status: LISTING_STATUS.ACTIVE,
      },
      {
        title: 'Introduction to Algorithms (CLRS 3rd Edition)',
        description: 'Classic CLRS algorithms textbook. Clean pages with minimal pencil highlights. Essential for data structures and algorithms coursework and coding interviews.',
        category: 'textbooks',
        condition: 'good',
        startingPrice: 350,
        currentPrice: 350,
        minBidIncrement: 15,
        closingTime: closeIn2Hours,
        seller: priya._id,
        photos: [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        ],
        status: LISTING_STATUS.ACTIVE,
      },
      {
        title: 'Logitech MX Master 2S Wireless Mouse',
        description: 'Ergonomic rechargeable Bluetooth mouse. Smooth hyper-fast scroll wheel and gestures. Includes Unifying receiver and USB cable.',
        category: 'electronics',
        condition: 'like_new',
        startingPrice: 1200,
        currentPrice: 1200,
        minBidIncrement: 50,
        closingTime: closeIn24Hours,
        seller: amit._id,
        photos: [
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80',
        ],
        status: LISTING_STATUS.ACTIVE,
      },
    ];

    const createdListings = await Listing.insertMany(listings);
    console.log(`✅ Created ${createdListings.length} demo auction listings.`);

    // Add a sample Q&A question to the first listing
    await Question.create({
      listing: createdListings[0]._id,
      asker: priya._id,
      question: 'Does this calculator include the USB mini charging cable and slide cover?',
      answer: 'Yes, original cable and black slide cover are included!',
      answeredBy: rahul._id,
      answeredAt: new Date(),
    });
    console.log('✅ Added sample Q&A thread.');

    console.log('\n🎉 Database seeded successfully!');
    console.log('───────────────────────────────────────────────────');
    console.log('Demo Student Accounts:');
    demoStudents.forEach((s) => {
      console.log(`  👤 ${s.name.padEnd(14)} Email: ${s.email.padEnd(20)} Password: ${s.password}`);
    });
    console.log('───────────────────────────────────────────────────');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedData();
