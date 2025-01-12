const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const taskRoutes = require('./routes/taskRoutes');
const accountRoutes = require('./routes/accountRoutes');
const subscriptionRoutes = require('./routes/notificationRoutes'); // Adjust the path as necessary
const app = express();
const webpush = require('web-push');
require('dotenv').config();

const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

webpush.setVapidDetails(
    'mailto:joellejingyaoyang@gmail.com',
    publicVapidKey,
    privateVapidKey
);

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
app.use('/tasks', taskRoutes);
app.use('/accounts', accountRoutes);
app.use('/subs', subscriptionRoutes);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server is running!");
})
