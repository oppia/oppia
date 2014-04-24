// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for generic services.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Validators service', function() {
  beforeEach(module('oppia'));

  describe('validators service', function() {
    var vs = null;

    beforeEach(inject(function($injector) {
      vs = $injector.get('validatorsService');
    }));

    it('should correctly validate entity names', function() {
      GLOBALS = {INVALID_NAME_CHARS: 'xyz'};

      expect(vs.isValidEntityName('b')).toBe(true);
      expect(vs.isValidEntityName('b   ')).toBe(true);
      expect(vs.isValidEntityName('   b')).toBe(true);
      expect(vs.isValidEntityName('bd')).toBe(true);

      expect(vs.isValidEntityName('')).toBe(false);
      expect(vs.isValidEntityName('   ')).toBe(false);
      expect(vs.isValidEntityName('x')).toBe(false);
      expect(vs.isValidEntityName('y')).toBe(false);
      expect(vs.isValidEntityName('bx')).toBe(false);
    });
  });
});
