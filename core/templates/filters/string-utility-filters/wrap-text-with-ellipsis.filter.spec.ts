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
 * @fileoverview Tests for the WrapTextWithEllipsis filter for Oppia.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('filters/string-utility-filters/wrap-text-with-ellipsis.filter.ts');

describe('Testing filters', function() {
  var filterName = 'wrapTextWithEllipsis';
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

  it('should wrap text with ellipses based on its length', angular.mock.inject(
    function($filter) {
      var filter = $filter('wrapTextWithEllipsis');

      expect(filter('', 0)).toEqual('');
      expect(filter(null, 0)).toEqual(null);
      expect(filter(undefined, 0)).toEqual(undefined);

      expect(filter('testing', 0)).toEqual('testing');
      expect(filter('testing', 1)).toEqual('testing');
      expect(filter('testing', 2)).toEqual('testing');
      expect(filter('testing', 3)).toEqual('...');
      expect(filter('testing', 4)).toEqual('t...');
      expect(filter('testing', 7)).toEqual('testing');
      expect(filter('Long sentence which goes on and on.', 80)).toEqual(
        'Long sentence which goes on and on.');
      expect(filter('Long sentence which goes on and on.', 20)).toEqual(
        'Long sentence whi...');
      expect(filter('Sentence     with     long     spacing.', 20)).toEqual(
        'Sentence with lon...');
      expect(filter('With space before ellipsis.', 21)).toEqual(
        'With space before...');
    }
  ));
});
