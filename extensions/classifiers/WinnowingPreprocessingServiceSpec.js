// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the winnowing preprocessing functions.
 */

describe('Winnowing preprocessing functions', function() {
  beforeEach(module('oppia'));

  describe('Test winnowing preprocessing functions', function() {
    var service;
    beforeEach(inject(function($injector) {
      service = $injector.get('WinnowingPreprocessingService');
    }));

    it('should generate k-gram hashes correctly.', function() {
      var tokenToId = {
        a: 0, b: 1, c: 2
      };
      var tokens = ['a', 'b', 'a', 'c', 'b'];
      var expectedHashes = [3, 11, 7];
      var generatedHashes = service.getKGramHashes(tokens, tokenToId, 3);

      expect(generatedHashes.length).toEqual(3);
      expect(generatedHashes).toEqual(expectedHashes);
    });

    it('should obtain correct fingerprint from hashes', function() {
      var kGramHashes = [3, 11, 7, 10, 8, 6];
      var expectedFingerprint = [[3, 0], [7, 2], [6, 5]];
      var fingerprint = service.getFingerprintFromHashes(kGramHashes, 5, 3);

      expect(fingerprint.length).toEqual(3);
      expect(fingerprint).toEqual(expectedFingerprint);
    });
  });
});
