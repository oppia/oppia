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
 * @fileoverview Tests for Truncate filter for Oppia.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('filters/string-utility-filters/truncate.filter.ts');

describe('Testing filters', function() {
  var filterName = 'truncate';
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

  it('should validate inputs and return filtered string correctly',
    angular.mock.inject(function($filter) {
      var filter = $filter('truncate');
      // Checking when input is null.
      expect(filter(null, 4, '...')).toEqual('');
      // Checking when length parameter is NaN.
      expect(filter('example', 'a', '...')).toEqual('example');
      // Checking when input is not a string.
      expect(filter(1, 4, '...')).toEqual('1');
      // Checking when suffix is undefined.
      var testSuffix;
      expect(filter('example', 10, testSuffix)).toEqual('example');
      // Checking when length of input is greater than the length parameter.
      expect(filter('example of long input', 18, '...')).toEqual(
        'example of long...');
    }));
});
