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
 * @fileoverview Unit tests for custom filters.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Testing filters', function() {
  var filterNames = [
    'spacesToUnderscores',
    'truncate',
    'round1',
    'bracesToText',
    'parameterizeRuleDescription'
  ];

  beforeEach(angular.mock.module('oppia'));

  it('should have the relevant filters', inject(function($filter) {
    angular.forEach(filterNames, function(filterName) {
      expect($filter(filterName)).not.toEqual(null);
    });
  }));

  it('should convert spaces to underscores properly', inject(function($filter) {
    var filter = $filter('spacesToUnderscores');
    expect(filter('Test')).toEqual('Test');
    expect(filter('Test App')).toEqual('Test_App');
    expect(filter('Test App Two')).toEqual('Test_App_Two');
    expect(filter('Test  App')).toEqual('Test__App');
    expect(filter('  Test  App ')).toEqual('Test__App');
  }));

  it('should round numbers to 1 decimal place', inject(function($filter) {
    var filter = $filter('round1');
    expect(filter(1)).toEqual(1.0);
    expect(filter(1.5)).toEqual(1.5);
    expect(filter(1.53)).toEqual(1.5);
    expect(filter(1.55)).toEqual(1.6);
  }));

  it('should convert {{...}} tags to INPUT indicators', inject(function($filter) {
    var filter = $filter('bracesToText');

    expect(filter('')).toEqual('');
    expect(filter(null)).toEqual('');
    expect(filter(undefined)).toEqual('');

    expect(filter('hello')).toEqual('hello');
    expect(filter('{{hello}}')).toEqual('<code>INPUT</code>');
    expect(filter('{{hello}} and {{goodbye}}')).toEqual(
      '<code>INPUT</code> and <code>INPUT</code>');
    expect(filter('{{}}{{hello}}')).toEqual(
      '{{}}<code>INPUT</code>');
  }));

  it('should convert a list to a comma-separated string', inject(function($filter) {
    var filter = $filter('commaSeparatedList');

    expect(filter('a')).toEqual('ERROR');
    expect(filter(null)).toEqual('ERROR');
    expect(filter(undefined)).toEqual('ERROR');

    expect(filter([])).toEqual('');
    expect(filter(['a'])).toEqual('a');
    expect(filter(['a', 'b'])).toEqual('a, b');
    expect(filter(['a', 'b', 'c'])).toEqual('a, b, c');
  }));
});
