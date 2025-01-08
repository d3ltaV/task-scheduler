const bcrypt = require('bcrypt');
const webpush = require('web-push');
const Users = require('../models/users');
const Subscriptions = require('../models/subscriptions');
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

webpush.setVapidDetails(
  'mailto:joellejingyaoyang@gmail.com',
  publicVapidKey,
  privateVapidKey
);

exports.showRegisterForm = async (req, res) => {
    const subscriptionRecord = await Subscriptions.findOne({ where: { userId: req.user.id } });
    if (subscriptionRecord) {
        const subscription = JSON.parse(subscriptionRecord.subscription);
        const payload = JSON.stringify({
            title: 'Welcome!',
            body: 'Thanks for registering with us!'
        });
        webpush.sendNotification(subscription, payload)
            .then(() => console.log('Notification sent'))
            .catch(error => console.error('Error sending notification:', error));
    }
    res.render('register');
};

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    const userExists = await Users.findOne({ where: { email } });
    if (userExists) {
        return res.status(400).send('User already exists');
    }
    if (!username || !email || !password) {
        return res.status(400).send('Please complete all fields!'); // Overridden by HTML
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await Users.create({
        username,
        email,
        password: hashedPassword,
    });

    res.redirect('/accounts/login');
};

exports.showLoginForm = (req, res) => {
    res.render('login');
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = await Users.findOne({ where: { email } });
    if (!user) {
        return res.redirect('/accounts/login?error=User does not exist.');
    }
    if (!email || !password) {
        return res.status(400).send('Please complete all fields!'); // Overridden by HTML
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.redirect('/accounts/login?error=Incorrect password!');
    }
    req.session.userId = user.id;
    req
    res.redirect('/tasks/homepage');
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/accounts/login');
    });
};
