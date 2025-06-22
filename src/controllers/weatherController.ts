import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import weatherService from '../services/weatherService';
import { ApiResponse } from '../types';

export class WeatherController {
  async getWeather(req: AuthenticatedRequest, res: Response) {
    try {
      const { city } = req.body;
      const userId = req.user!.userId;
      
      const weatherData = await weatherService.getWeatherData(city, userId);
      
      const response: ApiResponse = {
        success: true,
        data: weatherData,
        message: `Weather data for ${city} retrieved successfully`
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch weather data'
      };
      
      res.status(400).json(response);
    }
  }

  async getWeatherQueries(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 10;
      
      const result = await weatherService.getWeatherQueries(userId, userRole, page, limit);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Weather queries retrieved successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch weather queries'
      };
      
      res.status(500).json(response);
    }
  }

  async clearCache(req: AuthenticatedRequest, res: Response) {
    try {
      const { city } = req.query;
      const cityParam = city as string;
      
      await weatherService.clearCache(cityParam);
      
      const response: ApiResponse = {
        success: true,
        message: cityParam 
          ? `Cache cleared for ${cityParam}`
          : 'All weather cache cleared'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear cache'
      };
      
      res.status(500).json(response);
    }
  }
}

export default new WeatherController(); 