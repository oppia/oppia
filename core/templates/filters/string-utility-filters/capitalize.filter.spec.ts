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
 * @fileoverview Tests for Capitalize filter for Oppia.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('filters/string-utility-filters/capitalize.filter.ts');

describe('Testing filters', function() {
  var filterName = 'capitalize';
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module(
    'oppia',
    function($provide: { value: (arg0: string, arg1: string) => void }) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value as string);
      }
    }));

  it('should have all expected filters', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should correctly capitalize strings', angular.mock.inject(
    function($filter) {
      var filter = $filter('capitalize');

      expect(filter('')).toEqual('');
      expect(filter(null)).toEqual(null);
      expect(filter(undefined)).toEqual(undefined);

      expect(filter('a')).toEqual('A');
      expect(filter('a  ')).toEqual('A');
      expect(filter('  a')).toEqual('A');
      expect(filter('  a  ')).toEqual('A');

      expect(filter('a  b ')).toEqual('A  b');
      expect(filter('  a  b ')).toEqual('A  b');
      expect(filter('  ab c ')).toEqual('Ab c');
      expect(filter('  only First lettEr is  Affected ')).toEqual(
        'Only First lettEr is  Affected');
    }
  ));
});
