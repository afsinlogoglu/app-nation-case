import { Request, Response } from 'express';
import authService from '../services/authService';
import { ApiResponse } from '../types';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const user = await authService.createUser(req.body);
      
      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'User created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user'
      };
      
      res.status(400).json(response);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = await authService.loginUser(req.body);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Login successful'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
      
      res.status(401).json(response);
    }
  }

  async getAllUsers(_req: Request, res: Response) {
    try {
      const users = await authService.getAllUsers();
      
      const response: ApiResponse = {
        success: true,
        data: users,
        message: 'Users retrieved successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve users'
      };
      
      res.status(500).json(response);
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: 'User ID is required'
        };
        res.status(400).json(response);
        return;
      }
      
      const user = await authService.getUserById(userId);
      
      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'User retrieved successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve user'
      };
      
      res.status(404).json(response);
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        const response: ApiResponse = {
          success: false,
          error: 'User ID is required'
        };
        res.status(400).json(response);
        return;
      }
      
      const user = await authService.deleteUser(userId);
      
      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'User deleted successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete user'
      };
      
      res.status(500).json(response);
    }
  }
}

export default new AuthController(); 