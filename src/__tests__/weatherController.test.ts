import { Response } from 'express';
import WeatherController from '../controllers/weatherController';
import weatherService from '../services/weatherService';
import { UserRole } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

// Mock dependencies
jest.mock('../services/weatherService');
jest.mock('../utils/logger');

const mockWeatherService = weatherService as jest.Mocked<typeof weatherService>;

describe('WeatherController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
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

  describe('getWeather', () => {
    it('should return weather data successfully', async () => {
      const mockWeatherData = {
        city: 'Istanbul',
        temperature: 25,
        humidity: 60,
        description: 'Sunny'
      };

      mockRequest = {
        body: { city: 'Istanbul' },
        user: { userId: '1', email: 'test@example.com', role: UserRole.USER }
      };

      mockWeatherService.getWeatherData = jest.fn().mockResolvedValue(mockWeatherData);

      await WeatherController.getWeather(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockWeatherService.getWeatherData).toHaveBeenCalledWith('Istanbul', '1');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockWeatherData,
        message: 'Weather data for Istanbul retrieved successfully'
      });
    });

    it('should handle errors when fetching weather data', async () => {
      mockRequest = {
        body: { city: 'InvalidCity' },
        user: { userId: '1', email: 'test@example.com', role: UserRole.USER }
      };

      mockWeatherService.getWeatherData = jest.fn().mockRejectedValue(
        new Error('City not found')
      );

      await WeatherController.getWeather(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'City not found'
      });
    });
  });

  describe('getWeatherQueries', () => {
    it('should return weather queries for user', async () => {
      const mockQueries = {
        queries: [
          { id: '1', city: 'Istanbul', temperature: 25, createdAt: new Date() }
        ],
        total: 1,
        page: 1,
        limit: 10
      };

      mockRequest = {
        user: { userId: '1', email: 'test@example.com', role: UserRole.USER },
        query: { page: '1', limit: '10' }
      };

      mockWeatherService.getWeatherQueries = jest.fn().mockResolvedValue(mockQueries);

      await WeatherController.getWeatherQueries(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockWeatherService.getWeatherQueries).toHaveBeenCalledWith('1', UserRole.USER, 1, 10);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockQueries,
        message: 'Weather queries retrieved successfully'
      });
    });

    it('should handle errors when fetching queries', async () => {
      mockRequest = {
        user: { userId: '1', email: 'test@example.com', role: UserRole.USER },
        query: {}
      };

      mockWeatherService.getWeatherQueries = jest.fn().mockRejectedValue(
        new Error('Database error')
      );

      await WeatherController.getWeatherQueries(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific city', async () => {
      mockRequest = {
        user: { userId: '1', email: 'admin@example.com', role: UserRole.ADMIN },
        query: { city: 'Istanbul' }
      };

      mockWeatherService.clearCache = jest.fn().mockResolvedValue(undefined);

      await WeatherController.clearCache(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockWeatherService.clearCache).toHaveBeenCalledWith('Istanbul');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Cache cleared for Istanbul'
      });
    });

    it('should clear all cache when no city specified', async () => {
      mockRequest = {
        user: { userId: '1', email: 'admin@example.com', role: UserRole.ADMIN },
        query: {}
      };

      mockWeatherService.clearCache = jest.fn().mockResolvedValue(undefined);

      await WeatherController.clearCache(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockWeatherService.clearCache).toHaveBeenCalledWith(undefined);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'All weather cache cleared'
      });
    });

    it('should handle cache clearing errors', async () => {
      mockRequest = {
        user: { userId: '1', email: 'admin@example.com', role: UserRole.ADMIN },
        query: { city: 'Istanbul' }
      };

      mockWeatherService.clearCache = jest.fn().mockRejectedValue(
        new Error('Redis connection failed')
      );

      await WeatherController.clearCache(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Redis connection failed'
      });
    });
  });
}); 