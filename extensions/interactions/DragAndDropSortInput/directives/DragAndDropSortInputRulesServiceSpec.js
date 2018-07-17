// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Drag and Drop Sorting rules.
 */

describe('Drag and Drop Sort Input rules service', function() {
  beforeEach(module('oppia'));

  var ddsrs = null;
  beforeEach(inject(function($injector) {
    ddsrs = $injector.get('dragAndDropSortInputRulesService');
  }));

  it('should have a correct \'is equal to ordering\' rule', function() {
    var RULE_INPUT = {
      x: [['a', 'b'], ['c'], ['de', 'f']]
    };
    expect(ddsrs.IsEqualToOrdering(
      [['a', 'b'], ['c'], ['de', 'f']], RULE_INPUT)).toBe(true);
    expect(ddsrs.IsEqualToOrdering(
      [['b', 'a'], ['c'], ['de', 'f']], RULE_INPUT)).toBe(true);
    expect(ddsrs.IsEqualToOrdering(
      [['abbb', 'b'], ['c'], ['d', 'f']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrdering(
      [['a', 'b'], ['c', 'f'], ['de']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrdering(
      [['a', 'b', 'g'], ['c'], ['de', 'f']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrdering(
      [['c'], ['a', 'b'], ['de', 'f']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrdering(
      [['a', 'b'], ['c']], RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'is equal to ordering with one item at incorrect' +
    ' position\' rule', function() {
    var RULE_INPUT = {
      x: [['a', 'b'], ['c'], ['de', 'f']]
    };
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [['a', 'b'], ['c'], ['de', 'f']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [['b', 'a'], ['c'], ['de', 'f']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [['a', 'b'], ['c', 'f']], RULE_INPUT)).toBe(true);
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [['a', 'b', 'c'], ['de', 'f']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [['a'], ['c'], ['de', 'f']], RULE_INPUT)).toBe(true);
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [['a', 'b', 'de'], ['c'], ['d', 'f']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [['a', 'b'], ['c', 'de', 'f']], RULE_INPUT)).toBe(false);
  });
});
