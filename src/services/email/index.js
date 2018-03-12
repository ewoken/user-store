import Service from '@ewoken/backend-common/lib/Service';
import { assertInput, format } from '@ewoken/backend-common/lib/assertSchema';
import uuid from 'uuid';

import { EmailMessageInput, EmailMessage } from './types';
import { sent } from './events';

class EmailService extends Service {
  constructor(environment) {
    super('EmailService', environment);
    this.mailer = environment.mailer;
  }

  async init(/* services */) {
    // this.userService = services.userService;
    return this;
  }

  async sendEmail(emailMessageInput, context) {
    // context.assertLogged();
    const { targetUserId, ...emailInput } = assertInput(
      EmailMessageInput,
      emailMessageInput,
    );
    const authorUserId = context.isLogged() ? context.user.id : null;

    const emailMessageId = uuid();
    const emailMessage = {
      ...emailInput,
      id: emailMessageId,
      headers: {
        'email-message-id': emailMessageId,
        'target-user-id': targetUserId,
      },
      messageId: emailMessageId,
    };

    await this.mailer.sendEmail(emailMessage);

    this.dispatch(sent(emailMessage, { authorUserId, targetUserId }));
    return format(EmailMessage, emailMessage);
  }
}

export default EmailService;
