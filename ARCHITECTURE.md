# Weather API Architecture

This document explains the basic architecture and technical decisions for the Weather API project.

## Overview

The project is a simple weather API that fetches weather data from OpenWeather API and provides role-based access control. It's built as a monolithic application using Node.js, Express, and PostgreSQL.

## Tech Stack

- **Backend**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT tokens
- **Testing**: Jest

## Project Structure

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── middleware/      # Auth and validation
├── routes/          # API endpoints
├── types/           # TypeScript types
└── utils/           # Database and Redis helpers
```

## Database Schema

Two main tables:

**Users Table**
- id, email, password, name, role
- Role can be 'USER' or 'ADMIN'

**Weather Queries Table**
- id, city, country, temperature, humidity, description, icon, userId
- Links to user who made the query

## API Endpoints

**Authentication**
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/users - Get all users (admin only)

**Weather**
- GET /api/weather/current?city=London - Get current weather
- GET /api/weather/history - Get user's weather history
- DELETE /api/weather/cache - Clear cache (admin only)

## Key Features

**Authentication & Authorization**
- JWT tokens for authentication
- Role-based access (admin/user)
- Password hashing with bcrypt

**Caching**
- Redis cache for weather data
- 5-minute cache expiration
- Reduces API calls to OpenWeather

**Error Handling**
- Centralized error handling
- Proper HTTP status codes
- Validation with Joi

## Security

- Environment variables for sensitive data
- Input validation on all endpoints
- JWT token verification middleware
- Password hashing

## Testing

- Unit tests with Jest
- Mocked external dependencies
- Test coverage for main functionality

## Deployment

- Docker containerization
- Environment-based configuration
- Basic health check endpoint

## Future Improvements

- Add more weather endpoints
- Implement rate limiting
- Add logging and monitoring
- Consider microservices if needed 