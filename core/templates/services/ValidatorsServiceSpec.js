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
 * @fileoverview Unit tests for Validators Service.
 */

describe('Validators service', function() {
  beforeEach(module('oppia'));

  describe('validators service', function() {
    beforeEach(module(function($provide) {
      $provide.constant('INVALID_NAME_CHARS', '#xyz');
    }));

    var vs = null;

    beforeEach(inject(function($injector) {
      vs = $injector.get('ValidatorsService');
    }));

    it('should correctly validate entity names', function() {
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

    it('should correctly validate exploration titles', function() {
      expect(vs.isValidExplorationTitle('b')).toBe(true);
      expect(vs.isValidExplorationTitle('abc def')).toBe(true);

      expect(vs.isValidExplorationTitle('')).toBe(false);
      expect(vs.isValidExplorationTitle(null)).toBe(false);
      expect(vs.isValidExplorationTitle(undefined)).toBe(false);
      expect(vs.isValidExplorationTitle(
        'A title with invalid characters #')).toBe(false);
      expect(vs.isValidExplorationTitle(
        'A title that is toooooooooooooooooooooooooo too long.')).toBe(false);
    });

    it('should correctly validate non-emptiness', function() {
      expect(vs.isNonempty('b')).toBe(true);
      expect(vs.isNonempty('abc def')).toBe(true);

      expect(vs.isNonempty('')).toBe(false);
      expect(vs.isNonempty(null)).toBe(false);
      expect(vs.isNonempty(undefined)).toBe(false);
    });

    it('should correctly validate exploration IDs', function() {
      expect(vs.isValidExplorationId('b')).toBe(true);
      expect(vs.isValidExplorationId('2')).toBe(true);
      expect(vs.isValidExplorationId('asbfjkdAFS-_')).toBe(true);

      expect(vs.isValidExplorationId('abc def')).toBe(false);
      expect(vs.isValidExplorationId('')).toBe(false);
      expect(vs.isValidExplorationId('abcd;')).toBe(false);
    });
  });
});
