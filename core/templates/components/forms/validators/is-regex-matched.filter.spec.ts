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
 * @fileoverview Tests for Validator to check if input matches the provided
 * regular expression.
 */


describe('isRegexMatched Filter', function() {
  const filterName = 'isRegexMatched';

  beforeEach(angular.mock.module('oppia'));

  it('should exist', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should pass if the string matches the given regular expression',
    angular.mock.inject(function($filter) {
      let filter = $filter(filterName);
      let args = {
        regexPattern: '(^https:\\/\\/.*)|(^(?!.*:\\/\\/)(.*))'
      };
      expect(filter('https://', args)).toBe(true);
      expect(filter('https://jshjakhsak', args)).toBe(true);
      expect(filter('https://www.oppia.com', args)).toBe(true);
      expect(filter('www.oppia.com', args)).toBe(true);
    }));

  it('should fail if the string does not match the given regular expression',
    angular.mock.inject(function($filter) {
      let filter = $filter(filterName);
      let args = {
        regexPattern: '(^https:\\/\\/.*)|(^(?!.*:\\/\\/)(.*))'
      };
      expect(filter('http://', args)).toBe(false);
      expect(filter('abc://www.oppia.com', args)).toBe(false);
    }));
});
