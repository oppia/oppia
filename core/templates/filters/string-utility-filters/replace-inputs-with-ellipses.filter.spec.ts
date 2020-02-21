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
 * @fileoverview Tests for ReplaceInputsWithEllipses filter for Oppia.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'filters/string-utility-filters/replace-inputs-with-ellipses.filter.ts');

describe('Testing filters', function() {
  var filterName = 'replaceInputsWithEllipses';
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

  it('should convert {{...}} tags to ...', angular.mock.inject(
    function($filter) {
      var filter = $filter('replaceInputsWithEllipses');

      expect(filter('')).toEqual('');
      expect(filter(null)).toEqual('');
      expect(filter(undefined)).toEqual('');

      expect(filter('hello')).toEqual('hello');
      expect(filter('{{hello}}')).toEqual('...');
      expect(filter('{{hello}} and {{goodbye}}')).toEqual('... and ...');
      expect(filter('{{}}{{hello}}')).toEqual('{{}}...');
    }
  ));
});
