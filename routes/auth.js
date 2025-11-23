import express from 'express';
import { forgotPassword, verifyToken, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/forgot-password', forgotPassword);
router.get('/verify-token/:token', verifyToken);
// Pass token in URL
router.post('/reset-password/:token', resetPassword);

export default router;
