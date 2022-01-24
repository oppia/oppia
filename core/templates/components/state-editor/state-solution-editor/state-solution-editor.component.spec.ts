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
 * @fileoverview Unit test for State Solution Editor Component.
 */

import { TestBed } from '@angular/core/testing';
import { SolutionObjectFactory } from 'domain/exploration/SolutionObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

describe('StateSolutionEditorComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;
  let $uibModal = null;
  let $q = null;
  let sof: SolutionObjectFactory;
  let solution;
  let ngbModal: NgbModal = null;

  let ExplorationHtmlFormatterService = null;
  let WindowDimensionsService = null;
  let StateEditorService = null;
  let StateSolutionService = null;
  let StateInteractionIdService = null;
  let SolutionValidityService = null;
  let AlertsService = null;
  let SolutionVerificationService = null;

  let answerEditorHtml = {
    answerIsExclusive: true,
    explanation: SubtitledHtml.createDefault(
      'Explanation html', 'cont_1')
  };

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $uibModal = $injector.get('$uibModal');
    $q = $injector.get('$q');
    ngbModal = $injector.get('NgbModal');

    ExplorationHtmlFormatterService = $injector.get(
      'ExplorationHtmlFormatterService');
    WindowDimensionsService = $injector.get('WindowDimensionsService');
    StateEditorService = $injector.get('StateEditorService');
    StateSolutionService = $injector.get('StateSolutionService');
    StateInteractionIdService = $injector.get('StateInteractionIdService');
    SolutionValidityService = $injector.get('SolutionValidityService');
    AlertsService = $injector.get('AlertsService');
    SolutionVerificationService = $injector.get('SolutionVerificationService');
    sof = TestBed.get(SolutionObjectFactory);

    ctrl = $componentController('stateSolutionEditor', {
      $scope: $scope
    }, {
      refreshWarnings: () => {
        return () => {};
      },
      onSaveSolution: () => {},
      showMarkAllAudioAsNeedingUpdateModalIfRequired: () => {}
    });

    solution = sof.createFromBackendDict({
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        content_id: 'solution',
        html: 'This is the explanation to the answer'
      }
    });

    spyOn(ExplorationHtmlFormatterService, 'getInteractionHtml')
      .and.returnValue(answerEditorHtml);
    spyOn(WindowDimensionsService, 'isWindowNarrow').and.returnValue(false);
  }));

  it('should set component properties on initialization', () => {
    ctrl.$onInit();

    expect($scope.solutionCardIsShown).toBe(true);
    expect($scope.correctAnswer).toBe(null);
    expect($scope.inlineSolutionEditorIsActive).toBe(false);
    expect($scope.SOLUTION_EDITOR_FOCUS_LABEL).toBe(
      'currentCorrectAnswerEditorHtmlForSolutionEditor');
    expect($scope.correctAnswerEditorHtml).toEqual(answerEditorHtml);
  });

  it('should toggle solution card visibility', () => {
    $scope.solutionCardIsShown = true;

    $scope.toggleSolutionCard();

    expect($scope.solutionCardIsShown).toBe(false);

    $scope.toggleSolutionCard();

    expect($scope.solutionCardIsShown).toBe(true);
  });

  it('should open delete solution modal when user clicks on delete', () => {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: $q.resolve()
      } as NgbModalRef
    );
    spyOn(StateEditorService, 'deleteCurrentSolutionValidity');
    spyOn(StateSolutionService, 'saveDisplayedValue');

    const value = {
      index: 0,
      evt: new Event('')
    };

    $scope.deleteSolution(value);
    $scope.$apply();

    expect(StateEditorService.deleteCurrentSolutionValidity).toHaveBeenCalled();
    expect(StateSolutionService.saveDisplayedValue).toHaveBeenCalled();
  });

  it('should close delete solution modal when user clicks cancel', () => {
    spyOn(ngbModal, 'open').and.returnValue(
      {
        result: $q.reject()
      } as NgbModalRef
    );

    const value = {
      index: 0,
      evt: new Event('')
    };

    $scope.deleteSolution(value);
    $scope.$apply();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should get invalid solution tooltip text', () => {
    spyOn(StateEditorService, 'isInQuestionMode').and.returnValues(true, false);

    // When in question mode.
    expect($scope.getInvalidSolutionTooltip()).toBe(
      'This solution doesn\'t correspond to an answer ' +
      'marked as correct. Verify the rules specified for the ' +
      'answers or change the solution.'
    );

    // When not in question mode.
    expect($scope.getInvalidSolutionTooltip()).toBe(
      'This solution does not lead to another card. Verify the ' +
      'responses specified or change the solution.'
    );
  });

  it('should check if current solution is valid or not', () => {
    spyOn(StateEditorService, 'isCurrentSolutionValid').and.returnValue(true);

    expect($scope.isSolutionValid()).toBe(true);
  });

  it('should toggle activity of inline solution editor', () => {
    $scope.inlineSolutionEditorIsActive = true;

    $scope.toggleInlineSolutionEditorIsActive();

    expect($scope.inlineSolutionEditorIsActive).toBe(false);

    $scope.toggleInlineSolutionEditorIsActive();

    expect($scope.inlineSolutionEditorIsActive).toBe(true);
  });

  it('should get summary of solution', () => {
    StateSolutionService.savedMemento = solution;

    expect($scope.getSolutionSummary()).toBe(
      'One solution is "This is a correct answer!".' +
      ' This is the explanation to the answer.');
  });

  it('should check if current interaction is linear or not', () => {
    StateInteractionIdService.savedMemento = 'TextInput';

    expect($scope.isCurrentInteractionLinear()).toBe(false);
  });

  it('should open add or update solution modal when user clicks on' +
    ' \'+ ADD SOLUTION\'', () => {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.resolve({
        solution: solution
      })
    });
    spyOn(SolutionVerificationService, 'verifySolution').and.returnValue(false);
    spyOn(SolutionValidityService, 'updateValidity').and.stub();
    spyOn(StateEditorService, 'isInQuestionMode').and.returnValues(true, false);
    spyOn(AlertsService, 'addInfoMessage');

    // In question mode.
    $scope.openAddOrUpdateSolutionModal();
    $scope.$apply();

    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'The current solution does not correspond to a correct answer.', 4000
    );

    // Not in question mode.
    $scope.openAddOrUpdateSolutionModal();
    $scope.$apply();

    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'The current solution does not lead to another card.', 4000
    );
  });

  it('should close add or update solution modal if user clicks cancel', () => {
    spyOn($uibModal, 'open').and.returnValue({
      result: $q.reject()
    });

    $scope.openAddOrUpdateSolutionModal();
    $scope.$apply();

    expect($uibModal.open).toHaveBeenCalled();
  });

  it('should save solution and open showMarkAllAudioAsNeedingUpdateModal' +
    ' when user click', () => {
    spyOn(ctrl, 'showMarkAllAudioAsNeedingUpdateModalIfRequired').and
      .callThrough();
    spyOn(ctrl, 'onSaveSolution').and.callThrough();

    $scope.openMarkAllAudioAsNeedingUpdateModalIfRequired('oppia');
    $scope.saveSolution('saveSolution');

    expect(ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired)
      .toHaveBeenCalledWith('oppia');
    expect(ctrl.onSaveSolution).toHaveBeenCalledWith('saveSolution');
  });
});
