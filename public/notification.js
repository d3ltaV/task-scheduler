
// notification.js (client-side)
const publicVapidKey = window.publicVapidKey;

async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            await unsubscribeAndClearCache();
            await registerServiceWorkerAndSubscribe();
            await reinitializeTasks();
        } else {
            console.warn('Notification permission denied.');
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
}

async function unsubscribeAndClearCache() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {//check htat there were prev. sub
        console.log('Push messaging not supported');
        return;
    }

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (const registration of registrations) {
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                await subscription.unsubscribe();
                console.log('Successfully unsubscribed from push notifications');
                
                try {
                    const response = await fetch('/subs/unsubscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                    });

                    if (!response.ok) {
                        console.warn('Server unsubscription failed, but local unsubscription successful');
                    }
                } catch (serverError) {
                    console.warn('Could not contact server for unsubscription:', serverError);
                }
            }
            
            await registration.unregister();
        }

        try {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
            console.log('Caches cleared');
        } catch (cacheError) {
            console.warn('Error clearing caches:', cacheError);
        }

    } catch (error) {
        console.error('Error during unsubscribe and cleanup:', error);
        throw error;
    }
}

async function registerServiceWorkerAndSubscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        throw new Error('Push messaging not supported');
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });
        
        await navigator.serviceWorker.ready;
        
        const applicationServerKey = urlBase64ToUint8Array(publicVapidKey);
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        });

        console.log('User is subscribed:', subscription);
        
        const response = await fetch('/subs/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Failed to subscribe on the server');
        }

        return response;
    } catch (error) {
        console.error('Service worker registration or subscription error:', error);
        throw error;
    }
}

async function reinitializeTasks() {
    try {
        const response = await fetch('/tasks/reinitialize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to reinitialize tasks');
        }
        console.log('Tasks reinitialized successfully');
    } catch (error) {
        console.error('Error reinitializing tasks:', error);
        throw error;
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}