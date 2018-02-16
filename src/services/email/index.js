import Service from '@ewoken/backend-common/lib/Service';
import { assertInput, format } from '@ewoken/backend-common/lib/assertSchema';
import uuid from 'uuid';

import { EmailMessageInput, EmailMessage } from './types';
import { sent } from './events';
import { assertLogged } from '../../utils/authorizations';

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
    assertLogged(context);
    const emailInput = assertInput(EmailMessageInput, emailMessageInput);

    const emailMessageId = uuid();
    const emailMessage = {
      ...emailInput,
      id: emailMessageId,
      headers: {
        'email-message-id': emailMessageId,
      },
      messageId: emailMessageId,
    };

    await this.mailer.sendEmail(emailMessage);

    this.dispatch(sent(emailMessage, { authorUserId: context.user.id }));
    return format(EmailMessage, emailMessage);
  }
}

export default EmailService;
