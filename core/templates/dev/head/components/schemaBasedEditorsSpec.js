// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the schema based editors.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Normalizer tests', function() {
  var filterNames = [
    'requireIsFloat',
    'requireAtLeast',
    'requireAtMost',
    'requireIsOneOf',
    'requireNonempty'
  ];

  beforeEach(module('oppia'));

  it('should have the relevant filters', inject(function($filter) {
    angular.forEach(filterNames, function(filterName) {
      expect($filter(filterName)).not.toEqual(null);
    });
  }));

  it('should validate floats correctly', inject(function($filter) {
    var filter = $filter('requireIsFloat');
    expect(filter('1.23')).toEqual(1.23);
    expect(filter('-1.23')).toEqual(-1.23);
    expect(filter('0')).toEqual(0);
    expect(filter('-1')).toEqual(-1);
    expect(filter('-1.0')).toEqual(-1);
    expect(filter('1,5')).toEqual(1.5);

    expect(filter('1.23a')).toBeUndefined();
    expect(filter('abc')).toBeUndefined();
    expect(filter('2+3')).toBeUndefined();
    expect(filter('--1.23')).toBeUndefined();
    expect(filter('=1.23')).toBeUndefined();
  }));

  it('should impose minimum bounds', inject(function($filter) {
    var filter = $filter('requireAtLeast');
    var args = {minValue: -2.0};
    expect(filter(1.23, args)).toEqual(1.23);
    expect(filter(-1.23, args)).toEqual(-1.23);
    expect(filter(-1.99, args)).toEqual(-1.99);
    expect(filter(-2, args)).toEqual(-2);
    expect(filter(-2.01, args)).toBeUndefined();
    expect(filter(-3, args)).toBeUndefined();
  }));

  it('should impose maximum bounds', inject(function($filter) {
    var filter = $filter('requireAtMost');
    var args = {maxValue: -2.0};
    expect(filter(1.23, args)).toBeUndefined();
    expect(filter(-1.23, args)).toBeUndefined();
    expect(filter(-1.99, args)).toBeUndefined();
    expect(filter(-2, args)).toEqual(-2);
    expect(filter(-2.01, args)).toEqual(-2.01);
    expect(filter(-3, args)).toEqual(-3);
  }));

  it('should validate list containment', inject(function($filter) {
    var filter = $filter('requireIsOneOf');
    var args = {choices: ['abc', 'def']};
    expect(filter('abc', args)).toEqual('abc');
    expect(filter('def', args)).toEqual('def');
    expect(filter('ghi', args)).toBeUndefined();
    expect(filter('abcdef', args)).toBeUndefined();
    expect(filter('abc def', args)).toBeUndefined();
    expect(filter(' ', args)).toBeUndefined();
  }));

  it('should validate non-emptiness', inject(function($filter) {
    var filter = $filter('requireNonempty');
    expect(filter('a')).toEqual('a');
    expect(filter('')).toBeUndefined();
  }));
});
