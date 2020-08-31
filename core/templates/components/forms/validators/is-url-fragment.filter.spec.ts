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
 * @fileoverview Tests for Validator to check if input is a valid URL fragment.
 */


describe('IsUrlFragment Filter', function() {
  var filterName = 'isUrlFragment';
  var args = {
    charLimit: 20
  };

  beforeEach(angular.mock.module('oppia'));

  it('should exist', angular.mock.inject(function($filter) {
    expect($filter(filterName)).not.toEqual(null);
  }));

  it('should validate non-emptiness', angular.mock.inject(function($filter) {
    var filter = $filter(filterName);
    expect(filter('abc', args)).toBe(true);
    expect(filter('', args)).toBe(false);
  }));

  it('should fail when there are caps characters',
    angular.mock.inject(function($filter) {
      var filter = $filter(filterName);
      expect(filter('aBc', args)).toBe(false);
      expect(filter('aaaAAA', args)).toBe(false);
    }));

  it('should fail when there are numeric characters',
    angular.mock.inject(function($filter) {
      var filter = $filter(filterName);
      expect(filter('abc-123', args)).toBe(false);
      expect(filter('h4ck3r', args)).toBe(false);
    }));

  it('should fail when there are special characters other than hyphen',
    angular.mock.inject(function($filter) {
      var filter = $filter(filterName);
      expect(filter('special~chars', args)).toBe(false);
      expect(filter('special`chars', args)).toBe(false);
      expect(filter('special!chars', args)).toBe(false);
      expect(filter('special@chars', args)).toBe(false);
      expect(filter('special#chars', args)).toBe(false);
      expect(filter('special$chars', args)).toBe(false);
      expect(filter('special%chars', args)).toBe(false);
      expect(filter('special^chars', args)).toBe(false);
      expect(filter('special&chars', args)).toBe(false);
      expect(filter('special*chars', args)).toBe(false);
      expect(filter('special(chars', args)).toBe(false);
      expect(filter('special)chars', args)).toBe(false);
      expect(filter('special_chars', args)).toBe(false);
      expect(filter('special+chars', args)).toBe(false);
      expect(filter('special=chars', args)).toBe(false);
      expect(filter('special{chars', args)).toBe(false);
      expect(filter('special}chars', args)).toBe(false);
      expect(filter('special[chars', args)).toBe(false);
      expect(filter('special]chars', args)).toBe(false);
      expect(filter('special:chars', args)).toBe(false);
      expect(filter('special;chars', args)).toBe(false);
      expect(filter('special"chars', args)).toBe(false);
      expect(filter('special\'chars', args)).toBe(false);
      expect(filter('special|chars', args)).toBe(false);
      expect(filter('special<chars', args)).toBe(false);
      expect(filter('special,chars', args)).toBe(false);
      expect(filter('special>chars', args)).toBe(false);
      expect(filter('special.chars', args)).toBe(false);
      expect(filter('special?chars', args)).toBe(false);
      expect(filter('special/chars', args)).toBe(false);
      expect(filter('special\\chars', args)).toBe(false);
    }));

  it('should fail when there are spaces',
    angular.mock.inject(function($filter) {
      var filter = $filter(filterName);
      expect(filter('url with spaces', args)).toBe(false);
      expect(filter(' trailing space ', args)).toBe(false);
    }));

  it('should fail when the length of the input is greater than the char limit',
    angular.mock.inject(function($filter) {
      var filter = $filter(filterName);
      expect(filter('a-lengthy-url-fragment', args)).toBe(false);
    }));

  it('should pass when the passed value is a valid url fragment',
    angular.mock.inject(function($filter) {
      var filter = $filter(filterName);
      expect(filter('math', args)).toBe(true);
      expect(filter('computer-science', args)).toBe(true);
    }));
});
