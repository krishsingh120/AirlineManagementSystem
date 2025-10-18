const cron = require("node-cron");
const emailService = require("../service/email.service");
const sender = require("../config/email.config");

/**
 * 10:00 am
 * Every 5 minutes
 * We will check are their any pending emails which was expected to be sent
 * by now and is pending
 */


const setupJobs = async () => {
    try {
        cron.schedule('*/20 * * * *', async () => {
            // console.log('running a task every 5 min');
            const response = await emailService.fetchPendingEmails();
            response.forEach((email) => {
                sender.sendMail({
                    to: email.recepientEmail,
                    subject: email.subject,
                    text: email.content
                }, async (err, data) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(data);
                        emailService.updateTicket(email.id, { status: "SUCCESS" });

                    }
                })
            });
        });
    } catch (error) {
        console.log(error);
    }
}

module.exports = setupJobs;
