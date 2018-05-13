import { assertInput } from '@ewoken/backend-common/lib/assertSchema';
import Context, { ContextInitializer } from '../Context';

const user = {
  id: 'de3bf58c-20e5-4c7d-8a0c-1d60c06c0f47',
  email: 'plop@plop.com',
  createdAt: '2018-05-10T10:22:21.146Z',
  updatedAt: '2018-05-10T10:22:21.146Z',
};
const system = {
  name: 'test',
  version: 'test',
  instanceId: 'test',
};

describe('ContextInitializer schema', () => {
  test('should validate a context initializer with system', () => {
    assertInput(ContextInitializer, {
      requestId: '1',
      system,
      t: i => i,
    });
  });

  test('should validate a context initializer with user', () => {
    assertInput(ContextInitializer, {
      user,
    });
  });

  test('should throw an error on bad user', () => {
    expect(() =>
      assertInput(ContextInitializer, {
        user: {},
      }),
    ).toThrow(/Validation error/);
  });

  test('should throw an error when user and system are defined', () => {
    expect(() =>
      assertInput(ContextInitializer, {
        requestId: '1',
        user,
        system,
        t: i => i,
      }),
    ).toThrow(/Validation error/);
  });
});

describe('Context', () => {
  describe('.assertNotLogged()', () => {
    test('should assert whether a user is not logged or throw', () => {
      new Context().assertNotLogged();
      expect(() => new Context({ user }).assertNotLogged()).toThrow(/logged/);
    });
  });
  describe('.assertLogged()', () => {
    test('should assert whether a user is logged or throw', () => {
      new Context({ user }).assertLogged();
      expect(() => new Context().assertLogged()).toThrow(/Unauthorized/);
    });
  });
  describe('.assertToBeUser(userId)', () => {
    test('should assert whether it is a specific user or not', () => {
      new Context({
        user,
      }).assertToBeUser(user.id);
      expect(() => new Context().assertToBeUser(user.id)).toThrow(
        /Unauthorized/,
      );
      expect(() => new Context({ user }).assertToBeUser('plop')).toThrow(
        /Forbidden/,
      );
    });
  });
  describe('.assertAuthentified()', () => {
    test('should assert whether a there is a user or system authentified', () => {
      new Context({ user }).assertAuthentified();
      new Context({ system }).assertAuthentified();
      expect(() => new Context().assertAuthentified()).toThrow(/Unauthorized/);
    });
  });
  describe('.assertIsSystem()', () => {
    test('should assert whether it is a system or not', () => {
      expect(() => new Context({ user }).assertIsSystem()).toThrow(/Forbidden/);
      new Context({ system }).assertIsSystem();
      expect(() => new Context().assertIsSystem()).toThrow(/Unauthorized/);
    });
  });
  describe('.isLogged()', () => {
    test('should return whether a user is logged or not', () => {
      expect(new Context().isLogged()).toBe(false);
      expect(new Context({ user }).isLogged()).toBe(true);
      expect(new Context({ system }).isLogged()).toBe(false);
    });
  });
  describe('.isSystem()', () => {
    test('should assert whether request is from a system or not', () => {
      expect(new Context().isSystem()).toBe(false);
      expect(new Context({ user }).isSystem()).toBe(false);
      expect(new Context({ system }).isSystem()).toBe(true);
    });
  });
  describe('.isAuthentified()', () => {
    test('should assert whether request is authentified or not', () => {
      expect(new Context().isAuthentified()).toBe(false);
      expect(new Context({ user }).isAuthentified()).toBe(true);
      expect(new Context({ system }).isAuthentified()).toBe(true);
    });
  });
});
