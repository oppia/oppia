// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for Solution Explanation Editor Component.
 */

import { EventEmitter } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('SolutionExplanationEditorComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;

  let EditabilityService = null;
  let ExternalSaveService = null;
  let StateSolutionService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    EditabilityService = $injector.get('EditabilityService');
    ExternalSaveService = $injector.get('ExternalSaveService');
    StateSolutionService = $injector.get('StateSolutionService');

    ctrl = $componentController('solutionExplanationEditor', {
      $scope: $scope
    }, {
      showMarkAllAudioAsNeedingUpdateModalIfRequired: () => {},
      onSaveSolution: () => {}
    });
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should set component properties on initialization', () => {
    spyOn(EditabilityService, 'isEditable').and.returnValue(true);

    expect(ctrl.editSolutionForm).toEqual(undefined);
    expect(ctrl.isEditable).toBe(undefined);
    expect(ctrl.explanationEditorIsOpen).toBe(undefined);

    ctrl.$onInit();

    expect(ctrl.editSolutionForm).toEqual({});
    expect(ctrl.isEditable).toBe(true);
    expect(ctrl.explanationEditorIsOpen).toBe(false);
  });

  it('should save explanation when external save event is triggered', () => {
    let onExternalSaveEmitter = new EventEmitter();
    spyOnProperty(ExternalSaveService, 'onExternalSave')
      .and.returnValue(onExternalSaveEmitter);
    spyOn(ctrl, 'showMarkAllAudioAsNeedingUpdateModalIfRequired');

    ctrl.$onInit();

    ctrl.explanationEditorIsOpen = true;
    ctrl.editSolutionForm = {
      $valid: true
    };
    StateSolutionService.savedMemento = {
      explanation: {
        html: '<p> Hint </p>'
      }
    };
    StateSolutionService.displayed = {
      explanation: {
        contentId: 'contentID',
        html: '<p> Hint Changed </p>'
      }
    };

    onExternalSaveEmitter.emit();
    $scope.$apply();

    expect(ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired)
      .toHaveBeenCalledWith(['contentID']);
    expect(ctrl.explanationEditorIsOpen).toBe(false);
  });

  it('should open explanation editor when user clicks on \'Edit hint\'', () => {
    ctrl.isEditable = true;
    ctrl.explanationEditorIsOpen = false;

    ctrl.openExplanationEditor();

    expect(ctrl.explanationEditorIsOpen).toBe(true);
  });

  it('should cancel hint edit if user clicks on \'Cancel\'', () => {
    ctrl.explanationEditorIsOpen = true;

    ctrl.cancelThisExplanationEdit();

    expect(ctrl.explanationEditorIsOpen).toBe(false);
  });

  it('should check if solution explanation length exceeds 100000 characters',
    () => {
      StateSolutionService.displayed = {
        explanation: {
          contentId: 'contentID',
          html: 'a'.repeat(100000)
        }
      };
      expect(ctrl.isSolutionExplanationLengthExceeded()).toBe(false);

      StateSolutionService.displayed = {
        explanation: {
          contentId: 'contentID',
          html: 'a'.repeat(100001)
        }
      };
      expect(ctrl.isSolutionExplanationLengthExceeded()).toBe(true);
    });
});
