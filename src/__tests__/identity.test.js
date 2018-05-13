import { assertInternal } from '@ewoken/backend-common/lib/assertSchema';

import { ContextSystem } from '../utils/Context';
import userStore from '../identity';

describe('identity', () => {
  test('should be valid', () => {
    assertInternal(ContextSystem, userStore);
  });
});
