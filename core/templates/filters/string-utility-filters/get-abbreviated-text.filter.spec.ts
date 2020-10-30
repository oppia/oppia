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
 * @fileoverview Tests for GetAbbreviatedText filter for Oppia.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('filters/string-utility-filters/get-abbreviated-text.filter.ts');

describe('Testing filters', function() {
  var filterName = 'getAbbreviatedText';
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

  it('should not shorten the length of text', angular.mock.inject(
    function($filter) {
      expect($filter('getAbbreviatedText')('It will remain unchanged.', 50))
        .toBe('It will remain unchanged.');
      expect($filter('getAbbreviatedText')(
        'Itisjustaverylongsinglewordfortesting',
        50)).toBe('Itisjustaverylongsinglewordfortesting');
    }
  ));

  it('should shorten the length of text', angular.mock.inject(
    function($filter) {
      expect($filter('getAbbreviatedText')(
        'It has to convert to a substring as it exceeds the character limit.',
        50)).toBe('It has to convert to a substring as it exceeds...');
      expect($filter('getAbbreviatedText')(
        'ItisjustaverylongsinglewordfortestinggetAbbreviatedText',
        50)).toBe('ItisjustaverylongsinglewordfortestinggetAbbreviate...');
      expect($filter('getAbbreviatedText')(
        'â, ??î or ôu🕧� n☁i✑💴++$-💯 ♓!🇪🚑🌚‼⁉4⃣od; /⏬®;😁☕😁:☝)😁😁😍1!@#',
        50)).toBe('â, ??î or ôu🕧� n☁i✑💴++$-💯 ♓!🇪🚑🌚‼⁉4⃣od;...');
      expect($filter('getAbbreviatedText')(
        'It is just a very long singlewordfortestinggetAbbreviatedText',
        50)).toBe('It is just a very long...');
    }
  ));
});
