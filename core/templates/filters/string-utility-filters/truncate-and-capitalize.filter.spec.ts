// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for TruncateAndCapitalize filter for Oppia.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('filters/string-utility-filters/truncate-and-capitalize.filter.ts');

describe('Testing filters', function() {
  var filterName = 'truncateAndCapitalize';
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should check for null inputs', angular.mock.inject(function($filter) {
    var filter = $filter('truncateAndCapitalize');
    expect(filter(null, 1)).toBeNull();
  }));

  it(
    'should capitalize first letter and truncate string at a word break',
    angular.mock.inject(function($filter) {
      var filter = $filter('truncateAndCapitalize');

      // The first word always appears in the result.
      expect(filter('  remove new Line', 4)).toEqual('Remove...');
      expect(filter('remove New line', 4)).toEqual('Remove...');

      expect(filter('remove New line', 6)).toEqual('Remove...');

      expect(filter('  remove new Line', 10)).toEqual('Remove new...');
      expect(filter('remove New line', 10)).toEqual('Remove New...');

      expect(filter('  remove new Line', 15)).toEqual('Remove new Line');
      expect(filter('remove New line', 15)).toEqual('Remove New line');

      // Strings starting with digits are not affected by the capitalization.
      expect(filter(' 123456 a bc d', 12)).toEqual('123456 a bc...');

      // If the maximum number of characters is not specified, return
      // the whole input string with the first letter capitalized.
      expect(filter('capitalize first letter and truncate')).toEqual(
        'Capitalize first letter and truncate');
      expect(filter(
        'a single sentence with more than twenty one characters', 21
      )).toEqual('A single sentence...');

      expect(filter(
        'a single sentence with more than 21 characters and all will be shown'
      )).toEqual(
        'A single sentence with more than 21 characters and all will be shown');

      // If maximum characters is greater than objective length
      // return whole objective.
      expect(filter('please do not test empty string', 100)).toEqual(
        'Please do not test empty string');
    })
  );
});
