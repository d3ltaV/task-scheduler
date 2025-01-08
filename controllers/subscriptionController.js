const Subscriptions = require('../models/subscriptions');
require('dotenv').config();
exports.unsubscribe = async (req, res) => {
  try {
    const userId = req.session.userId;
    const subscriptions = await Subscriptions.findAll({
      where: { userId },
    });

    if (subscriptions.length > 0) {
      for (let subscription of subscriptions) {
        await subscription.destroy();
      }
      console.log('All subscriptions destroyed successfully');
      return res.status(200).json({ message: 'Unsubscribed successfully' });
    } else {
      console.log('No subscriptions found for this user');
      return res.status(404).json({ error: 'Subscription not found' });
    }
  } catch (err) {
    console.error('Error during unsubscribe:', err);
    return res.status(500).json({ error: 'Failed to unsubscribe' });
  }
};

exports.subscribe = async (req, res) => {
  const subscription = req.body;
  const userId = req.session.userId;
  try {
    await Subscriptions.create({
      userId: userId,
      subscription: JSON.stringify(subscription),
    });
    return res.status(201).json({ message: 'Subscription saved successfully!' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return res.status(500).json({ error: 'Failed to save subscription' });
  }
};
