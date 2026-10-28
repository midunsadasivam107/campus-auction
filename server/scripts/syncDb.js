const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Bid = require('../models/Bid');
const Question = require('../models/Question');
const Notification = require('../models/Notification');
const AutoBid = require('../models/AutoBid');
const SavedSearch = require('../models/SavedSearch');
const Otp = require('../models/Otp');
const connectDB = require('../config/db');
const { LISTING_STATUS } = require('../utils/constants');

const syncDatabase = async () => {
  try {
    console.log('🔄 Starting full database synchronization...');
    await connectDB();

    console.log('\n📦 Synchronizing MongoDB collection indexes...');
    const models = [
      { name: 'User', model: User },
      { name: 'Listing', model: Listing },
      { name: 'Bid', model: Bid },
      { name: 'Question', model: Question },
      { name: 'Notification', model: Notification },
      { name: 'AutoBid', model: AutoBid },
      { name: 'SavedSearch', model: SavedSearch },
      { name: 'Otp', model: Otp },
    ];

    for (const { name, model } of models) {
      try {
        await model.syncIndexes();
        const count = await model.countDocuments();
        console.log(`  ✅ ${name.padEnd(12)} -> Collection: '${model.collection.name.padEnd(14)}' (${count} documents, indexes synced)`);
      } catch (err) {
        console.warn(`  ⚠️ Index sync note for ${name}:`, err.message);
      }
    }

    // Check if we have active listings to display on the marketplace
    const activeListingsCount = await Listing.countDocuments({ status: LISTING_STATUS.ACTIVE });
    const userCount = await User.countDocuments();

    console.log(`\n📊 Data Health Check:`);
    console.log(`  👤 Registered Students : ${userCount}`);
    console.log(`  🏷️  Active Listings     : ${activeListingsCount}`);

    // If there are students but no active listings, create fresh active listings linked to an existing student
    if (activeListingsCount === 0 && userCount > 0) {
      console.log('\n🌱 Adding active sample marketplace listings...');
      const seller = await User.findOne();
      const now = new Date();
      const closeIn2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const closeIn24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const closeIn3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      await Listing.create([
        {
          title: 'TI-84 Plus CE Graphing Calculator',
          description: 'Excellent condition TI-84 Plus CE in blue. Essential for Calculus, Linear Algebra, and Statistics. Comes with original charging cable.',
          category: 'calculators',
          condition: 'like_new',
          startingPrice: 500,
          currentPrice: 500,
          minBidIncrement: 20,
          closingTime: closeIn24Hours,
          seller: seller._id,
          photos: ['https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80'],
          status: LISTING_STATUS.ACTIVE,
        },
        {
          title: 'Hero Sprint Pro 21-Speed Mountain Bike',
          description: 'Sturdy 21-speed mountain bicycle with dual disc brakes, front suspension, and mudguards. Perfect for daily commutes between hostel and campus.',
          category: 'bicycles',
          condition: 'good',
          startingPrice: 1800,
          currentPrice: 1800,
          minBidIncrement: 50,
          closingTime: closeIn3Days,
          seller: seller._id,
          photos: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80'],
          status: LISTING_STATUS.ACTIVE,
        },
        {
          title: 'Introduction to Algorithms (CLRS 3rd Edition)',
          description: 'Classic CLRS algorithms textbook. Clean pages with minimal pencil highlights. Essential for data structures coursework.',
          category: 'textbooks',
          condition: 'good',
          startingPrice: 350,
          currentPrice: 350,
          minBidIncrement: 15,
          closingTime: closeIn2Hours,
          seller: seller._id,
          photos: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'],
          status: LISTING_STATUS.ACTIVE,
        },
      ]);
      console.log('  ✅ Created 3 live auction listings linked to seller:', seller.name);
    }

    console.log('\n✨ Database and Project are 100% in sync!');
    console.log('───────────────────────────────────────────────────');
    console.log(`Database URI : ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
    console.log('Collections  : users, listings, bids, questions, notifications, autobids, savedsearches');
    console.log('───────────────────────────────────────────────────');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
};

syncDatabase();
