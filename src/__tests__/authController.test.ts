import { Request, Response } from 'express';
import AuthController from '../controllers/authController';
import authService from '../services/authService';
import { UserRole } from '../types';

// Mock dependencies
jest.mock('../services/authService');
jest.mock('../utils/logger');

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
    
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
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

      mockRequest = { body: userData };
      mockAuthService.createUser = jest.fn().mockResolvedValue(mockUser);

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.createUser).toHaveBeenCalledWith(userData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
        message: 'User created successfully'
      });
    });

    it('should handle registration error', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User'
      };

      mockRequest = { body: userData };
      mockAuthService.createUser = jest.fn().mockRejectedValue(
        new Error('User with this email already exists')
      );

      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User with this email already exists'
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResult = {
        user: {
          id: '1',
          email: loginData.email,
          name: 'Test User',
          role: UserRole.USER
        },
        token: 'mock-jwt-token'
      };

      mockRequest = { body: loginData };
      mockAuthService.loginUser = jest.fn().mockResolvedValue(mockResult);

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.loginUser).toHaveBeenCalledWith(loginData);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Login successful'
      });
    });

    it('should handle login error', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockRequest = { body: loginData };
      mockAuthService.loginUser = jest.fn().mockRejectedValue(
        new Error('Invalid email or password')
      );

      await AuthController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid email or password'
      });
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

      mockRequest = {};
      mockAuthService.getAllUsers = jest.fn().mockResolvedValue(mockUsers);

      await AuthController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.getAllUsers).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        message: 'Users retrieved successfully'
      });
    });

    it('should handle getAllUsers error', async () => {
      mockRequest = {};
      mockAuthService.getAllUsers = jest.fn().mockRejectedValue(
        new Error('Database error')
      );

      await AuthController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });
  });

  describe('getUserById', () => {
    it('should return user by ID successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest = { params: { userId: '1' } };
      mockAuthService.getUserById = jest.fn().mockResolvedValue(mockUser);

      await AuthController.getUserById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.getUserById).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
        message: 'User retrieved successfully'
      });
    });

    it('should handle missing userId parameter', async () => {
      mockRequest = { params: {} };

      await AuthController.getUserById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User ID is required'
      });
    });

    it('should handle getUserById error', async () => {
      mockRequest = { params: { userId: '999' } };
      mockAuthService.getUserById = jest.fn().mockRejectedValue(
        new Error('User not found')
      );

      await AuthController.getUserById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const mockDeletedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest = { params: { userId: '1' } };
      mockAuthService.deleteUser = jest.fn().mockResolvedValue(mockDeletedUser);

      await AuthController.deleteUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockAuthService.deleteUser).toHaveBeenCalledWith('1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockDeletedUser,
        message: 'User deleted successfully'
      });
    });

    it('should handle missing userId parameter', async () => {
      mockRequest = { params: {} };

      await AuthController.deleteUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'User ID is required'
      });
    });

    it('should handle deleteUser error', async () => {
      mockRequest = { params: { userId: '999' } };
      mockAuthService.deleteUser = jest.fn().mockRejectedValue(
        new Error('Failed to delete user')
      );

      await AuthController.deleteUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to delete user'
      });
    });
  });
}); 