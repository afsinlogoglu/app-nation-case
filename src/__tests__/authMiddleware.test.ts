import { Response, NextFunction } from 'express';
import { authenticateToken, requireRole, requireAdmin, requireUser, AuthenticatedRequest } from '../middleware/auth';
import authService from '../services/authService';
import { UserRole } from '../types';

// Mock dependencies
jest.mock('../services/authService');
jest.mock('../utils/logger');

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    mockNext = jest.fn();
    
    mockResponse = {
      json: mockJson,
      status: mockStatus
    };
    
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', () => {
      const mockUser = {
        userId: '1',
        email: 'test@example.com',
        role: UserRole.USER
      };

      mockRequest = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };

      mockAuthService.verifyToken = jest.fn().mockReturnValue(mockUser);

      authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without token', () => {
      mockRequest = {
        headers: {}
      };

      authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Access token required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', () => {
      mockRequest = {
        headers: {
          authorization: 'InvalidFormat token'
        }
      };

      // Mock verifyToken to throw error for invalid format
      mockAuthService.verifyToken = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token format');
      });

      authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };

      mockAuthService.verifyToken = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow user with required role', () => {
      mockRequest = {
        user: {
          userId: '1',
          email: 'admin@example.com',
          role: UserRole.ADMIN
        }
      };

      const adminMiddleware = requireRole([UserRole.ADMIN]);

      adminMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject user without required role', () => {
      mockRequest = {
        user: {
          userId: '1',
          email: 'user@example.com',
          role: UserRole.USER
        }
      };

      const adminMiddleware = requireRole([UserRole.ADMIN]);

      adminMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated request', () => {
      mockRequest = {};

      const adminMiddleware = requireRole([UserRole.ADMIN]);

      adminMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow user with multiple required roles', () => {
      mockRequest = {
        user: {
          userId: '1',
          email: 'user@example.com',
          role: UserRole.USER
        }
      };

      const userOrAdminMiddleware = requireRole([UserRole.USER, UserRole.ADMIN]);

      userOrAdminMiddleware(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin user', () => {
      mockRequest = {
        user: {
          userId: '1',
          email: 'admin@example.com',
          role: UserRole.ADMIN
        }
      };

      requireAdmin(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject non-admin user', () => {
      mockRequest = {
        user: {
          userId: '1',
          email: 'user@example.com',
          role: UserRole.USER
        }
      };

      requireAdmin(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions'
      });
    });
  });

  describe('requireUser', () => {
    it('should allow regular user', () => {
      mockRequest = {
        user: {
          userId: '1',
          email: 'user@example.com',
          role: UserRole.USER
        }
      };

      requireUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow admin user', () => {
      mockRequest = {
        user: {
          userId: '1',
          email: 'admin@example.com',
          role: UserRole.ADMIN
        }
      };

      requireUser(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });
}); 