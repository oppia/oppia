// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for Validator to check if input has length at
 * least args.
 */

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

require('components/forms/validators/has-length-at-least.filter.ts');

describe('hasLengthAtLeast filter', function() {
  var filterName = 'hasLengthAtLeast';

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  it('should have the relevant filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should impose minimum length bounds', angular.mock.inject(
    function($filter) {
      var filter = $filter('hasLengthAtLeast');
      var args = {
        minValue: 3
      };
      expect(filter('12', args)).toBe(false);
      expect(filter('123', args)).toBe(true);
      expect(filter('1234', args)).toBe(true);
      expect(filter(['1', '2'], args)).toBe(false);
      expect(filter(['1', '2', '3'], args)).toBe(true);
      expect(filter(['1', '2', '3', '4'], args)).toBe(true);
    }
  ));
});
