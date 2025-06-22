# Weather API Backend

A simple weather API built with Node.js, TypeScript, and Express. Fetches weather data from OpenWeather API with caching and user authentication.

## What it does

- Get weather data for any city
- User registration and login with JWT
- Role-based access (admin and regular users)
- Redis caching to reduce API calls
- PostgreSQL database to store users and weather queries

## Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL with Prisma ORM
- Redis for caching
- JWT for authentication
- Jest for testing

## Quick Start

1. **Clone and install**
   ```bash
   git clone https://github.com/afsinlogoglu/app-nation-case
   cd app-nation-case
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your settings:
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/weather_db"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your-secret-key"
   OPENWEATHER_API_KEY="your-api-key"
   PORT=3000
   ```

3. **Set up database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

## API Testing

### Postman Collection
Import `Weather_API.postman_collection.json` into Postman to test all endpoints with pre-configured requests.

### Manual Testing
You can also test endpoints manually using curl or any API client.

## API Endpoints

### Auth
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/users` - Get all users (admin only)

### Weather
- `POST /api/weather/current` - Get current weather for a city
- `GET /api/weather/history` - Get user's weather history
- `DELETE /api/weather/cache` - Clear cache (admin only)

## Testing

```bash
npm test
```

## Docker

```bash
docker-compose up -d
```

## Project Structure

```
src/
├── controllers/  # Request handlers
├── services/     # Business logic
├── middleware/   # Auth and validation
├── routes/       # API routes
├── types/        # TypeScript types
└── utils/        # Database and Redis helpers
```

## Database

Two main tables:
- `users` - user accounts with roles
- `weather_queries` - stored weather data

## Features

- JWT authentication
- Role-based access control
- Redis caching (5 min TTL)
- Input validation
- Error handling
- Rate limiting

## Getting OpenWeather API Key

1. Go to https://openweathermap.org/
2. Sign up for free account
3. Get your API key
4. Add it to .env file

## Notes

- Weather data is cached for 5 minutes
- Admin users can see all users and clear cache
- Regular users can only see their own data
- Rate limit: 100 requests per 15 minutes

## Prepared by Afşin for AppNation Case