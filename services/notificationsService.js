// notificationsService.js
const Subscriptions = require('../models/subscriptions');
const webpush = require('web-push');
const cron = require('node-cron');
const Tasks = require('../models/tasks');

const activeJobs = new Map();

async function getSubscription(userId) {
    try {
        const subscriptionRecord = await Subscriptions.findOne({ 
            where: { userId: userId },
            order: [['createdAt', 'DESC']]
        });
        
        if (!subscriptionRecord) {
            console.log(`No subscription found for user: ${userId}`);
            return null;
        }

        return JSON.parse(subscriptionRecord.subscription);
    } catch (error) {
        console.error('Error getting subscription:', error);
        return null;
    }
}

async function sendNotification(userId, task) {
    try {
        const taskExists = await Tasks.findOne({ where: { id: task.id, userId: userId }});
        if (!taskExists) {
            console.log(`Task ${task.id} no longer exists, cancelling notification`);
            await cancel(task.id);
            return;
        }

        const subscription = await getSubscription(userId);
        if (!subscription) {
            console.error(`No subscription found for user: ${userId}`);
            return;
        }

        const payload = JSON.stringify({
            title: 'Task Reminder',
            body: `Reminder: ${task.taskName}`,
            data: {
                taskId: task.id,
                userId: userId
            }
        });

        await webpush.sendNotification(subscription, payload);
        console.log(`Notification sent for task: ${task.taskName} (ID: ${task.id})`);
    } catch (error) {
        if (error.statusCode === 410 || error.code === 'InvalidSubscription') {
            console.log(`Invalid subscription for user ${userId}, cleaning up...`);
            await Subscriptions.destroy({ where: { userId: userId }});
        } else {
            console.error('Error sending notification:', error);
        }
    }
}

// Modified notificationsService.js scheduleNotification function
async function scheduleNotification(task) {
    try {
        const now = new Date();
        const deadlineDate = new Date(task.deadline);
        const reminderDate = new Date(task.reminderTime);
        if (now >= deadlineDate) {
            console.log(`Task ${task.id} has passed deadline, not scheduling notification`);
            return;
        }
        await cancel(task.id);

        if (task.reminderType === "one-time") {
            if (now < reminderDate) {
                await scheduleOneNotification(reminderDate, task, deadlineDate);
                console.log(`Scheduled one-time notification for task ${task.id} at ${reminderDate}`);
            }
        } else if (task.reminderType === "multi-time") {
            await scheduleMultiNotification(reminderDate, task, deadlineDate, task.reminderInterval);
            console.log(`Scheduled multi-time notifications for task ${task.id} starting at ${reminderDate}`);
        }
    } catch (error) {
        console.error(`Error scheduling notification for task ${task.id}:`, error);
        throw error;
    }
}


async function scheduleOneNotification(reminderDate, task, deadline) {
    const now = new Date();
    if (now > new Date(deadline)) return;
    
    const cronTime = convertCronTime(new Date(reminderDate));
    const job = cron.schedule(cronTime, async () => {
        await sendNotification(task.userId, task);
    });
    
    activeJobs.set(task.id, {
        type: 'cron',
        job: job,
        taskName: task.taskName,
        createdAt: Date.now()
    });
    
    console.log(`Scheduled one-time notification for task ${task.id}`);
}

async function scheduleMultiNotification(reminderDate, task, deadline, reminderInterval) {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const startDate = new Date(reminderDate);

    if (now >= deadlineDate) {
        console.log(`Task ${task.id} has passed its deadline, not scheduling notifications.`);
        return;
    }

    //Clear any existing jobs for this task
    await cancel(task.id);

    const intervalMs = reminderInterval * 60000;

    // Calculate the next notification time
    let nextNotificationTime;
    if (now < startDate) {
        nextNotificationTime = startDate;
    } else {
        //If we're past the start date, calculate the next interval
        const timeSinceStart = now.getTime() - startDate.getTime();
        const intervalsElapsed = Math.ceil(timeSinceStart / intervalMs);
        nextNotificationTime = new Date(startDate.getTime() + (intervalsElapsed * intervalMs));
        
        //If the next calculated time is in the past, move to the next interval
        if (nextNotificationTime <= now) {
            nextNotificationTime = new Date(nextNotificationTime.getTime() + intervalMs);
        }
    }

    if (nextNotificationTime >= deadlineDate) {
        console.log(`Next notification would be after deadline for task ${task.id}, not scheduling.`);
        return;
    }

    // Schedule initial timeout to start the notifications
    const initialWaitTime = nextNotificationTime.getTime() - now.getTime();
    const timeout = setTimeout(() => {
        sendNotification(task.userId, task).then(() => {
            const interval = setInterval(async () => {
                const currentTime = new Date();
                if (currentTime >= deadlineDate) {
                    clearInterval(interval);
                    activeJobs.delete(task.id);
                    return;
                }

                const taskExists = await Tasks.findOne({ 
                    where: { id: task.id, userId: task.userId } 
                });
                
                if (!taskExists) {
                    clearInterval(interval);
                    activeJobs.delete(task.id);
                    return;
                }

                await sendNotification(task.userId, task);
            }, intervalMs);
            activeJobs.set(task.id, {
                type: 'interval',
                job: interval,
                taskName: task.taskName,
                createdAt: Date.now()
            });
        });
    }, initialWaitTime);

    activeJobs.set(task.id, {
        type: 'timeout',
        job: timeout,
        taskName: task.taskName,
        createdAt: Date.now()
    });

    console.log(`Scheduled multi-time notifications for task ${task.id}:
        Start time: ${nextNotificationTime}
        Interval: ${reminderInterval} minutes
        Deadline: ${deadlineDate}`);
}
async function cancel(taskId) {
    console.log(`Attempting to cancel notifications for task ${taskId}`);
    const numericTaskId = Number(taskId);
    const jobInfo = activeJobs.get(numericTaskId);
    
    if (jobInfo) {
        try {
            switch(jobInfo.type) {
                case 'interval':
                    clearInterval(jobInfo.job);
                    break;
                case 'timeout':
                    clearTimeout(jobInfo.job);
                    break;
                case 'cron':
                    jobInfo.job.stop();
                    break;
                default:
                    console.warn(`Unknown job type for task ${taskId}: ${jobInfo.type}`);
            }
            activeJobs.delete(numericTaskId);
            console.log(`Successfully cancelled notifications for task ${taskId}`);
        } catch (error) {
            console.error(`Error cancelling job for task ${taskId}:`, error);
            activeJobs.delete(numericTaskId);
        }
    } else {
        console.log(`No active job found for task ${taskId}`);
    }
}
function convertCronTime(date) {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${minutes} ${hours} ${day} ${month} *`;
}


module.exports = { scheduleNotification, cancel, activeJobs };