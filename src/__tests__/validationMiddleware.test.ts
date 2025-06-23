import { Request, Response, NextFunction } from 'express';
import { validateRequest, validateQuery, userCreateSchema, userLoginSchema, weatherQuerySchema, paginationSchema } from '../middleware/validation';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
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

  describe('validateRequest', () => {
    it('should pass validation for valid data', () => {
      const validUserData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      mockRequest = {
        body: validUserData
      };

      const validateUser = validateRequest(userCreateSchema);

      validateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).toEqual(validUserData);
    });

    it('should reject invalid email format', () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      };

      mockRequest = {
        body: invalidUserData
      };

      const validateUser = validateRequest(userCreateSchema);

      validateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '"email" must be a valid email'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject short password', () => {
      const invalidUserData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User'
      };

      mockRequest = {
        body: invalidUserData
      };

      const validateUser = validateRequest(userCreateSchema);

      validateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '"password" length must be at least 6 characters long'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject missing required fields', () => {
      const invalidUserData = {
        email: 'test@example.com'
        // missing password and name
      };

      mockRequest = {
        body: invalidUserData
      };

      const validateUser = validateRequest(userCreateSchema);

      validateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '"password" is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should accept valid role', () => {
      const validUserData = {
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
        role: 'ADMIN'
      };

      mockRequest = {
        body: validUserData
      };

      const validateUser = validateRequest(userCreateSchema);

      validateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).toEqual(validUserData);
    });

    it('should reject invalid role', () => {
      const invalidUserData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'INVALID_ROLE'
      };

      mockRequest = {
        body: invalidUserData
      };

      const validateUser = validateRequest(userCreateSchema);

      validateUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '"role" must be one of [ADMIN, USER]'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateQuery', () => {
    it('should pass validation for valid query parameters', () => {
      const validQuery = {
        page: '1',
        limit: '10'
      };

      mockRequest = {
        query: validQuery
      };

      const validatePagination = validateQuery(paginationSchema);

      validatePagination(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.query).toEqual({
        page: 1,
        limit: 10
      });
    });

    it('should use default values for missing parameters', () => {
      const emptyQuery = {};

      mockRequest = {
        query: emptyQuery
      };

      const validatePagination = validateQuery(paginationSchema);

      validatePagination(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.query).toEqual({
        page: 1,
        limit: 10
      });
    });

    it('should reject invalid page number', () => {
      const invalidQuery = {
        page: '0',
        limit: '10'
      };

      mockRequest = {
        query: invalidQuery
      };

      const validatePagination = validateQuery(paginationSchema);

      validatePagination(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '"page" must be greater than or equal to 1'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject limit exceeding maximum', () => {
      const invalidQuery = {
        page: '1',
        limit: '150'
      };

      mockRequest = {
        query: invalidQuery
      };

      const validatePagination = validateQuery(paginationSchema);

      validatePagination(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '"limit" must be less than or equal to 100'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Weather Query Schema', () => {
    it('should validate weather query with valid city', () => {
      const validWeatherQuery = {
        city: 'Istanbul'
      };

      mockRequest = {
        body: validWeatherQuery
      };

      const validateWeather = validateRequest(weatherQuerySchema);

      validateWeather(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).toEqual(validWeatherQuery);
    });

    it('should reject empty city', () => {
      const invalidWeatherQuery = {
        city: ''
      };

      mockRequest = {
        body: invalidWeatherQuery
      };

      const validateWeather = validateRequest(weatherQuerySchema);

      validateWeather(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '"city" is not allowed to be empty'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject missing city', () => {
      const invalidWeatherQuery = {};

      mockRequest = {
        body: invalidWeatherQuery
      };

      const validateWeather = validateRequest(weatherQuerySchema);

      validateWeather(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '"city" is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('User Login Schema', () => {
    it('should validate login with valid credentials', () => {
      const validLoginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockRequest = {
        body: validLoginData
      };

      const validateLogin = validateRequest(userLoginSchema);

      validateLogin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body).toEqual(validLoginData);
    });

    it('should reject login without password', () => {
      const invalidLoginData = {
        email: 'test@example.com'
        // missing password
      };

      mockRequest = {
        body: invalidLoginData
      };

      const validateLogin = validateRequest(userLoginSchema);

      validateLogin(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: '"password" is required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 