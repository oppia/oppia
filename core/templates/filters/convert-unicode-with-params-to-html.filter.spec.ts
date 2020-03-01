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
 * @fileoverview Tests for the convert unicode with params to html filter.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'filters/convert-unicode-with-params-to-html.filter.ts');

describe('HTML to text', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  var invalidUnicodeStrings = [
    '{}',
    '}}abc{{',
    '\\{{a}}',
    '{{a\\}}',
    '{{a}\\}'
  ];

  it('should detect invalid unicode strings', angular.mock.inject(
    function($filter) {
      invalidUnicodeStrings.forEach(function(s) {
        var fn = function() {
          return $filter('convertUnicodeWithParamsToHtml')(s);
        };
        expect(fn).toThrow();
      });
    }));

  var validUnicodeStrings = [
    '{{}}',
    '{{abc}}',
    '\\\\{{abc}}',
    '\\{{{abc}}'
  ];

  it('should detect valid unicode strings', angular.mock.inject(
    function($filter) {
      var results = [
        '<oppia-parameter></oppia-parameter>',
        '<oppia-parameter>abc</oppia-parameter>',
        '\\<oppia-parameter>abc</oppia-parameter>',
        '{<oppia-parameter>abc</oppia-parameter>',
      ];
      validUnicodeStrings.forEach(function(s, i) {
        var fn = (function() {
          return $filter('convertUnicodeWithParamsToHtml')(s);
        })();
        expect(fn).toEqual(results[i]);
      });
    }));
});
