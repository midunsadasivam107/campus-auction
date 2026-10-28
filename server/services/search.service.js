const SavedSearch = require('../models/SavedSearch');
const { createNotification } = require('./notification.service');

/**
 * Match a newly published listing against active saved searches
 * Sends real-time in-app notifications to interested students
 */
const matchSavedSearches = async (listing, io = null) => {
  try {
    // Find active saved searches, excluding the seller themselves
    const savedSearches = await SavedSearch.find({
      isActive: true,
      user: { $ne: listing.seller },
    });

    if (savedSearches.length === 0) return;

    for (const search of savedSearches) {
      const f = search.filters || {};
      let isMatch = true;

      // 1. Category check
      if (f.category && f.category !== listing.category) {
        isMatch = false;
      }

      // 2. Condition check
      if (isMatch && f.condition && f.condition !== listing.condition) {
        isMatch = false;
      }

      // 3. Price range check (using startingPrice or currentPrice)
      const price = listing.currentPrice ?? listing.startingPrice;
      if (isMatch && f.minPrice !== undefined && price < f.minPrice) {
        isMatch = false;
      }
      if (isMatch && f.maxPrice !== undefined && price > f.maxPrice) {
        isMatch = false;
      }

      // 4. Keyword text search check
      if (isMatch && f.query && f.query.trim()) {
        const qLower = f.query.trim().toLowerCase();
        const inTitle = listing.title.toLowerCase().includes(qLower);
        const inDesc = listing.description.toLowerCase().includes(qLower);
        if (!inTitle && !inDesc) {
          isMatch = false;
        }
      }

      if (isMatch) {
        // Create in-app notification with dedupKey
        await createNotification({
          userId: search.user,
          type: 'saved_search_match',
          title: `Match for "${search.label}"! 🎯`,
          message: `New item listed: "${listing.title}" for ₹${price} matches your saved search.`,
          listingId: listing._id,
          dedupKey: `saved_search_${search._id}_listing_${listing._id}`,
          io,
        });

        search.lastMatchedAt = new Date();
        await search.save();
      }
    }
  } catch (error) {
    console.error('Error matching saved searches:', error.message);
  }
};

module.exports = {
  matchSavedSearches,
};
