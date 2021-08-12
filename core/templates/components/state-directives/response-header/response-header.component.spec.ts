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

import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

/**
 * @fileoverview Unit tests for Response Header Component.
 */

describe('Response Header Component', () => {
  let ctrl = null;
  let $scope = null;
  let $rootScope = null;

  let StateEditorService = null;
  let StateInteractionIdService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    StateEditorService = $injector.get('StateEditorService');
    StateInteractionIdService = $injector.get('StateInteractionIdService');

    ctrl = $componentController('responseHeader', {
      $scope: $scope
    }, {
      getOutcome: () => {
        return {
          labelledAsCorrect: true,
          dest: '/'
        };
      },
      getOnDeleteFn: () => {
        return () => {};
      },
      getIndex: () => 0
    });
    ctrl.$onInit();
  }));

  it('should check if state is in question mode', () => {
    spyOn(StateEditorService, 'isInQuestionMode').and.returnValue(true);

    expect(ctrl.isInQuestionMode()).toBe(true);
  });

  it('should get current interaction ID', () => {
    StateInteractionIdService.savedMemento = 'TextInteraction';

    expect(ctrl.getCurrentInteractionId()).toBe('TextInteraction');
  });

  it('should check if correctness feedback is enabled', () => {
    spyOn(StateEditorService, 'getCorrectnessFeedbackEnabled').and.returnValue(
      false);

    expect(ctrl.isCorrectnessFeedbackEnabled()).toBe(false);
  });

  it('should check if current interaction is linear or not', () => {
    StateInteractionIdService.savedMemento = 'TextInput';

    expect(ctrl.isCurrentInteractionLinear()).toBe(false);
  });

  it('should check if current response is outcome is correct', () => {
    expect(ctrl.isCorrect()).toBe(true);
  });

  it('should check if outcome is in a loop', () => {
    spyOn(StateEditorService, 'getActiveStateName').and.returnValue('Hola');

    expect(ctrl.isOutcomeLooping()).toBe(false);
  });

  it('should check if a new state is being created', () => {
    expect(ctrl.isCreatingNewState()).toBe(true);
  });

  it('should delete response when user clicks delete button', () => {
    spyOn(ctrl, 'getIndex');
    ctrl.deleteResponse(new Event(''));
    expect(ctrl.getIndex).toHaveBeenCalled();
  });
});
