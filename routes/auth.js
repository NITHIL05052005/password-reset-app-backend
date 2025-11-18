import express from 'express';
import { forgotPassword, verifyToken, resetPassword } from '../controllers/authController.js';


const router = express.Router();


router.post('/forgot-password', forgotPassword);
router.get('/verify-token/:token', verifyToken);
router.post('/reset-password', resetPassword);


export default router;