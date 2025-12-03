import express from 'express';
import { 
  getStores, createStore, updateStore, deleteStore,
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
  getGiftCards, createGiftCard, updateGiftCard, deleteGiftCard,
} from '../controllers/storeController.js';

import { authenticateToken } from '../middlewares/auth.js';
import Offer from "../models/offerModel.js";  // ✅ FIXED (REQUIRED)

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
//  OFFER — For Marquee Text
// --------------------------------------

// GET active offers for app homepage marquee
router.get("/offers", async (req, res) => {
  try {
    const offers = await Offer.find({ active: true });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ADD new offer
router.post("/offers", authenticateToken, async (req, res) => {
  try {
    const offer = new Offer({
      message: req.body.message,
      active: true  // default active
    });

    await offer.save();

    res.json({
      message: "Offer created successfully",
      offer
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;
