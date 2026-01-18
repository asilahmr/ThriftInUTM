// Mock notification helper
// Created to satisfy dependency in messageController.js

const sendNotification = async (userId, title, message) => {
    console.log(`[Mock Notification] To User ${userId}: ${title} - ${message}`);
    return true;
};

module.exports = {
    sendNotification
};
