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
import { DragAndDropSortInputRulesService } from 'interactions/DragAndDropSortInput/directives/drag-and-drop-sort-input-rules.service';

describe('Drag and Drop Sort Input rules service', () => {
  let ddsrs: DragAndDropSortInputRulesService;
  beforeEach(() => {
    ddsrs = new DragAndDropSortInputRulesService();
  });

  it('should have a correct \'is equal to ordering\' rule', () => {
    var RULE_INPUT: {x: string[][]} = {
      x: [
        ['rule_input_1', 'rule_input_2'],
        ['rule_input_3'],
        ['rule_input_4', 'rule_input_6']
      ]
    };
    expect(ddsrs.IsEqualToOrdering(
      [
        ['rule_input_1', 'rule_input_2'],
        ['rule_input_3'],
        ['rule_input_4', 'rule_input_6']
      ], RULE_INPUT)).toBe(true);
    expect(ddsrs.IsEqualToOrdering(
      [
        ['rule_input_2', 'rule_input_1'],
        ['rule_input_3'],
        ['rule_input_4', 'rule_input_6']], RULE_INPUT)).toBe(true);
    expect(ddsrs.IsEqualToOrdering(
      [
        ['abbb', 'rule_input_2'],
        ['rule_input_3'],
        ['rule_input_5', 'rule_input_6']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrdering(
      [
        ['rule_input_1', 'rule_input_2'],
        ['rule_input_3', 'rule_input_6'],
        ['rule_input_4']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrdering(
      [
        ['rule_input_1', 'rule_input_2', 'g'],
        ['rule_input_3'],
        ['rule_input_4', 'rule_input_6']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrdering(
      [
        ['rule_input_3'],
        ['rule_input_1', 'rule_input_2'],
        ['rule_input_4', 'rule_input_6']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrdering(
      [
        ['rule_input_1', 'rule_input_2'],
        ['rule_input_3']], RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'is equal to ordering with one item at incorrect' +
    ' position\' rule', () => {
    var RULE_INPUT: {x: string[][]} = {
      x: [
        ['rule_input_1', 'rule_input_2'],
        ['rule_input_3'],
        ['rule_input_4', 'rule_input_6']]
    };
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [
        ['rule_input_1', 'rule_input_2'],
        ['rule_input_3'],
        ['rule_input_4', 'rule_input_6']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [
        ['rule_input_2', 'rule_input_1'],
        ['rule_input_3'],
        ['rule_input_4', 'rule_input_6']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [
        ['rule_input_1', 'rule_input_2'],
        ['rule_input_3', 'rule_input_6']], RULE_INPUT)).toBe(true);
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [
        ['rule_input_1', 'rule_input_2', 'rule_input_3'],
        ['rule_input_4', 'rule_input_6']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [
        ['rule_input_1'],
        ['rule_input_3'],
        ['rule_input_4', 'rule_input_6']], RULE_INPUT)).toBe(true);
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [
        ['rule_input_1', 'rule_input_2', 'rule_input_4'],
        ['rule_input_3'],
        ['rule_input_5', 'rule_input_6']], RULE_INPUT)).toBe(false);
    expect(ddsrs.IsEqualToOrderingWithOneItemAtIncorrectPosition(
      [
        ['rule_input_1', 'rule_input_2'],
        ['rule_input_3', 'rule_input_4', 'rule_input_6']
      ], RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'has element X at position Y\' rule', () => {
    var RULE_INPUT: { x: string; y: number } = {
      x: 'rule_input_2',
      y: 2
    };
    expect(ddsrs.HasElementXAtPositionY(
      [
        ['rule_input_1'],
        ['rule_input_2', 'rule_input_3']], RULE_INPUT)).toBe(true);
    expect(ddsrs.HasElementXAtPositionY(
      [
        ['rule_input_1', 'rule_input_2'],
        ['rule_input_3']], RULE_INPUT)).toBe(false);
    expect(ddsrs.HasElementXAtPositionY(
      [
        ['rule_input_1'],
        ['rule_input_2']], RULE_INPUT)).toBe(true);
    expect(ddsrs.HasElementXAtPositionY(
      [
        ['rule_input_1'],
        ['rule_input_5'],
        ['rule_input_2', 'rule_input_3']], RULE_INPUT)).toBe(false);
    expect(
      ddsrs.HasElementXAtPositionY([], RULE_INPUT)
    ).toBe(false);
  });

  it('should have a correct \'has element X before element Y\' rule',
    () => {
      var RULE_INPUT: { x: string; y: string } = {
        x: 'rule_input_2',
        y: 'rule_input_5'
      };
      expect(ddsrs.HasElementXBeforeElementY(
        [
          ['rule_input_1', 'rule_input_2'],
          ['rule_input_3', 'rule_input_5']], RULE_INPUT)).toBe(true);
      expect(ddsrs.HasElementXBeforeElementY(
        [
          ['rule_input_1', 'rule_input_5'],
          ['rule_input_3', 'rule_input_2']], RULE_INPUT)).toBe(false);
      expect(ddsrs.HasElementXBeforeElementY(
        [
          ['rule_input_1'], ['rule_input_2'],
          ['rule_input_3', 'rule_input_5']], RULE_INPUT)).toBe(true);
      expect(ddsrs.HasElementXBeforeElementY(
        [
          ['rule_input_5', 'rule_input_2'],
          ['rule_input_3', 'rule_input_1']], RULE_INPUT)).toBe(false);
    });
});
