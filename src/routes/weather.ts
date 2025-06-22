import { Router } from 'express';
import weatherController from '../controllers/weatherController';
import { authenticateToken, requireUser, requireAdmin } from '../middleware/auth';
import { validateRequest, validateQuery, weatherQuerySchema, paginationSchema } from '../middleware/validation';

const router = Router();

// All weather routes require authentication
router.use(authenticateToken);

// Get weather data for a city
router.post('/current', validateRequest(weatherQuerySchema), requireUser, weatherController.getWeather);

// Get weather query history (users see their own, admins see all)
router.get('/history', validateQuery(paginationSchema), requireUser, weatherController.getWeatherQueries);

// Clear cache (Admin only)
router.delete('/cache', requireAdmin, weatherController.clearCache);

export default router; 