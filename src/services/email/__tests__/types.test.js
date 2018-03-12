import { assertInput } from '@ewoken/backend-common/lib/assertSchema';
import { AddressObject, EmailAddressList, EmailMessageInput } from '../types';

const addressObject = {
  address: 'plop@plop.com',
  name: 'plop plop',
};

const emailMessageInput = {
  from: 'plop@plop.com',
  to: [addressObject, 'plip@plip.com'],
  subject: 'Hello World !',
  type: 'EMAIL_TEST',
};

describe('email schemas', () => {
  describe('AddressObject', () => {
    test('should validate an address object', () => {
      assertInput(AddressObject, addressObject);
    });

    test('should reject bad address object', () => {
      expect(() => assertInput({ address: 'plop@plip.com' })).toThrow();
      expect(() => assertInput({ address: 'plopplip.com' })).toThrow();
    });
  });

  describe('EmailAddressList', () => {
    test('should validate an email address list', () => {
      assertInput(EmailAddressList, [addressObject, 'plip@plop.com']);
      assertInput(EmailAddressList, addressObject);
      assertInput(EmailAddressList, 'plip@plop.com');
    });

    test('should reject bad email address lists', () => {
      expect(() => assertInput([])).toThrow();
      expect(() => assertInput(['plip@plip.com', ' plip@plip.com'])).toThrow();
      expect(() =>
        assertInput([
          addressObject,
          { address: ' plop@plop.com', name: 'plip' },
        ]),
      ).toThrow();
      expect(() => assertInput([addressObject, ' plop@plop.com'])).toThrow();
    });
  });

  describe('EmailMessageInput', () => {
    test('should validate an email message input', () => {
      assertInput(EmailMessageInput, {
        ...emailMessageInput,
        text: 'hello world !',
      });
      assertInput(EmailMessageInput, {
        ...emailMessageInput,
        html: '<div></div>',
      });
    });

    test('should reject bad email message input', () => {
      expect(() => assertInput({})).toThrow();
      expect(() => assertInput({ from: 'plop@plop.com' })).toThrow();
      expect(() =>
        assertInput({ ...emailMessageInput, text: 'plop', html: 'plop' }),
      ).toThrow();
    });
  });
});
