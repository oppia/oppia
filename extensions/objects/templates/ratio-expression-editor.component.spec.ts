// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the ratio expression component.
 */

import { RatioObjectFactory } from 'domain/objects/RatioObjectFactory';


describe('RatioExpression', function() {
  var RationExpressionCtrl = null;
  var ratioObjectFactory = null;
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    ratioObjectFactory = new RatioObjectFactory();
    $provide.value('RatioObjectFactory', ratioObjectFactory);
  }));
  beforeEach(angular.mock.inject(function($componentController) {
    RationExpressionCtrl = $componentController('ratioExpressionEditor');
  }));

  it('should initialize ctrl.value with an default value', function() {
    RationExpressionCtrl.value = null;
    RationExpressionCtrl.$onInit();
    expect(RationExpressionCtrl.value).not.toBeNull();
  });

  it('should initialize ctrl.warningText with non-integer ratio', function() {
    RationExpressionCtrl.isValidRatio('1:1:2.3');
    expect(RationExpressionCtrl.warningText)
      .toBe(
        'For this question, each element in your ratio should be a ' +
        'whole number (not a fraction or a decimal).');
  });

  it('should initialize ctrl.warningText with invalid ratio', function() {
    RationExpressionCtrl.isValidRatio('1:2:3:');
    expect(RationExpressionCtrl.warningText)
      .toBe('Please enter a valid ratio (e.g. 1:2 or 1:2:3).');
  });

  it('should initialize ctrl.warningText with invalid character', function() {
    RationExpressionCtrl.isValidRatio('abc');
    expect(RationExpressionCtrl.warningText)
      .toBe(
        'Please write a ratio that consists of digits separated by colons' +
        '(e.g. 1:2 or 1:2:3).');
  });

  it('should initialize ctrl.warningText with empty ratio', function() {
    RationExpressionCtrl.isValidRatio('');
    expect(RationExpressionCtrl.warningText)
      .toBe('Please enter a valid ratio (e.g. 1:2 or 1:2:3).');
  });

  it('should initialize ctrl.warningText with invalid colons', function() {
    RationExpressionCtrl.isValidRatio('1:2::3');
    expect(RationExpressionCtrl.warningText)
      .toBe('Your answer has two colons (:) next to each other.');
  });

  it('should initialize ctrl.warningText with invalid zero ratio', function() {
    RationExpressionCtrl.isValidRatio('1:0');
    expect(RationExpressionCtrl.warningText)
      .toBe('Ratios cannot have 0 as a element.');
  });

  it('should return true with a valid value of ratio', function() {
    expect(RationExpressionCtrl.isValidRatio('1:2:3')).toBe(true);
  });
});
