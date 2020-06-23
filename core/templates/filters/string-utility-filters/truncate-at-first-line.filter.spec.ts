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
 * @fileoverview Tests for TruncateAtFirstLine filter for Oppia.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('filters/string-utility-filters/truncate-at-first-line.filter.ts');

describe('Testing filters', function() {
  var filterName = 'truncateAtFirstLine';
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

  it('should truncate multi-line text to the first non-empty line',
    angular.mock.inject(function($filter) {
      var filter = $filter('truncateAtFirstLine');

      expect(filter('')).toEqual('');
      expect(filter(null)).toEqual(null);
      expect(filter(undefined)).toEqual(undefined);

      expect(filter(' A   single line with spaces at either end. ')).toEqual(
        ' A   single line with spaces at either end. ');
      expect(filter('a\nb\nc')).toEqual('a...');
      expect(filter('Removes newline at end\n')).toEqual(
        'Removes newline at end');
      expect(filter('\nRemoves newline at beginning.')).toEqual(
        'Removes newline at beginning.');

      expect(filter('\n')).toEqual('');
      expect(filter('\n\n\n')).toEqual('');

      // Windows
      expect(filter('Single line\r\nWindows EOL')).toEqual('Single line...');
      expect(filter('Single line\u000D\u000AEOL')).toEqual('Single line...');
      expect(filter('Single line\x0D\x0AEOL')).toEqual('Single line...');
      expect(filter('Single line\u000D\x0AEOL')).toEqual('Single line...');
      expect(filter('Single line\x0D\u000AEOL')).toEqual('Single line...');

      // Mac
      expect(filter('Single line\rEOL')).toEqual('Single line...');
      expect(filter('Single line\u000DEOL')).toEqual('Single line...');
      expect(filter('Single line\x0DEOL')).toEqual('Single line...');

      // Linux
      expect(filter('Single line\nEOL')).toEqual('Single line...');
      expect(filter('Single line\u000AEOL')).toEqual('Single line...');
      expect(filter('Single line\x0AEOL')).toEqual('Single line...');

      // Vertical Tab
      expect(filter('Vertical Tab\vEOL')).toEqual('Vertical Tab...');
      expect(filter('Vertical Tab\u000BEOL')).toEqual('Vertical Tab...');
      expect(filter('Vertical Tab\x0BEOL')).toEqual('Vertical Tab...');

      // Form Feed
      expect(filter('Form Feed\fEOL')).toEqual('Form Feed...');
      expect(filter('Form Feed\u000CEOL')).toEqual('Form Feed...');
      expect(filter('Form Feed\x0CEOL')).toEqual('Form Feed...');

      // Next Line
      expect(filter('Next Line\u0085EOL')).toEqual('Next Line...');
      expect(filter('Next Line\x85EOL')).toEqual('Next Line...');

      // Line Separator
      expect(filter('Line Separator\u2028EOL')).toEqual('Line Separator...');

      // Paragraph Separator
      expect(filter('Paragraph Separator\u2029EOL')).toEqual(
        'Paragraph Separator...');
    }));
});
