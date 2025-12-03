// Server/controllers/offerController.js
// import Offer from "../models/offerModel.js";
import Offer from '../models/offerModel.js';


// GET active offers for app homepage marquee
export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ active: true });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADD new offer
export const createOffer = async (req, res) => {
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
};

// Update offer
export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).json({ message: "Offer not found !" });
    }

    res.json({
      message: "Offer updated  successfully",
      offer
    });
  } catch (err) {
    res.status(500).json({ message:  err.message });
  }
};

// Delete offer
export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findByIdAndDelete(id);

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    res.json({ message: "Offer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};