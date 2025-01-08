function showModifyForm(taskId) {
    const form = document.getElementById('modify-task-form-' + taskId);
    const modifyBtn = document.getElementById('modify-btn-' + taskId);
    if (form.style.display === 'block') {
        return;
    }
    form.style.display = 'block'; 
    modifyBtn.style.display = 'none'; 
}

function hideModifyForm(taskId) {
    document.getElementById('modify-task-form-' + taskId).style.display = 'none'; 
    document.getElementById('modify-btn-' + taskId).style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() {
    const subscribeButton = document.getElementById('subscribeButton');
    if (subscribeButton) {
        subscribeButton.addEventListener('click', async function() {
            try {
                await requestNotificationPermission();
                showNotification("You are subscribed!");
            } catch (error) {
                console.error('Error during subscription:', error);
            }
        });
    }
});

function showNotification(message) {
    if (Notification.permission === 'granted') {
        new Notification(message);
    }
}
