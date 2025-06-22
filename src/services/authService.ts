import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/database';
import logger from '../utils/logger';
import { UserCreateInput, UserLoginInput, JWTPayload } from '../types';
import { UserRole } from '@prisma/client';

export class AuthService {
  async createUser(userData: UserCreateInput) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: (userData.role as UserRole) || UserRole.USER
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      logger.info(`User created: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async loginUser(loginData: UserLoginInput) {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: loginData.email }
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role as UserRole
      });

      logger.info(`User logged in: ${user.email}`);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole
        },
        token
      };
    } catch (error) {
      logger.error('Error during login:', error);
      throw error;
    }
  }

  generateToken(payload: JWTPayload): string {
    const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';
    const jwtExpiresIn = process.env['JWT_EXPIRES_IN'] || '24h';
    
    return (jwt as any).sign(payload, jwtSecret, {
      expiresIn: jwtExpiresIn
    });
  }

  verifyToken(token: string): JWTPayload {
    try {
      const jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';
      return (jwt as any).verify(token, jwtSecret) as JWTPayload;
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  async getAllUsers() {
    try {
      const users = await prisma.user.findMany({
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

      return users;
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
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

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Error fetching user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      const user = await prisma.user.delete({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true
        }
      });

      logger.info(`User deleted successfully: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
}

export default new AuthService(); 