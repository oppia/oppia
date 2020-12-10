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
 * @fileoverview Tests for the convert unicode to html filter.
 */

// TODO(#7222): Remove the following block of unnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.

import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

require('filters/convert-unicode-to-html.filter.ts');

describe('HTML to text', function() {
  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  var htmlUnicodeHtmlPairings = [
    ['abc', 'abc', 'abc'],
    ['&lt;a&copy;&deg;', '<a©°', '&lt;a&#169;&#176;'],
    ['<b>a</b>', 'a', 'a'],
    ['<br>a', 'a', 'a'],
    ['<br/>a', 'a', 'a'],
    ['<br></br>a', 'a', 'a'],
    ['abc  a', 'abc  a', 'abc  a']
  ];

  it('should convert HTML from raw text correctly', angular.mock.inject(
    function($filter) {
      htmlUnicodeHtmlPairings.forEach(function(pairing) {
        expect($filter('convertUnicodeToHtml')(pairing[1])).toEqual(pairing[2]);
      });
    }
  ));
});
