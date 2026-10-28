import { describe, it, expect } from 'vitest';
import Otp from '../../models/Otp';

describe('OTP Verification Engine', () => {
  it('should validate valid OTP model attributes', () => {
    const otpDoc = new Otp({
      email: 'rahul@campus.edu',
      otp: '482910',
    });

    expect(otpDoc.email).toBe('rahul@campus.edu');
    expect(otpDoc.otp).toBe('482910');
    expect(otpDoc.attempts).toBe(0);
    expect(otpDoc.expiresAt).toBeDefined();
    expect(otpDoc.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should reject OTP model missing email or code', async () => {
    const invalidDoc = new Otp({});
    const error = invalidDoc.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.email).toBeDefined();
    expect(error.errors.otp).toBeDefined();
  });

  it('should calculate expiry at 10 minutes in the future', () => {
    const before = Date.now() + 9 * 60 * 1000;
    const after = Date.now() + 11 * 60 * 1000;
    const otpDoc = new Otp({
      email: 'priya@campus.edu',
      otp: '654321',
    });

    expect(otpDoc.expiresAt.getTime()).toBeGreaterThan(before);
    expect(otpDoc.expiresAt.getTime()).toBeLessThan(after);
  });
});
