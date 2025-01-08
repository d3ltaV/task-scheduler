const Tasks = require('../models/tasks');
const isAuthenticated = require('../auth');
const notifs = require('../services/notificationsService');
require('dotenv').config();
exports.showTasks = async (req, res) => {
    if (!isAuthenticated(req)) {
        return res.status(401).json({ error: 'Please login!' });
    }
    const userId = req.session.userId;
    try {
        const tasks = await Tasks.findAll({
            where : {userId}, 
            order : [['position', 'ASC']],
        });
        const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
        // const userId: req.session.userId;
        res.render('homepage', {tasks, publicVapidKey, userId});
    } catch (error) {
        res.status(500).json({error: ":("})
    }
};

exports.addTask = async (req, res) => {
    if (!isAuthenticated(req)) {
        return res.status(401).json({ error: 'Please login!' });
    }
    let { taskName, description, deadline, reminderType, reminderTime, reminderInterval } = req.body;
    const userId = req.session.userId;
    try {
        let deadlineDate = new Date(deadline);
        if (reminderType === 'multi-time') {
            reminderInterval = reminderInterval ? reminderInterval : 60;
            if (!reminderTime) {
                const reminderDate = new Date(deadlineDate);
                reminderDate.setMinutes(reminderDate.getMinutes() - 60);
                reminderTime = reminderDate;
            }
        } else {
            if (!reminderTime) {
                const reminderDate = new Date(deadlineDate);
                reminderDate.setMinutes(reminderDate.getMinutes() - 60);
                reminderTime = reminderDate;
            }
        }
        const maxPositionTask = await Tasks.findOne({
            where: { userId },
            order: [['position', 'DESC']],
        });
        const newPosition = maxPositionTask ? maxPositionTask.position + 1 : 0;
        const newTask = await Tasks.create({taskName, deadline, description, reminderType, reminderTime, reminderInterval : reminderInterval ? reminderInterval :null, userId, position : newPosition});
        notifs.scheduleNotification(newTask);
        res.redirect('/tasks/homepage');
    } catch (error) {
        res.status(400).json({error:'Task creation failed'});
    }
};
exports.deleteTask = async(req, res) => {
    if (!isAuthenticated(req)) {
        return res.status(401).json({ error: 'Please login!' });
    }
    const activeJobs = notifs.activeJobs;
    const taskIds = req.body.taskIds;
    const userId = req.session.userId;
    const normalizedTaskIds = Array.isArray(taskIds) ? taskIds : [taskIds];

    try {
        // First cancel all notifications
        await Promise.all(normalizedTaskIds.map(async taskId => {
            try {
                console.log('Active Jobs:', activeJobs);
                await notifs.cancel(taskId);
                console.log(`Cancelled notifications for task ${taskId}`);
            } catch (cancelError) {
                console.error(`Error cancelling notification for task ${taskId}:`, cancelError);
            }
        }));
        const deletedCount = await Tasks.destroy({
            where: {
                id: normalizedTaskIds, 
                userId
            }
        });
        console.log(`Successfully deleted ${deletedCount} tasks for user ${userId}`);
        res.redirect('/tasks/homepage');
    } catch (error) {
        console.error('Error deleting tasks:', error);
        res.status(400).json({ error: 'Failed to delete tasks' });
    }
}
exports.reinitialize = async (req, res) => { //for initial login
    const userId = req.body.userId;
    try {
      const tasks = await Tasks.findAll({
        where: {
          userId,
        },
      });

      await Promise.all(tasks.map(async (task) => {
        await notifs.cancel(task.id);
      }));
  
      await Promise.all(tasks.map(async (task) => {
        await notifs.scheduleNotification(task);
      }));
      res.status(200).json({ message: 'Tasks reinitialized successfully' });
    } catch (err) {
      console.error('Error reinitializing tasks:', err);
      res.status(500).json({ error: 'Failed to reinitialize tasks' });
    }
};
exports.modifyTask = async(req, res) => {
    if (!isAuthenticated(req)) {
        return res.status(401).json({error : 'Please login!'});
    }
    const userId = req.session.userId;
    const taskId = req.body.taskId;
    try {
        const task = await Tasks.findOne({
            where: {
                id: taskId,
                userId: userId
            }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Cancel existing notifications before modifying
        await notifs.cancel(task.id);

        const { taskName, deadline, description, reminderType, reminderTime, reminderInterval } = req.body;
        
        // Handle deadline and reminder time calculations
        const newDeadline = deadline ? new Date(deadline) : task.deadline;
        let newReminderTime = reminderTime ? new Date(reminderTime) : task.reminderTime;
        
        // If reminder time isn't provided but deadline changed, adjust default reminder
        if (!reminderTime && deadline) {
            newReminderTime = new Date(newDeadline);
            newReminderTime.setMinutes(newReminderTime.getMinutes() - 60);
        }

        // Update task properties
        const updates = {
            taskName: taskName || task.taskName,
            deadline: newDeadline,
            description: description || task.description,
            reminderType: reminderType || task.reminderType,
            reminderTime: newReminderTime,
            reminderInterval: null
        };

        if (updates.reminderType === 'multi-time') {
            updates.reminderInterval = reminderInterval || 60;
        }

        // Update the task
        await task.update(updates);
        
        // Schedule new notification with updated properties
        const updatedTask = await Tasks.findOne({
            where: {
                id: taskId,
                userId: userId
            }
        });

        await notifs.scheduleNotification(updatedTask);
        
        console.log('Task updated and notification rescheduled:', updatedTask);
        res.redirect('/tasks/homepage');
    } catch (error) {
        console.error('Error modifying task:', error);
        res.status(400).json({ error: 'Failed to modify task', details: error.message });
    }
};


// exports.modifyTask = async(req, res) => {
//     if (!isAuthenticated(req)) {
//         return res.status(401).json({error : 'Please login!'});
//     }
//     const userId = req.session.userId;
//     const taskId = req.body.taskId;
//     try {
//         const task = await Tasks.findOne({where : {
//             id: taskId,
//             userId: userId
//         }});
//         await notifs.cancel(task.id);
//         const { taskName, deadline, description, reminderType, reminderTime, reminderInterval } = req.body;
//         console.log(reminderInterval);
//         if (taskName !== undefined) task.taskName = taskName;
//         if (deadline !== undefined) task.deadline = deadline;
//         if (description !== undefined) task.description = description;
//         if (reminderType !== undefined) task.reminderType = reminderType;
//         if (reminderTime !== undefined) task.reminderTime = reminderTime;
//         if (reminderType === 'multi-time') {
//             task.reminderInterval = reminderInterval || 60; 
//         } else {
//             task.reminderInterval = null; 
//         }
//         await task.save();
//         console.log(task);
//         await notifs.scheduleNotification(task);
//         res.redirect('/tasks/homepage');
//     } catch (error) {
//         res.status(400).json({ error: 'Failed to modify task', details: error.message });
//     }
// };
