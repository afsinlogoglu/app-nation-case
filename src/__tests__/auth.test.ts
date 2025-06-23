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
    process.env['JWT_SECRET'] = 'test-secret';
    process.env['JWT_EXPIRES_IN'] = '24h';
  });

  afterEach(() => {
    delete process.env['JWT_SECRET'];
    delete process.env['JWT_EXPIRES_IN'];
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

      // Mock bcrypt
      const bcrypt = require('bcryptjs');
      bcrypt.hash = jest.fn().mockResolvedValue('hashed-password');

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

    it('should use default role when not provided', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const mockUser = {
        id: '1',
        email: userData.email,
        name: userData.name,
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);
      mockPrisma.user.create = jest.fn().mockResolvedValue(mockUser);

      const bcrypt = require('bcryptjs');
      bcrypt.hash = jest.fn().mockResolvedValue('hashed-password');

      await authService.createUser(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: UserRole.USER
        }),
        select: expect.any(Object)
      });
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

    it('should throw error for invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        id: '1',
        email: loginData.email,
        password: '$2a$12$hashedpassword',
        name: 'Test User',
        role: UserRole.USER
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      const bcrypt = require('bcryptjs');
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token successfully', () => {
      const payload = {
        userId: '1',
        email: 'test@example.com',
        role: UserRole.USER
      };

      const jwt = require('jsonwebtoken');
      jwt.sign = jest.fn().mockReturnValue('mock-token');

      const result = authService.generateToken(payload);

      expect(result).toBe('mock-token');
      expect(jwt.sign).toHaveBeenCalledWith(payload, 'test-secret', {
        expiresIn: '24h'
      });
    });

    it('should use fallback values when env vars are not set', () => {
      delete process.env['JWT_SECRET'];
      delete process.env['JWT_EXPIRES_IN'];

      const payload = {
        userId: '1',
        email: 'test@example.com',
        role: UserRole.USER
      };

      const jwt = require('jsonwebtoken');
      jwt.sign = jest.fn().mockReturnValue('mock-token');

      authService.generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, 'fallback-secret', {
        expiresIn: '24h'
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', () => {
      const token = 'valid-token';
      const payload = {
        userId: '1',
        email: 'test@example.com',
        role: UserRole.USER
      };

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue(payload);

      const result = authService.verifyToken(token);

      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
    });

    it('should throw error for invalid token', () => {
      const token = 'invalid-token';

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.verifyToken(token)).toThrow('Invalid token');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          name: 'User 1',
          role: UserRole.USER,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          email: 'admin@example.com',
          name: 'Admin User',
          role: UserRole.ADMIN,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.user.findMany = jest.fn().mockResolvedValue(mockUsers);

      const result = await authService.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    });

    it('should handle database error', async () => {
      mockPrisma.user.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(authService.getAllUsers()).rejects.toThrow('Failed to fetch users');
    });
  });

  describe('getUserById', () => {
    it('should return user by ID successfully', async () => {
      const userId = '1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
    });

    it('should throw error when user not found', async () => {
      const userId = '999';

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(authService.getUserById(userId)).rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = '1';
      const mockDeletedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User'
      };

      mockPrisma.user.delete = jest.fn().mockResolvedValue(mockDeletedUser);

      const result = await authService.deleteUser(userId);

      expect(result).toEqual(mockDeletedUser);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true
        }
      });
    });

    it('should handle database error', async () => {
      const userId = '999';

      mockPrisma.user.delete = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(authService.deleteUser(userId)).rejects.toThrow('Failed to delete user');
    });
  });
}); 