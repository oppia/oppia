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
    'underscoresToCamelCase',
    'camelCaseToHyphens',
    'truncate',
    'truncateAtFirstLine',
    'round1',
    'replaceInputsWithEllipses',
    'truncateAtFirstEllipsis',
    'wrapTextWithEllipsis',
    'isOutcomeConfusing',
    'parameterizeRuleDescription',
    'normalizeWhitespace',
    'convertToPlainText',
    'summarizeAnswerGroup',
    'summarizeDefaultOutcome',
  ];

  beforeEach(angular.mock.module('oppia'));

  it('should have all expected filters', inject(function($filter) {
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

  it('should convert underscores to camelCase properly',
      inject(function($filter) {
    var filter = $filter('underscoresToCamelCase');
    expect(filter('Test')).toEqual('Test');
    expect(filter('test')).toEqual('test');
    expect(filter('test_app')).toEqual('testApp');
    expect(filter('Test_App_Two')).toEqual('TestAppTwo');
    expect(filter('test_App_Two')).toEqual('testAppTwo');
    expect(filter('test_app_two')).toEqual('testAppTwo');
    expect(filter('test__App')).toEqual('testApp');
    // Trailing underscores at the beginning and end should never happen --
    // they will give weird results.
    expect(filter('_test_App')).toEqual('TestApp');
    expect(filter('__Test_ App_')).toEqual('Test App_');
  }));

  it('should convert camelCase to hyphens properly', inject(function($filter) {
    var filter = $filter('camelCaseToHyphens');
    expect(filter('test')).toEqual('test');
    expect(filter('testTest')).toEqual('test-test');
    expect(filter('testTestTest')).toEqual('test-test-test');
    expect(filter('aBaBCa')).toEqual('a-ba-b-ca');
    expect(filter('AbcDefGhi')).toEqual('abc-def-ghi');
  }));

  it('should round numbers to 1 decimal place', inject(function($filter) {
    var filter = $filter('round1');
    expect(filter(1)).toEqual(1.0);
    expect(filter(1.5)).toEqual(1.5);
    expect(filter(1.53)).toEqual(1.5);
    expect(filter(1.55)).toEqual(1.6);
  }));

  it('should convert {{...}} tags to ...', inject(function($filter) {
    var filter = $filter('replaceInputsWithEllipses');

    expect(filter('')).toEqual('');
    expect(filter(null)).toEqual('');
    expect(filter(undefined)).toEqual('');

    expect(filter('hello')).toEqual('hello');
    expect(filter('{{hello}}')).toEqual('...');
    expect(filter('{{hello}} and {{goodbye}}')).toEqual('... and ...');
    expect(filter('{{}}{{hello}}')).toEqual('{{}}...');
  }));

  it('should truncate a string when it first sees a \'...\'',
      inject(function($filter) {
    var filter = $filter('truncateAtFirstEllipsis');

    expect(filter('')).toEqual('');
    expect(filter(null)).toEqual('');
    expect(filter(undefined)).toEqual('');

    expect(filter('hello')).toEqual('hello');
    expect(filter('...')).toEqual('');
    expect(filter('say ... and ...')).toEqual('say ');
    expect(filter('... and ...')).toEqual('');
    expect(filter('{{}}...')).toEqual('{{}}');
  }));

  it('should wrap text with ellipses based on its length',
      inject(function($filter) {
    var filter = $filter('wrapTextWithEllipsis');

    expect(filter('', 0)).toEqual('');
    expect(filter(null, 0)).toEqual(null);
    expect(filter(undefined, 0)).toEqual(undefined);

    expect(filter('testing', 0)).toEqual('testing');
    expect(filter('testing', 1)).toEqual('testing');
    expect(filter('testing', 2)).toEqual('testing');
    expect(filter('testing', 3)).toEqual('...');
    expect(filter('testing', 4)).toEqual('t...');
    expect(filter('testing', 7)).toEqual('testing');
    expect(filter('Long sentence which goes on and on.', 80)).toEqual(
      'Long sentence which goes on and on.');
    expect(filter('Long sentence which goes on and on.', 20)).toEqual(
      'Long sentence whi...');
    expect(filter('Sentence     with     long     spacing.', 20)).toEqual(
      'Sentence with lon...');
    expect(filter('With space before ellipsis.', 21)).toEqual(
      'With space before...');
  }));

  it('should correctly normalize whitespace', inject(function($filter) {
    var filter = $filter('normalizeWhitespace');

    expect(filter('')).toEqual('');
    expect(filter(null)).toEqual(null);
    expect(filter(undefined)).toEqual(undefined);

    expect(filter('a')).toEqual('a');
    expect(filter('a  ')).toEqual('a');
    expect(filter('  a')).toEqual('a');
    expect(filter('  a  ')).toEqual('a');

    expect(filter('a  b ')).toEqual('a b');
    expect(filter('  a  b ')).toEqual('a b');
    expect(filter('  ab c ')).toEqual('ab c');
  }));

  it('should truncate multi-line text to the first non-empty line',
      inject(function($filter) {
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

    // TODO(bhenning): There could be some merit in also testing cross-platform
    // line endings (since the pattern in filter applies to them). Only one is
    // tested here.
    expect(filter('Single line\r\nWindows EOL')).toEqual('Single line...');
  }));
});
