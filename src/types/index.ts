import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface WeatherQuery {
  id: string;
  city: string;
  country?: string;
  temperature: number;
  humidity?: number;
  description?: string;
  icon?: string;
  userId: string;
  createdAt: Date;
}

export interface WeatherData {
  city: string;
  country?: string;
  temperature: number;
  humidity?: number;
  description?: string;
  icon?: string;
}

export interface OpenWeatherResponse {
  weather: Array<{
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    humidity: number;
  };
  sys: {
    country: string;
  };
  name: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RequestWithUser extends Request {
  user?: JWTPayload;
} 

export { UserRole };
