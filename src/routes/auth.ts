import { Router } from 'express';
import authController from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateRequest, userCreateSchema, userLoginSchema } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validateRequest(userCreateSchema), authController.register);
router.post('/login', validateRequest(userLoginSchema), authController.login);

// Protected routes (Admin only)
router.get('/users', authenticateToken, requireAdmin, authController.getAllUsers);
router.get('/users/:userId', authenticateToken, requireAdmin, authController.getUserById);
router.delete('/users/:userId', authenticateToken, requireAdmin, authController.deleteUser);

export default router; 