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

import { WinnowingPreprocessingService } from
  'classifiers/winnowing-preprocessing.service';

describe('Winnowing preprocessing functions', () => {
  describe('Test winnowing preprocessing functions', () => {
    var wps: WinnowingPreprocessingService;
    beforeEach(() => {
      wps = new WinnowingPreprocessingService();
    });

    it('should generate k-gram hashes correctly.', () => {
      var tokenToId = {
        a: 0, b: 1, c: 2
      };
      var tokens = ['a', 'b', 'a', 'c', 'b'];
      var expectedHashes = [3, 11, 7];
      var generatedHashes = wps.getKGramHashes(tokens, tokenToId, 3);

      expect(generatedHashes.length).toEqual(3);
      expect(generatedHashes).toEqual(expectedHashes);
    });

    it('should obtain correct fingerprint from hashes', () => {
      var kGramHashes = [3, 11, 7, 10, 8, 6];
      var expectedFingerprint = [[3, 0], [7, 2], [6, 5]];
      var fingerprint = wps.getFingerprintFromHashes(kGramHashes, 5, 3);

      expect(fingerprint.length).toEqual(3);
      expect(fingerprint).toEqual(expectedFingerprint);
    });
  });
});
