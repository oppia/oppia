// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for AddOrUpdateSolutionModalController.
 */

import { TestBed } from '@angular/core/testing';
import { ExplorationHtmlFormatterService } from
  'services/exploration-html-formatter.service';
import { StateSolutionService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-solution.service';
import { CurrentInteractionService } from
  'pages/exploration-player-page/services/current-interaction.service';
import { SolutionObjectFactory } from
  'domain/exploration/SolutionObjectFactory';
import { StateCustomizationArgsService }
  // eslint-disable-next-line max-len
  from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateInteractionIdService }
  // eslint-disable-next-line max-len
  from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { SubtitledHtml } from
  'domain/exploration/subtitled-html.model';

describe('Add Or Update Solution Modal Controller', function() {
  var $scope = null;
  var $uibModalInstance = null;
  var ContextService = null;
  var currentInteractionService = null;
  var explorationHtmlFormatterService = null;
  var solutionObjectFactory = null;
  var stateCustomizationArgsService = null;
  var stateInteractionIdService = null;
  var stateSolutionService = null;
  var answerEditorHtml = {};

  beforeEach(angular.mock.module('oppia'));
  beforeEach(function() {
    currentInteractionService = TestBed.get(CurrentInteractionService);
    explorationHtmlFormatterService = TestBed.get(
      ExplorationHtmlFormatterService);
    solutionObjectFactory = TestBed.get(SolutionObjectFactory);
    stateCustomizationArgsService = TestBed.get(StateCustomizationArgsService);
    stateInteractionIdService = TestBed.get(StateInteractionIdService);
    stateSolutionService = TestBed.get(StateSolutionService);
  });

  describe('when solution is valid', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');
      ContextService = $injector.get('ContextService');
      spyOn(ContextService, 'getEntityType').and.returnValue('question');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(explorationHtmlFormatterService, 'getInteractionHtml').and
        .returnValue(null);

      answerEditorHtml = {
        answerIsExclusive: true,
        explanation: SubtitledHtml.createDefault(
          'Explanation html', 'cont_1')
      };

      stateSolutionService.init('', answerEditorHtml);

      $scope = $rootScope.$new();
      let ctrl = $controller('AddOrUpdateSolutionModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        CurrentInteractionService: currentInteractionService,
        ExplorationHtmlFormatterService: explorationHtmlFormatterService,
        SolutionObjectFactory: solutionObjectFactory,
        StateCustomizationArgsService: stateCustomizationArgsService,
        StateInteractionIdService: stateInteractionIdService,
        StateSolutionService: stateSolutionService
      });
      ctrl.$onInit();
      currentInteractionService.updateViewWithNewAnswer();
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        stateSolutionService.init('', answerEditorHtml);
        expect($scope.correctAnswerEditorHtml).toBe(null);
        expect($scope.data).toEqual({
          answerIsExclusive: true,
          correctAnswer: null,
          explanationHtml: 'Explanation html',
          explanationContentId: 'cont_1'
        });
        expect($scope.answerIsValid).toBe(false);
      });

    it('should update correct answer when submitting current interaction',
      function() {
        var answer = {};
        currentInteractionService.onSubmit(answer);
        expect($scope.data.correctAnswer).toEqual(answer);
      });

    it('should submit answer when clicking on submit button', function() {
      spyOn(currentInteractionService, 'submitAnswer');
      $scope.onSubmitFromSubmitButton();

      expect(currentInteractionService.submitAnswer).toHaveBeenCalled();
    });

    it('should check if additional submit button should be shown',
      function() {
        stateInteractionIdService.init('', 'TextInput');
        expect($scope.shouldAdditionalSubmitButtonBeShown()).toBe(true);
        stateInteractionIdService.displayed = 'Continue';
        stateInteractionIdService.saveDisplayedValue();
        expect($scope.shouldAdditionalSubmitButtonBeShown()).toBe(false);
      });

    it('should save solution when closing the modal', function() {
      stateSolutionService.init('', answerEditorHtml);
      currentInteractionService.onSubmit('answer');
      $scope.saveSolution();

      expect($uibModalInstance.close).toHaveBeenCalledWith({
        solution: solutionObjectFactory.createNew(
          true, 'answer', 'Explanation html', 'cont_1')
      });
    });

    it('should not show solution explanation length validation error',
      function() {
        var solutionExplanation = 'Explanation html';
        expect($scope.isSolutionExplanationLengthExceeded(solutionExplanation))
          .toBe(false);
      });
  });

  describe('when solution is not valid', function() {
    answerEditorHtml = {};

    beforeEach(angular.mock.inject(function($injector, $controller) {
      var $rootScope = $injector.get('$rootScope');
      ContextService = $injector.get('ContextService');
      spyOn(ContextService, 'getEntityType').and.returnValue('question');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(explorationHtmlFormatterService, 'getInteractionHtml').and
        .returnValue(answerEditorHtml);

      $scope = $rootScope.$new();
      $controller('AddOrUpdateSolutionModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        CurrentInteractionService: currentInteractionService,
        ExplorationHtmlFormatterService: explorationHtmlFormatterService,
        SolutionObjectFactory: solutionObjectFactory,
        StateCustomizationArgsService: stateCustomizationArgsService,
        StateInteractionIdService: stateInteractionIdService,
        StateSolutionService: stateSolutionService
      });
    }));

    it('should not save solution', function() {
      expect(function() {
        $scope.saveSolution();
      }).toThrowError('Cannot save invalid solution');
    });

    it('should check if solution explanation length exceeds 100000 characters',
      function() {
        expect($scope.isSolutionExplanationLengthExceeded('a'.repeat(100000)))
          .toBe(false);
        expect($scope.isSolutionExplanationLengthExceeded('a'.repeat(100001)))
          .toBe(true);
      });
  });
});
