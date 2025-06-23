import axios from 'axios';
import weatherService from '../services/weatherService';
import redisClient from '../utils/redis';
// import prisma from '../utils/database';
import { UserRole } from '@prisma/client';

// Mock dependencies
jest.mock('axios');
jest.mock('../utils/redis');
jest.mock('../utils/logger');
jest.mock('../utils/database', () => ({
  __esModule: true,
  default: {
    weatherQuery: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn()
    }
  }
}));

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockRedis = redisClient as jest.Mocked<typeof redisClient>;
const mockPrisma = require('../utils/database').default;

describe('WeatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env['OPENWEATHER_API_KEY'] = 'test-api-key';
    process.env['OPENWEATHER_BASE_URL'] = 'https://api.openweathermap.org/data/2.5';
  });

  afterEach(() => {
    delete process.env['OPENWEATHER_API_KEY'];
    delete process.env['OPENWEATHER_BASE_URL'];
  });

  describe('getWeatherData', () => {
    it('should return cached weather data when available', async () => {
      const city = 'Istanbul';
      const userId = '1';
      const cachedData = {
        city: 'Istanbul',
        country: 'TR',
        temperature: 25,
        humidity: 60,
        description: 'Sunny',
        icon: '01d'
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));
      (mockPrisma.weatherQuery.create as jest.Mock).mockResolvedValue({} as any);

      const result = await weatherService.getWeatherData(city, userId);

      expect(result).toEqual(cachedData);
      expect(mockRedis.get).toHaveBeenCalledWith('weather:istanbul');
      expect(mockPrisma.weatherQuery.create).toHaveBeenCalledWith({
        data: {
          city: cachedData.city,
          country: cachedData.country,
          temperature: cachedData.temperature,
          humidity: cachedData.humidity,
          description: cachedData.description,
          icon: cachedData.icon,
          userId
        }
      });
    });

    it('should fetch weather data from API when not cached', async () => {
      const city = 'Istanbul';
      const userId = '1';
      const apiResponse = {
        data: {
          name: 'Istanbul',
          sys: { country: 'TR' },
          main: { temp: 25, humidity: 60 },
          weather: [{ description: 'Sunny', icon: '01d' }]
        }
      };

      const expectedWeatherData = {
        city: 'Istanbul',
        country: 'TR',
        temperature: 25,
        humidity: 60,
        description: 'Sunny',
        icon: '01d'
      };

      mockRedis.get.mockResolvedValue(null);
      mockAxios.get.mockResolvedValue(apiResponse);
      mockRedis.setEx.mockResolvedValue('OK');
      (mockPrisma.weatherQuery.create as jest.Mock).mockResolvedValue({} as any);

      const result = await weatherService.getWeatherData(city, userId);

      expect(result).toEqual(expectedWeatherData);
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://api.openweathermap.org/data/2.5/weather',
        {
          params: {
            q: city,
            appid: 'test-api-key',
            units: 'metric'
          }
        }
      );
      expect(mockRedis.setEx).toHaveBeenCalledWith(
        'weather:istanbul',
        300,
        JSON.stringify(expectedWeatherData)
      );
    });

    it('should handle city not found error', async () => {
      const city = 'InvalidCity';
      const userId = '1';

      mockRedis.get.mockResolvedValue(null);
      const axiosError = new Error('Request failed') as any;
      axiosError.isAxiosError = true;
      axiosError.response = { status: 404 };
      const axiosModule = require('axios');
      axiosModule.isAxiosError = () => true;
      mockAxios.get.mockRejectedValue(axiosError);

      await expect(weatherService.getWeatherData(city, userId)).rejects.toThrow(
        `City '${city}' not found`
      );
    });

    it('should handle API error', async () => {
      const city = 'Istanbul';
      const userId = '1';

      mockRedis.get.mockResolvedValue(null);
      mockAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(weatherService.getWeatherData(city, userId)).rejects.toThrow(
        'Failed to fetch weather data'
      );
    });

    it('should handle missing API key', () => {
      delete process.env['OPENWEATHER_API_KEY'];
      
      expect(() => new (weatherService.constructor as any)()).toThrow(
        'OpenWeather API key is required'
      );
    });
  });

  describe('getWeatherQueries', () => {
    it('should return weather queries for regular user', async () => {
      const userId = '1';
      const userRole = UserRole.USER;
      const page = 1;
      const limit = 10;

      const mockQueries = [
        {
          id: '1',
          city: 'Istanbul',
          temperature: 25,
          createdAt: new Date(),
          user: { id: '1', name: 'Test User', email: 'test@example.com' }
        }
      ];

      (mockPrisma.weatherQuery.findMany as jest.Mock).mockResolvedValue(mockQueries);
      (mockPrisma.weatherQuery.count as jest.Mock).mockResolvedValue(1);

      await weatherService.getWeatherQueries(userId, userRole, page, limit);

      expect(mockPrisma.weatherQuery.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('should return all weather queries for admin user', async () => {
      const userId = '1';
      const userRole = UserRole.ADMIN;
      const page = 1;
      const limit = 10;

      const mockQueries = [
        {
          id: '1',
          city: 'Istanbul',
          temperature: 25,
          createdAt: new Date(),
          user: { id: '1', name: 'Test User', email: 'test@example.com' }
        }
      ];

      (mockPrisma.weatherQuery.findMany as jest.Mock).mockResolvedValue(mockQueries);
      (mockPrisma.weatherQuery.count as jest.Mock).mockResolvedValue(1);

      await weatherService.getWeatherQueries(userId, userRole, page, limit);

      expect(mockPrisma.weatherQuery.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('should handle database error', async () => {
      const userId = '1';
      const userRole = UserRole.USER;

      (mockPrisma.weatherQuery.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(weatherService.getWeatherQueries(userId, userRole)).rejects.toThrow(
        'Failed to fetch weather queries'
      );
    });

    it('should use default pagination values', async () => {
      const userId = '1';
      const userRole = UserRole.USER;

      (mockPrisma.weatherQuery.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.weatherQuery.count as jest.Mock).mockResolvedValue(0);

      await weatherService.getWeatherQueries(userId, userRole);

      expect(mockPrisma.weatherQuery.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10
      });
    });
  });

  describe('clearCache', () => {
    it('should clear cache for specific city', async () => {
      const city = 'Istanbul';

      mockRedis.del.mockResolvedValue(1);

      await weatherService.clearCache(city);

      expect(mockRedis.del).toHaveBeenCalledWith('weather:istanbul');
    });

    it('should clear all weather cache when no city specified', async () => {
      const cacheKeys = ['weather:istanbul', 'weather:ankara', 'weather:izmir'];

      mockRedis.keys.mockResolvedValue(cacheKeys);
      mockRedis.del.mockResolvedValue(3);

      await weatherService.clearCache();

      expect(mockRedis.keys).toHaveBeenCalledWith('weather:*');
      expect(mockRedis.del).toHaveBeenCalledWith(cacheKeys);
    });

    it('should handle empty cache keys', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await weatherService.clearCache();

      expect(mockRedis.keys).toHaveBeenCalledWith('weather:*');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle Redis error', async () => {
      const city = 'Istanbul';

      mockRedis.del.mockRejectedValue(new Error('Redis connection failed'));

      await expect(weatherService.clearCache(city)).rejects.toThrow('Failed to clear cache');
    });
  });
}); 