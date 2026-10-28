import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from '../../validations/auth.validation';

describe('Auth Validations', () => {
  describe('registerSchema', () => {
    it('should validate valid student registration data', () => {
      const validData = {
        name: 'Rahul Kumar',
        email: 'rahul@campus.edu',
        password: 'Password123!',
        studentId: 'ST12345',
        graduationYear: 2026,
      };
      const { error, value } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value.email).toBe('rahul@campus.edu');
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        name: 'Rahul Kumar',
        email: 'not-an-email',
        password: 'Password123!',
      };
      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('valid email address');
    });

    it('should reject short passwords', () => {
      const invalidData = {
        name: 'Rahul Kumar',
        email: 'rahul@campus.edu',
        password: '123',
      };
      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least 6 characters');
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login input', () => {
      const data = {
        email: 'priya@campus.edu',
        password: 'SecretPassword!',
      };
      const { error } = loginSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should reject missing password', () => {
      const data = {
        email: 'priya@campus.edu',
      };
      const { error } = loginSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('updateProfileSchema', () => {
    it('should accept spending limit and bio updates', () => {
      const data = {
        bio: 'Senior CS student passionate about robotics',
        spendingLimit: 5000,
      };
      const { error, value } = updateProfileSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value.spendingLimit).toBe(5000);
    });

    it('should reject negative spending limit', () => {
      const data = {
        spendingLimit: -100,
      };
      const { error } = updateProfileSchema.validate(data);
      expect(error).toBeDefined();
    });
  });
});

describe('Security Primitives', () => {
  it('should securely hash and verify passwords using bcrypt', async () => {
    const rawPassword = 'StudentSecret123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    expect(hash).not.toBe(rawPassword);
    const matches = await bcrypt.compare(rawPassword, hash);
    expect(matches).toBe(true);

    const wrongMatches = await bcrypt.compare('WrongPassword', hash);
    expect(wrongMatches).toBe(false);
  });
});
