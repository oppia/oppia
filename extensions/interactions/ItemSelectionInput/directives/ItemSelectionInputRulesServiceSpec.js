// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Item Selection rules.
 */

describe('Item Selection rules service', function() {
  beforeEach(module('oppia'));

  var isirs = null;
  beforeEach(inject(function($injector) {
    isirs = $injector.get('ItemSelectionInputRulesService');
  }));

  it('should have a correct \'equals\' rule', function() {
    var RULE_INPUT = {
      x: ['ab', 'c', 'e']
    };
    expect(isirs.Equals(['ab', 'c', 'e'], RULE_INPUT)).toBe(true);
    expect(isirs.Equals(['ab', 'c', 'c', 'e'], RULE_INPUT)).toBe(true);
    expect(isirs.Equals(['c', 'e', 'ab'], RULE_INPUT)).toBe(true);
    expect(isirs.Equals(['c'], RULE_INPUT)).toBe(false);
    expect(isirs.Equals(['e'], RULE_INPUT)).toBe(false);
    expect(isirs.Equals(['a'], RULE_INPUT)).toBe(false);
    expect(isirs.Equals(['ab', '10'], RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'contains at least one of\' rule', function() {
    var RULE_INPUT = {
      x: ['a']
    };
    expect(isirs.ContainsAtLeastOneOf(['a', 'b'], RULE_INPUT)).toBe(true);
    expect(isirs.ContainsAtLeastOneOf([' ', 'a'], RULE_INPUT)).toBe(true);
    expect(isirs.ContainsAtLeastOneOf(['a'], RULE_INPUT)).toBe(true);
    expect(isirs.ContainsAtLeastOneOf(['c'], RULE_INPUT)).toBe(false);
    expect(isirs.ContainsAtLeastOneOf([], RULE_INPUT)).toBe(false);

    RULE_INPUT = {
      x: ['a', 'b']
    };
    expect(isirs.ContainsAtLeastOneOf(['a', 'b', '10'], RULE_INPUT)).toBe(true);
    expect(isirs.ContainsAtLeastOneOf(['a', '10'], RULE_INPUT)).toBe(true);
    expect(isirs.ContainsAtLeastOneOf(['a'], RULE_INPUT)).toBe(true);
    expect(isirs.ContainsAtLeastOneOf(['10'], RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'does not contain at least one of\' rule',
    function() {
      var RULE_INPUT = {
        x: ['a', 'b', 'c']
      };
      expect(isirs.DoesNotContainAtLeastOneOf(['d'], RULE_INPUT)).toBe(true);
      expect(isirs.DoesNotContainAtLeastOneOf([], RULE_INPUT)).toBe(true);
      expect(
        isirs.DoesNotContainAtLeastOneOf(['a', 'b'], RULE_INPUT)).toBe(true);
      expect(isirs.DoesNotContainAtLeastOneOf(['a'], RULE_INPUT)).toBe(true);
      expect(isirs.DoesNotContainAtLeastOneOf(
        ['a', 'b', 'c'], RULE_INPUT)).toBe(false);
      expect(isirs.DoesNotContainAtLeastOneOf(
        ['a', 'b', 'c', 'd'], RULE_INPUT)).toBe(false);
    }
  );
  it('should have a correct \'is a proper subset of\' rule',
    function() {
      var RULE_INPUT = {
        x: ['a', 'b', 'c']
      };
      expect(isirs.IsProperSubsetOf([], RULE_INPUT)).toBe(true);
      expect(isirs.IsProperSubsetOf(['a'], RULE_INPUT)).toBe(true);
      expect(isirs.IsProperSubsetOf(['a', 'b'], RULE_INPUT)).toBe(true);
      expect(isirs.IsProperSubsetOf(['a', 'b', 'c'], RULE_INPUT)).toBe(false);
      expect(isirs.IsProperSubsetOf(['d', 'e'], RULE_INPUT)).toBe(false);
      expect(isirs.IsProperSubsetOf(
        ['a', 'b', 'c', 'd'], RULE_INPUT)).toBe(false);
      expect(isirs.IsProperSubsetOf(
        ['b', 'c', 'd', 'e'], RULE_INPUT)).toBe(false);
    }
  );
});
