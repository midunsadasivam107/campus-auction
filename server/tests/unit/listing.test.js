import { describe, it, expect } from 'vitest';
import {
  createListingSchema,
  updateListingSchema,
} from '../../validations/listing.validation';
import { CATEGORIES, CONDITIONS, LISTING_STATUS } from '../../utils/constants';

describe('Listing Validations', () => {
  describe('createListingSchema', () => {
    it('should validate complete valid listing', () => {
      const validListing = {
        title: 'Hero Sprint Bicycle 21-Speed',
        description: 'Used for 2 semesters, excellent condition, comes with bell and lock',
        category: 'bicycles',
        condition: 'good',
        startingPrice: 1500,
        minBidIncrement: 50,
        closingTime: new Date(Date.now() + 86400000).toISOString(),
        images: [
          { url: 'https://example.com/bike.jpg', publicId: 'img_1' },
        ],
      };

      const { error, value } = createListingSchema.validate(validListing);
      expect(error).toBeUndefined();
      expect(value.title).toBe(validListing.title);
      expect(value.category).toBe('bicycles');
    });

    it('should reject invalid category', () => {
      const invalid = {
        title: 'Random Item',
        description: 'Random description that meets min length',
        category: 'spaceships',
        condition: 'good',
        startingPrice: 100,
        closingTime: new Date(Date.now() + 86400000).toISOString(),
      };

      const { error } = createListingSchema.validate(invalid);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Category must be one of');
    });

    it('should reject past closing time', () => {
      const invalid = {
        title: 'TI-84 Plus',
        description: 'Graphing calculator with fresh batteries',
        category: 'calculators',
        condition: 'like_new',
        startingPrice: 800,
        closingTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      };

      const { error } = createListingSchema.validate(invalid);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Closing time must be in the future');
    });

    it('should reject starting price <= 0', () => {
      const invalid = {
        title: 'Free Textbook',
        description: 'Calculus Early Transcendentals',
        category: 'textbooks',
        condition: 'worn',
        startingPrice: 0,
        closingTime: new Date(Date.now() + 86400000).toISOString(),
      };

      const { error } = createListingSchema.validate(invalid);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least ₹1');
    });

    it('should enforce maximum of 5 images', () => {
      const tooManyImages = {
        title: 'Desk Lamp',
        description: 'LED study lamp with flexible arm',
        category: 'other',
        condition: 'good',
        startingPrice: 200,
        closingTime: new Date(Date.now() + 86400000).toISOString(),
        images: [
          { url: 'https://example.com/1.jpg' },
          { url: 'https://example.com/2.jpg' },
          { url: 'https://example.com/3.jpg' },
          { url: 'https://example.com/4.jpg' },
          { url: 'https://example.com/5.jpg' },
          { url: 'https://example.com/6.jpg' },
        ],
      };

      const { error } = createListingSchema.validate(tooManyImages);
      expect(error).toBeDefined();
      expect(error.details[0].path[0]).toBe('images');
    });
  });

  describe('Auction Constants', () => {
    it('should verify all required categories are present', () => {
      expect(CATEGORIES).toContain('textbooks');
      expect(CATEGORIES).toContain('electronics');
      expect(CATEGORIES).toContain('bicycles');
      expect(CATEGORIES).toContain('calculators');
      expect(CATEGORIES).toContain('furniture');
    });

    it('should verify all auction lifecycle statuses exist', () => {
      expect(LISTING_STATUS.ACTIVE).toBe('active');
      expect(LISTING_STATUS.CLOSED).toBe('closed');
      expect(LISTING_STATUS.PENDING_APPROVAL).toBe('pending_approval');
      expect(LISTING_STATUS.SOLD).toBe('sold');
      expect(LISTING_STATUS.UNSOLD).toBe('unsold');
      expect(LISTING_STATUS.REJECTED).toBe('rejected');
      expect(LISTING_STATUS.COMPLETED).toBe('completed');
    });
  });
});
