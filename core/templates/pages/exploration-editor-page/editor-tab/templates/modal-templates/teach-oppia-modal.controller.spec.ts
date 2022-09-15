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
 * @fileoverview Unit tests for TeachOppiaModalController.
 */

import { EventEmitter } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StateCustomizationArgsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-solution.service';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { TrainingDataService } from '../../training-panel/training-data.service';
import { TrainingModalService } from '../../training-panel/training-modal.service';
import { ExplorationPlayerConstants } from 'pages/exploration-player-page/exploration-player-page.constants';

describe('Teach Oppia Modal Controller', function() {
  importAllAngularServices();

  var $httpBackend = null;
  var $log = null;
  var $scope = null;
  let ctrl = null;
  var $uibModalInstance = null;
  var alertsService = null;
  var angularNameService = null;
  var contextService = null;
  var explorationHtmlFormatterService = null;
  var stateCustomizationArgsService = null;
  var stateEditorService = null;
  var stateInteractionIdService = null;
  var stateObjectFactory = null;
  var explorationStatesService = null;
  var responsesService = null;
  var trainingDataService = null;
  var trainingModalService = null;
  var mockExternalSaveEventEmitter = null;
  var explorationId = 'exp1';
  var stateName = 'Introduction';
  let mockEmitter = new EventEmitter();
  var state = {
    classifier_model_id: null,
    content: {
      html: '',
      content_id: 'content'
    },
    interaction: {
      id: 'TextInput',
      customization_args: {
        rows: {
          value: 1
        },
        placeholder: {
          value: 'Type your answer here.'
        },
        catchMisspellings: {
          value: false
        }
      },
      answer_groups: [{
        rule_specs: [{
          rule_type: 'Equals',
          inputs: { x: {
            contentId: 'rule_input',
            normalizedStrSet: ['Correct Answer']
          }}
        }],
        outcome: {
          dest: 'outcome 1',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'content_5',
            html: ''
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null
        },
        training_data: [],
        tagged_skill_misconception_id: null
      }],
      default_outcome: {
        dest: 'Introduction',
        dest_if_really_stuck: null,
        feedback: {
          content_id: 'default_outcome',
          html: 'This is a html feedback'
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      },
      confirmed_unclassified_answers: [],
      hints: [],
      solution: null
    },
    linked_skill_id: null,
    param_changes: [],
    recorded_voiceovers: {
      voiceovers_mapping: {}
    },
    solicit_answer_details: false,
    written_translations: {
      translations_mapping: {}
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      isConfirmedUnclassifiedAnswer: () => {
        return true;
      },
      associateWithDefaultResponse: () => {},
      associateWithAnswerGroup: () => {},
    });

    $provide.value('TrainingDataService', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });

    $provide.value('TrainingModalService', {
      openTrainUnresolvedAnswerModal: () => {
        return true;
      },
      onFinishTrainingCallback: mockEmitter
    });
  }));

  beforeEach(function() {
    angularNameService = TestBed.get(AngularNameService);
    stateCustomizationArgsService = TestBed.get(StateCustomizationArgsService);
    stateInteractionIdService = TestBed.get(StateInteractionIdService);
    stateObjectFactory = TestBed.get(StateObjectFactory);
    trainingDataService = TestBed.get(TrainingDataService);
    trainingModalService = TestBed.get(TrainingModalService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', angularNameService);
    $provide.value(
      'TextInputRulesService',
      TestBed.get(TextInputRulesService));
    $provide.value(
      'OutcomeObjectFactory', TestBed.get(OutcomeObjectFactory));
    $provide.value(
      'StateCustomizationArgsService', stateCustomizationArgsService);
    $provide.value(
      'DEFAULT_OUTCOME_CLASSIFICATION',
      ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION);
    $provide.value(
      'EXPLICIT_CLASSIFICATION',
      ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION);
    $provide.value(
      'TRAINING_DATA_CLASSIFICATION',
      ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION);

    $provide.value(
      'StateEditorRefreshService', TestBed.get(StateEditorRefreshService));
    $provide.value('StateInteractionIdService', stateInteractionIdService);
    $provide.value('TrainingDataService', trainingDataService);
    $provide.value('TrainingModalService', trainingModalService);
    $provide.value('StateSolutionService', TestBed.get(StateSolutionService));
    mockExternalSaveEventEmitter = new EventEmitter();
    $provide.value('ExternalSaveService', {
      onExternalSave: mockExternalSaveEventEmitter
    });
    $provide.value(
      'ReadOnlyExplorationBackendApiService',
      TestBed.get(ReadOnlyExplorationBackendApiService));
  }));

  describe('when successfully fetching top unresolved answers', function() {
    let onchange = new EventEmitter();

    beforeEach(angular.mock.inject(function($injector, $controller) {
      alertsService = $injector.get('AlertsService');
      $httpBackend = $injector.get('$httpBackend');
      var $rootScope = $injector.get('$rootScope');
      contextService = $injector.get('ContextService');
      spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);

      explorationHtmlFormatterService = $injector.get(
        'ExplorationHtmlFormatterService');
      explorationStatesService = $injector.get('ExplorationStatesService');
      stateEditorService = $injector.get('StateEditorService');
      responsesService = $injector.get('ResponsesService');
      trainingDataService = $injector.get('TrainingDataService');
      trainingModalService = $injector.get('TrainingModalService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        stateName);

      spyOn(explorationStatesService, 'getState').and.returnValue(
        stateObjectFactory.createFromBackendDict(stateName, state));

      stateInteractionIdService.init(stateName, 'TextInput');

      spyOn(responsesService, 'getConfirmedUnclassifiedAnswers').and
        .returnValue([{}]);
      spyOn(responsesService, 'getAnswerGroups').and
        .returnValue([{
          rules: [],
          trainingData: [{}]
        }]);

      spyOn(explorationHtmlFormatterService, 'getAnswerHtml').and
        .returnValue('');

      $httpBackend.expect(
        'GET', '/createhandler/get_top_unresolved_answers/' +
        'exp1?state_name=Introduction').respond(200, {
        unresolved_answers: [{
          answer: 'Answer Text'
        }, {
          answer: 'Correct answer'
        }]
      });

      $scope = $rootScope.$new();
      ctrl = $controller('TeachOppiaModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });
      $httpBackend.flush();

      spyOnProperty(trainingModalService, 'onFinishTrainingCallback')
        .and.returnValue(onchange);
      ctrl.$onInit();
      $rootScope.$apply();
    }));

    afterEach(() => {
      ctrl.$onDestroy();
    });

    it('should initialize unresolved answer properties after controller is' +
      ' initialized', fakeAsync(() => {
      let unresolvedAnswers = $scope.unresolvedAnswers[0];

      let finishTrainingResult = {
        answerIndex: 0,
        answer: 'answer Data for truncateInputBasedOnInteractionAnswerType'
      };
      $scope.interactionId = 'TextInput';

      onchange.emit(finishTrainingResult);
      $scope.$apply();
      tick();

      expect(unresolvedAnswers.answer).toBe('Answer Text');
      expect(unresolvedAnswers.answerTemplate).toBe('');
      expect(unresolvedAnswers.feedbackHtml).toBe('This is a html feedback');
    }));

    it('should confirm answer assignment when its type is default_outcome',
      function() {
        spyOn(alertsService, 'addSuccessMessage');
        spyOn(trainingDataService, 'associateWithDefaultResponse').and
          .callFake(() => {});
        $scope.confirmAnswerAssignment(0);

        expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
          'The answer Answer Text has been successfully trained.', 2000);
      });

    it('should confirm answer assignment when its type is not default_outcome',
      function() {
        spyOn(alertsService, 'addSuccessMessage');
        spyOn(trainingDataService, 'associateWithAnswerGroup').and
          .callFake(() => {});

        // Mocking the answer object to change its type manually because
        // the controller has a lot of dependencies and can make it
        // hard to understand.
        Object.defineProperty($scope, 'unresolvedAnswers', {
          get: () => undefined
        });
        spyOnProperty($scope, 'unresolvedAnswers').and.returnValue([{}, {
          answer: 'Correct answer',
          classificationResult: {
            classificationCategorization: 'explicit',
            answerGroupIndex: 0
          }
        }]);
        $scope.confirmAnswerAssignment(1);

        expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
          'The answer Correct a... has been successfully trained.', 2000);
      });

    it('should open train unresolved answer modal', function() {
      spyOn(trainingModalService, 'openTrainUnresolvedAnswerModal').and
        .callFake(function(InteractionAnswer, interactionId, answerIndex) {
        });

      $scope.openTrainUnresolvedAnswerModal(0);

      expect(trainingModalService.openTrainUnresolvedAnswerModal)
        .toHaveBeenCalled();
    });
  });

  describe('when fetching top unresolved answers fails', function() {
    var $logSpy = null;

    beforeEach(angular.mock.inject(function($injector, $controller) {
      alertsService = $injector.get('AlertsService');
      $httpBackend = $injector.get('$httpBackend');
      $log = $injector.get('$log');
      var $rootScope = $injector.get('$rootScope');
      contextService = $injector.get('ContextService');
      spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);

      explorationHtmlFormatterService = $injector.get(
        'ExplorationHtmlFormatterService');
      explorationStatesService = $injector.get('ExplorationStatesService');
      stateEditorService = $injector.get('StateEditorService');
      responsesService = $injector.get('ResponsesService');
      trainingDataService = $injector.get('TrainingDataService');
      trainingModalService = $injector.get('TrainingModalService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        stateName);

      spyOn(explorationStatesService, 'getState').and.returnValue(
        stateObjectFactory.createFromBackendDict(stateName, state));

      stateInteractionIdService.init(stateName, 'TextInput');

      spyOn(responsesService, 'getConfirmedUnclassifiedAnswers').and
        .returnValue([{}]);
      spyOn(responsesService, 'getAnswerGroups').and
        .returnValue([{
          rules: [],
          trainingData: [{}]
        }]);

      spyOn(explorationHtmlFormatterService, 'getAnswerHtml').and
        .returnValue('');

      $logSpy = spyOn($log, 'error');

      $httpBackend.expect(
        'GET', '/createhandler/get_top_unresolved_answers/' +
        'exp1?state_name=Introduction').respond(
        500, 'Server error.');

      $scope = $rootScope.$new();
      $controller('TeachOppiaModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance
      });
      $httpBackend.flush();
    }));

    it('should initialize controller properties after its initialization',
      function() {
        expect($logSpy.calls.allArgs()).toContain(
          ['Error occurred while fetching unresolved answers ' +
          'for exploration exp1 state Introduction: Server error.']);

        expect($scope.loadingDotsAreShown).toBe(false);
        expect($scope.unresolvedAnswers).toEqual([]);
      });
  });
});
