import config from 'config';
import { omit } from 'ramda';
import MailDev from 'maildev';

import buildEnvironment from '../../../environment';
import EmailService from '../index';
import { sent } from '../events';
import Context from '../../../utils/Context';

const f = omit(['createdAt']);

let maildev;

let environment;
let emailService;
let emailServiceEvents;
beforeAll(async () => {
  maildev = new MailDev({
    smtp: config.get('environment.mailer.options.port'),
    silent: true,
  });
  await new Promise((resolve, reject) =>
    maildev.listen(err => {
      if (err) {
        reject(err);
      }
      resolve();
    }),
  );

  environment = await buildEnvironment();
  emailService = new EmailService(environment);
  await emailService.init();
  emailService.onEvent(event => {
    emailServiceEvents.push(event);
  });
});

beforeEach(async () => {
  emailServiceEvents = [];
});

afterAll(async () => {
  await new Promise(resolve => maildev.close(resolve));
  environment.close();
});

describe('emailService', () => {
  const user = {
    id: '7e9e3554-5460-4d49-a91b-277311e9bc0b',
    email: 'plop@plop.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const context = new Context({ user });

  describe('.sendEmail(emailMessageInput, context)', () => {
    const emailMessage = {
      from: 'test@test.com',
      to: 'plop@plop.com',
      subject: 'This is a test',
      text: 'This is a test',
    };

    test('should send an email', async () => {
      const emailMessageSent = await emailService.sendEmail(
        emailMessage,
        context,
      );
      await new Promise(resolve =>
        maildev.on('new', email => {
          resolve(email);
        }),
      );

      expect(emailServiceEvents).toMatchObject([
        f(sent(emailMessageSent, { authorUserId: user.id })),
      ]);
    });

    test.skip('should fail if not logged', async () => {
      const notLoggedContext = new Context({});
      await expect(
        emailService.sendEmail(emailMessage, notLoggedContext),
      ).rejects.toThrow();
    });
  });
});
