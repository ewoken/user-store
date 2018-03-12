import Joi from 'joi';

const EmailAddress = Joi.string()
  .email()
  .trim()
  .max(255);
const name = Joi.string().max(255);

export const AddressObject = Joi.object({
  address: EmailAddress.required(),
  name: name.required(),
});

const addressOf = addressItem =>
  typeof addressItem === 'string' ? addressItem : addressItem.address;

export const EmailAddressList = Joi.array()
  .single()
  .items([EmailAddress, AddressObject])
  .min(1)
  .max(100)
  .unique((addressItem1, addressItem2) => {
    const address1 = addressOf(addressItem1);
    const address2 = addressOf(addressItem2);

    return address1 === address2;
  });

export const EmailMessageInput = Joi.object({
  from: EmailAddress,
  to: EmailAddressList.required(),
  targetUserId: Joi.string().default(null),
  type: Joi.string().required(),
  subject: Joi.string()
    .min(5)
    .max(255)
    .required(),
  text: Joi.string().min(1),
  html: Joi.string().min(1),
}).xor('text', 'html');

export const EmailMessage = EmailMessageInput.keys({
  id: Joi.string().required(),
  messageId: Joi.string()
    .optional()
    .strip(),
  headers: Joi.object({
    'email-message-id': Joi.string().required(),
    'target-user-id': Joi.string().allow(null),
    'email-message-type': Joi.string().required(),
  }).required(),
});
