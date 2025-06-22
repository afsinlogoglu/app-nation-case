import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = process.env['DATABASE_URL'] || 'postgresql://test:test@localhost:5432/weather_api_test';
process.env['REDIS_URL'] = process.env['REDIS_URL'] || 'redis://localhost:6379/1';
process.env['JWT_SECRET'] = 'test-secret-key';
process.env['OPENWEATHER_API_KEY'] = 'test-api-key';

// Global test timeout
jest.setTimeout(10000);

// Dummy test to prevent Jest from treating this as a test suite
describe('Test Setup', () => {
  it('should load environment variables', () => {
    expect(process.env['NODE_ENV']).toBe('test');
  });
}); 