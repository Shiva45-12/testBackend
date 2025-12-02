import express from 'express';
import { getPayments, createPayment, deletePayment, getPaymentStats } from '../controllers/paymentController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getPayments);
router.post('/', authenticateToken, createPayment);
router.delete('/:id', authenticateToken, deletePayment);
router.get('/stats', authenticateToken, getPaymentStats);

export default router;