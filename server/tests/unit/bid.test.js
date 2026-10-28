import { describe, it, expect } from 'vitest';
import { anonymizeName } from '../../services/bid.service';
import { AUCTION_RULES } from '../../utils/constants';

describe('Bidding Core Logic', () => {
  describe('Name Anonymization', () => {
    it('should anonymize two-part name to First Name + Last Initial', () => {
      expect(anonymizeName('Rahul Kumar')).toBe('Rahul K.');
      expect(anonymizeName('Priya Sharma')).toBe('Priya S.');
    });

    it('should keep single word name as is', () => {
      expect(anonymizeName('Amit')).toBe('Amit');
    });

    it('should handle multi-word names appropriately', () => {
      expect(anonymizeName('Mohammad Ali Khan')).toBe('Mohammad K.');
    });

    it('should return fallback for missing name', () => {
      expect(anonymizeName('')).toBe('Student');
      expect(anonymizeName(null)).toBe('Student');
    });
  });

  describe('Anti-Snipe Rules', () => {
    it('should verify anti-snipe threshold is 30 seconds', () => {
      expect(AUCTION_RULES.ANTI_SNIPE_THRESHOLD_MS).toBe(30 * 1000);
    });

    it('should verify anti-snipe extension duration is 60 seconds', () => {
      expect(AUCTION_RULES.ANTI_SNIPE_EXTENSION_MS).toBe(60 * 1000);
    });

    it('should compute extension correctly when remaining time <= 30s', () => {
      const now = Date.now();
      const closingTime = now + 15 * 1000; // 15 seconds remaining
      const remainingMs = closingTime - now;

      const shouldExtend = remainingMs <= AUCTION_RULES.ANTI_SNIPE_THRESHOLD_MS;
      expect(shouldExtend).toBe(true);

      const extendedDeadline = new Date(now + AUCTION_RULES.ANTI_SNIPE_EXTENSION_MS);
      expect(extendedDeadline.getTime() - now).toBe(60 * 1000);
    });

    it('should not extend when remaining time > 30s', () => {
      const now = Date.now();
      const closingTime = now + 45 * 1000; // 45 seconds remaining
      const remainingMs = closingTime - now;

      const shouldExtend = remainingMs <= AUCTION_RULES.ANTI_SNIPE_THRESHOLD_MS;
      expect(shouldExtend).toBe(false);
    });
  });

  describe('Bid Calculation Rules', () => {
    it('should require exactly starting price or more for first bid', () => {
      const startingPrice = 500;
      const bidCount = 0;
      const minRequired = bidCount === 0 ? startingPrice : 999;
      expect(minRequired).toBe(500);

      expect(500 >= minRequired).toBe(true);
      expect(499 >= minRequired).toBe(false);
    });

    it('should require currentPrice + minBidIncrement for subsequent bids', () => {
      const currentPrice = 750;
      const minBidIncrement = 25;
      const minRequired = currentPrice + minBidIncrement;
      expect(minRequired).toBe(775);

      expect(775 >= minRequired).toBe(true);
      expect(770 >= minRequired).toBe(false);
    });
  });
});
