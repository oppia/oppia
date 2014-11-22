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
 * @fileoverview Unit tests for StateTransitionService and associated services.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Expression interpolation service', function() {
  beforeEach(module('oppia'));

  describe('expression interpolation service', function() {
    var expressionInterpolationService = null;

    beforeEach(inject(function($injector) {
      expressionInterpolationService = $injector.get('expressionInterpolationService');
    }));

    it('should correctly interpolate strings', function() {
      expect(expressionInterpolationService.processString('abc', [{}])).toEqual('abc');
      expect(
        expressionInterpolationService.processString('abc{{a}}', [{'a': 'b'}])
      ).toEqual('abcb');
      expect(expressionInterpolationService.processString('abc{{a}}', [{}])).toBeNull();
    });

    it('should correctly interpolate values', function() {
      expect(
        expressionInterpolationService.processValue('{{a}}', [{'a': 'b'}])
      ).toEqual('b');
      expect(function() {
        expressionInterpolationService.processValue('a', [{'a': 'b'}])
      }).toThrow();
      expect(expressionInterpolationService.processValue('{{a}}', [{}])).toBeNull();
    });
  });
});
