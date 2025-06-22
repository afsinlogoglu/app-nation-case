import axios from 'axios';
import redisClient from '../utils/redis';
import prisma from '../utils/database';
import logger from '../utils/logger';
import { WeatherData, OpenWeatherResponse } from '../types';
import { UserRole } from '@prisma/client';

export class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly cacheExpiry = 300; // 5 minutes

  constructor() {
    this.apiKey = process.env['OPENWEATHER_API_KEY'] || '';
    this.baseUrl = process.env['OPENWEATHER_BASE_URL'] || 'https://api.openweathermap.org/data/2.5';
    
    if (!this.apiKey) {
      throw new Error('OpenWeather API key is required');
    }
  }

  async getWeatherData(city: string, userId: string): Promise<WeatherData> {
    try {
      // Check cache first
      const cacheKey = `weather:${city.toLowerCase()}`;
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        logger.info(`Weather data for ${city} retrieved from cache`);
        const weatherData = JSON.parse(cachedData);
        
        // Save query to database
        await this.saveWeatherQuery(weatherData, userId);
        
        return weatherData;
      }

      // Fetch from OpenWeather API
      const response = await axios.get<OpenWeatherResponse>(
        `${this.baseUrl}/weather`,
        {
          params: {
            q: city,
            appid: this.apiKey,
            units: 'metric'
          }
        }
      );

      const weatherData: WeatherData = {
        city: response.data.name,
        country: response.data.sys.country,
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        description: response.data.weather[0]?.description || '',
        icon: response.data.weather[0]?.icon || ''
      };

      // Cache the data
      await redisClient.setEx(cacheKey, this.cacheExpiry, JSON.stringify(weatherData));
      logger.info(`Weather data for ${city} cached successfully`);

      // Save query to database
      await this.saveWeatherQuery(weatherData, userId);

      return weatherData;
    } catch (error) {
      logger.error(`Error fetching weather data for ${city}:`, error);
      
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`City '${city}' not found`);
      }
      
      throw new Error('Failed to fetch weather data');
    }
  }

  private async saveWeatherQuery(weatherData: WeatherData, userId: string): Promise<void> {
    try {
      await prisma.weatherQuery.create({
        data: {
          city: weatherData.city,
          country: weatherData.country ?? null,
          temperature: weatherData.temperature,
          humidity: weatherData.humidity ?? null,
          description: weatherData.description ?? null,
          icon: weatherData.icon ?? null,
          userId
        }
      });
      logger.info(`Weather query saved for user ${userId}`);
    } catch (error) {
      logger.error('Error saving weather query:', error);
      // Don't throw error here as the main functionality should still work
    }
  }

  async getWeatherQueries(userId: string, userRole: UserRole, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause = userRole === UserRole.ADMIN ? {} : { userId };
      
      const [queries, total] = await Promise.all([
        prisma.weatherQuery.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.weatherQuery.count({
          where: whereClause
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: queries,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error fetching weather queries:', error);
      throw new Error('Failed to fetch weather queries');
    }
  }

  async clearCache(city?: string): Promise<void> {
    try {
      if (city) {
        const cacheKey = `weather:${city.toLowerCase()}`;
        await redisClient.del(cacheKey);
        logger.info(`Cache cleared for ${city}`);
      } else {
        // Clear all weather cache keys
        const keys = await redisClient.keys('weather:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
          logger.info(`Cleared ${keys.length} cache entries`);
        }
      }
    } catch (error) {
      logger.error('Error clearing cache:', error);
      throw new Error('Failed to clear cache');
    }
  }
}

export default new WeatherService(); 