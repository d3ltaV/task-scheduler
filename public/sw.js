
// sw.js (Service Worker)
self.addEventListener('install', event => {
    console.log('Service Worker installing.');
});

self.addEventListener('activate', event => {
    console.log('Service Worker activating.');
});

self.addEventListener('push', event => {
    console.log("Push event received");
    let payload;
    try {
        payload = event.data ? event.data.json() : { title: 'Task Reminder', body: 'You have a pending task' };
    } catch (e) {
        console.error('Error parsing payload:', e);
        payload = { 
            title: 'Task Reminder', 
            body: event.data ? event.data.text() : 'You have a pending task' 
        };
    }
    
    console.log("Received payload:", payload);
    
    const options = {
        body: payload.body,
        data: payload.data,
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'View Task'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(payload.title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.action === 'view') {
        clients.openWindow('/tasks/homepage');
    }
});
