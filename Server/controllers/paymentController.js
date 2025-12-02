import Payment from '../models/Payment.js';

export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    res.json({ totalPayments: totalPayments[0]?.total || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};