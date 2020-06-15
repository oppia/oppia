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
 * @fileoverview Unit tests for the algebraic expression editor.
 */

describe('AlgebraicExpressionEditor', function() {
  var AlgebraicExpressionEditorCtrl = null;
  class MockGuppy {
    constructor(id: string, config: Object) {}

    event(name: string, handler: Function): void {
      handler();
    }
    asciimath() {
      return 'Dummy value';
    }
    render(): void {}
  }

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($componentController) {
    AlgebraicExpressionEditorCtrl = $componentController(
      'algebraicExpressionEditor');
    (<any>window).Guppy = MockGuppy;
  }));

  it('should assign a random id to the guppy divs', function() {
    var mockDocument = document.createElement('div');
    mockDocument.setAttribute('class', 'guppy-div-creator');
    angular.element(document).find('body').append(mockDocument.outerHTML);

    AlgebraicExpressionEditorCtrl.$onInit();

    var guppyDivs = document.querySelectorAll('.guppy-div-creator');
    for(var i = 0; i < guppyDivs.length; i++) {
      expect(guppyDivs[i].getAttribute('id')).toMatch(/guppy_[0-9]{1,8}/);
    }
  });

  it('should initialize ctrl.value with an empty string', function() {
    AlgebraicExpressionEditorCtrl.value = null;
    AlgebraicExpressionEditorCtrl.$onInit();
    expect(AlgebraicExpressionEditorCtrl.value).not.toBeNull();
  });

  it('should correctly validate current answer', function() {
    
    // This should be validated as true if the editor hasn't been touched.
    AlgebraicExpressionEditorCtrl.value = '';
    expect(AlgebraicExpressionEditorCtrl.isCurrentAnswerValid()).toBeTrue();
    expect(AlgebraicExpressionEditorCtrl.warningText).toBe('');


    AlgebraicExpressionEditorCtrl.hasBeenTouched = true;

    AlgebraicExpressionEditorCtrl.value = '';
    expect(AlgebraicExpressionEditorCtrl.isCurrentAnswerValid()).toBeFalse();
    expect(AlgebraicExpressionEditorCtrl.warningText).toBe(
      'Please enter a non-empty answer.');

    AlgebraicExpressionEditorCtrl.value = 'a/';
    expect(AlgebraicExpressionEditorCtrl.isCurrentAnswerValid()).toBeFalse();
    expect(AlgebraicExpressionEditorCtrl.warningText).toBe(
      '/ is not a valid postfix operator.');

    AlgebraicExpressionEditorCtrl.value = '12+sqrt(4)';
    expect(AlgebraicExpressionEditorCtrl.isCurrentAnswerValid()).toBeFalse();
    expect(AlgebraicExpressionEditorCtrl.warningText).toBe(
      'It looks like you have entered only numbers. Make sure to include' +
      ' the necessary variables mentioned in the question.');

    AlgebraicExpressionEditorCtrl.value = 'x-y=0';
    expect(AlgebraicExpressionEditorCtrl.isCurrentAnswerValid()).toBeFalse();
    expect(AlgebraicExpressionEditorCtrl.warningText).toBe(
      'It looks like you have entered an equation/inequality.' +
      ' Please enter an algebraic expression instead.');
  })
});
