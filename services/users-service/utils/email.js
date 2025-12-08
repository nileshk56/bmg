import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_REGION });

export const sendEmail = async ({ to, subject, html, from }) => {
    const Source = from || process.env.SES_SOURCE_ADDRESS;
    const params = {
        Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
        Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
                Html: { Data: html, Charset: 'UTF-8' }
            }
        },
        Source
    };

    try {
        await ses.send(new SendEmailCommand(params));
    } catch (err) {
        // rethrow or log as appropriate for your app
        throw err;
    }
};