// Server/routes/storeRoutes.js
import express from 'express';
import { 
  getStores, createStore, updateStore, deleteStore,
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
  getGiftCards, createGiftCard, updateGiftCard, deleteGiftCard,
} from '../controllers/storeController.js';

import { authenticateToken } from '../middlewares/auth.js';
import {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer
} from '../controllers/offerController.js';  // Import from controller

const router = express.Router();

// Store routes
router.get('/stores', authenticateToken, getStores);
router.post('/stores', authenticateToken, createStore);
router.put('/stores/:id', authenticateToken, updateStore);
router.delete('/stores/:id', authenticateToken, deleteStore);

// Coupon routes
router.get('/coupons', authenticateToken, getCoupons);
router.post('/coupons', authenticateToken, createCoupon);
router.put('/coupons/:id', authenticateToken, updateCoupon);
router.delete('/coupons/:id', authenticateToken, deleteCoupon);

// Gift card routes
router.get('/giftcards', authenticateToken, getGiftCards);
router.post('/giftcards', authenticateToken, createGiftCard);
router.put('/giftcards/:id', authenticateToken, updateGiftCard);
router.delete('/giftcards/:id', authenticateToken, deleteGiftCard);

// --------------------------------------
//  OFFER Routes
// --------------------------------------
router.get("/offers", getOffers);
router.post("/offers", authenticateToken, createOffer);
router.put("/offers/:id", authenticateToken, updateOffer);
router.delete("/offers/:id", authenticateToken, deleteOffer);

export default router;