//
// // Tests for authentication service. Covers main flows and common errors.
import authService from '../services/authService';
import { UserRole } from '../types';

// Mock dependencies
jest.mock('../utils/database', () => ({
  __esModule: true,
  default: {
    user: {}
  }
}));
jest.mock('../utils/logger');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockPrisma = require('../utils/database').default;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.user = {};
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: UserRole.USER
      };

      const mockUser = {
        id: '1',
        email: userData.email,
        name: userData.name,
        role: userData.role,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock Prisma client
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);
      mockPrisma.user.create = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.createUser(userData);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: userData.email,
          name: userData.name,
          role: userData.role
        }),
        select: expect.any(Object)
      });
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User'
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue({ id: '1', email: userData.email });

      await expect(authService.createUser(userData)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('loginUser', () => {
    it('should login user successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: '1',
        email: loginData.email,
        password: '$2a$12$hashedpassword',
        name: 'Test User',
        role: UserRole.USER
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      // Mock bcrypt
      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      // Mock jwt
      const jwt = require('jsonwebtoken');
      jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');

      const result = await authService.loginUser(loginData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(loginData.email);
      expect(result.token).toBe('mock-jwt-token');
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid email or password');
    });
  });
}); 