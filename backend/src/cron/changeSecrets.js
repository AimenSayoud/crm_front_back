const cron = require('node-cron');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/user_model');
const { generateRandomPin, generateRandomPassword } = require('../utils/helpers');
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

//* Function to update passwords and PINs every 3 months
const updatePasswordsAndPins = async () => {
    try {
        console.log('🔄 Running scheduled task: Updating user passwords and PINs...');

        //* Fetch all users
        const users = await User.find();

        for (const user of users) {
            //* Generate new password and PINs
            const newPassword = generateRandomPassword(); //? Custom function to generate passwords
            const newPin1 = generateRandomPin();
            const newPin2 = generateRandomPin();

            //* Hash the new password before saving
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            //* Update the user record
            user.password = hashedPassword;
            user.pin1 = newPin1;
            user.pin2 = newPin2;
            await user.save();

            //* Send SMS with the new credentials
            const messageBody = `🔐 Your new login credentials:\nPassword: ${newPassword}\nPIN 1: ${newPin1}\nPIN 2: ${newPin2}\nKeep them secure.`;

            // await admin.messaging().send({
            //     token: user.phoneNumber, // Make sure phone numbers are stored correctly
            //     notification: {
            //         title: "Your Updated Credentials",
            //         body: messageBody,
            //     }
            // });
            await client.messages.create({
                body: messageBody,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: user.phoneNumber,
            }).then(message => console.log(message.sid));

            console.log(`✅ Updated password and PINs for user: ${user.email}`);
        }
    } catch (error) {
        console.error('❌ Error updating passwords and PINs:', error);
    }
};

//* Schedule the function to run every 3 months
cron.schedule('0 0 1 */3 *', async () => {
    console.log('🕒 Running password/PIN update job...');
    await updatePasswordsAndPins();
}, {
    scheduled: true,
    timezone: "UTC"
});

console.log('✅ Scheduler is running...');


//updatePasswordsAndPins(); //? Runs the function immediately for testing

