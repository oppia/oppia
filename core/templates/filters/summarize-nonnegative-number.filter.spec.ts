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
 * @fileoverview Tests for SummarizeNonnegativeNumber filter for Oppia.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('filters/summarize-nonnegative-number.filter.ts');

describe('Testing filters', function() {
  var filterName = 'summarizeNonnegativeNumber';
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

  it(
    'should summarize large number to at most 4 s.f. and append metric prefix',
    angular.mock.inject(function($filter) {
      var filter = $filter('summarizeNonnegativeNumber');

      expect(filter(100)).toEqual(100);
      expect(filter(1720)).toEqual('1.7K');
      expect(filter(2306200)).toEqual('2.3M');

      expect(filter(12389654281)).toEqual('12.4B');
      expect(filter(897978581123)).toEqual('898.0B');
      expect(filter(476678)).toEqual('476.7K');
    })
  );
});
