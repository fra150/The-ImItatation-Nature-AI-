// src/services/notificationService.js
const mqtt = require('mqtt');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { startChatSession } = require('./geminiService');
const validator = require('validator');

// MQTT client configuration
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL);
mqttClient.on('connect', () => {
  logger.info('Connected to MQTT broker');
});

mqttClient.on('error', (error) => {
  logger.error('MQTT connection error:', error);
});

// Nodemailer transporter configuration for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a notification about a fire event.
 * @param {Object} fireEvent - The fire event to notify about.
 */
const sendNotification = async (fireEvent) => {
  try {
    // Generate the notification message
    const notificationMessage = `Fire event detected: ${JSON.stringify(fireEvent)}`; 
    // Request a report from Gemini AI
    const geminiNotification = await startChatSession(notificationMessage);

    // Generate the notification content
    const { email, subject, message } = generateNotificationContent(fireEvent, geminiNotification);

    // Validate the email address
    if (!validator.isEmail(email)) {
      throw new Error('Invalid email address');
    }

    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text: message,
    });

    logger.info(`Notification sent to ${email}`);
  } catch (error) {
    logger.error('Error sending notification:', error);
    // Here you can add additional error handling actions, such as resending or notifying a monitoring system
  }
};

/**
 * Generates the notification content (email, subject, message).
 * @param {Object} fireEvent - The fire event.
 * @param {string} geminiNotification - The report from Gemini AI.
 * @returns {Object} Notification content.
 */
const generateNotificationContent = (fireEvent, geminiNotification) => {
  // Check that fireEvent contains meaningful information
  if (!fireEvent || Object.keys(fireEvent).length === 0) {
    throw new Error('Invalid fire event data');
  }

  // Generate the email content based on the fire event and the Gemini report
  return {
    email: process.env.NOTIFICATION_EMAIL_RECIPIENT,
    subject: process.env.NOTIFICATION_EMAIL_SUBJECT || 'Fire Event Notification',
    message: `Fire event details: ${JSON.stringify(fireEvent, null, 2)}

Gemini AI report:
${geminiNotification}`,
  };
};

module.exports = {
  sendNotification,
  generateNotificationContent,
};


/* I've written a Node.js script that's designed to send notifications about fire events. The script uses the MQTT protocol for communication, Nodemailer for sending emails, and a Gemini AI service for generating reports.
The script starts by importing the necessary modules and setting up the MQTT client and Nodemailer transporter. The MQTT client is configured to connect to a broker using the URL provided in the environment variables. If the connection is successful, a log message is printed to the console. If an error occurs during the connection, the error is logged to the console.
The main function of the script is the `sendNotification` function, which is called when a fire event is detected. This function generates a notification message based on the fire event data, requests a report from the Gemini AI service, and generates the content of the notification email.
The `generateNotificationContent` function is used to create the email content. It takes the fire event data and the Gemini AI report as input and returns an object containing the email recipient, subject, and message. The function also validates that the fire event data is not empty.
The script uses the `validator` module to validate the email address before sending the email. If the email address is invalid, an error is thrown. */ 