function showModifyForm(taskId) {
    const form = document.getElementById('modify-task-form-' + taskId);
    const modifyBtn = document.getElementById('modify-btn-' + taskId);
    
    if (form.style.display === 'block') return;

    const dateInputs = form.querySelectorAll('input[type="datetime-local"]');
    dateInputs.forEach(input => {
        if (input.value) {
            // Convert UTC time to local time
            const utcTime = new Date(input.value + 'Z');
            // Adjust for local timezone
            const localTime = new Date(utcTime);
            // Format as YYYY-MM-DDTHH:mm
            const year = localTime.getFullYear();
            const month = String(localTime.getMonth() + 1).padStart(2, '0');
            const day = String(localTime.getDate()).padStart(2, '0');
            const hours = String(localTime.getHours()).padStart(2, '0');
            const minutes = String(localTime.getMinutes()).padStart(2, '0');
            
            input.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
    });

    form.style.display = 'block';
    modifyBtn.style.display = 'none';
}

function hideModifyForm(taskId) {
    document.getElementById('modify-task-form-' + taskId).style.display = 'none';
    document.getElementById('modify-btn-' + taskId).style.display = 'block';
}
document.addEventListener('DOMContentLoaded', () => {
    const subscribeButton = document.getElementById('subscribeButton');
    if (subscribeButton) {
        subscribeButton.addEventListener('click', async () => {
            try {
                await requestNotificationPermission();
                showNotification("You are subscribed!");
            } catch (error) {
                console.error('Error during subscription:', error);
            }
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    requestNotificationPermission();
}, {once: true});

function showNotification(message) {
    if (Notification.permission === 'granted') {
        new Notification(message);
    }
}
