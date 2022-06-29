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
 * @fileoverview Unit tests for trainingPanel.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { StateSolutionService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-solution.service';
import { StateCustomizationArgsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Training Panel Component', function() {
  importAllAngularServices();

  var ctrl = null;
  var $scope = null;
  var explorationStatesService = null;
  var generateContentIdService = null;
  var responsesService = null;
  var stateEditorService = null;
  var stateInteractionIdService = null;
  var stateCustomizationArgsService = null;
  var stateObjectFactory = null;

  var stateName = 'State1';
  var state = {
    classifier_model_id: '1',
    content: {
      content_id: 'content1',
      html: 'This is a html text'
    },
    interaction: {
      answer_groups: [{
        outcome: {
          dest: 'outcome 1',
          feedback: {
            content_id: 'content2',
            html: ''
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null
        },
        rule_specs: [],
        tagged_skill_misconception_id: ''
      }, {
        outcome: {
          dest: 'outcome 2',
          feedback: {
            content_id: 'content3',
            html: ''
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null
        },
        rule_specs: [],
        tagged_skill_misconception_id: ''
      }],
      confirmed_unclassified_answers: null,
      customization_args: {},
      hints: [],
      id: null,
      solution: {
        answer_is_exclusive: false,
        correct_answer: 'This is the correct answer',
        explanation: {
          content_id: 'content1',
          html: 'This is a html text'
        }
      }
    },
    linked_skill_id: null,
    next_content_id_index: 1,
    param_changes: [],
    recorded_voiceovers: {
      voiceovers_mapping: {}
    },
    solicit_answer_details: true,
    written_translations: {
      translations_mapping: {}
    },
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  });

  beforeEach(function() {
    generateContentIdService = TestBed.get(GenerateContentIdService);
    stateCustomizationArgsService = TestBed.get(StateCustomizationArgsService);
    stateInteractionIdService = TestBed.get(StateInteractionIdService);
    stateObjectFactory = TestBed.get(StateObjectFactory);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', TestBed.get(AngularNameService));
    $provide.value('GenerateContentIdService', generateContentIdService);
    $provide.value(
      'TextInputRulesService',
      TestBed.get(TextInputRulesService));
    $provide.value(
      'OutcomeObjectFactory', TestBed.get(OutcomeObjectFactory));
    $provide.value(
      'StateCustomizationArgsService', stateCustomizationArgsService);
    $provide.value(
      'StateEditorRefreshService', TestBed.get(StateEditorRefreshService));
    $provide.value('StateInteractionIdService', stateInteractionIdService);
    $provide.value('StateSolutionService', TestBed.get(StateSolutionService));
    $provide.value(
      'ReadOnlyExplorationBackendApiService',
      TestBed.get(ReadOnlyExplorationBackendApiService));
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');
    explorationStatesService = $injector.get('ExplorationStatesService');
    responsesService = $injector.get('ResponsesService');
    stateEditorService = $injector.get('StateEditorService');

    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(stateName);
    spyOn(explorationStatesService, 'getState').and.returnValue(
      stateObjectFactory.createFromBackendDict(stateName, state));
    spyOn(generateContentIdService, 'getNextStateId').and.returnValue(
      'feedback_1');

    stateInteractionIdService.init(stateName, 'MultipleChoiceInput');
    stateCustomizationArgsService.init(stateName, {
      choices: {value: []},
      showChoicesInShuffledOrder: {value: true}
    });

    $scope = $rootScope.$new();
    ctrl = $componentController('trainingPanel', {
      $scope: $scope,
      StateInteractionIdService: stateInteractionIdService,
      StateCustomizationArgsService: stateCustomizationArgsService
    }, {
      answer: {},
      classification: {
        answerGroupIndex: 0,
        newOutcome: {}
      },
      onFinishTraining: () => {},
      addingNewResponse: null
    });
    ctrl.$onInit();
  }));

  it('should initialize $scope properties after controller is initialized',
    function() {
      expect(ctrl.addingNewResponse).toBe(false);
      expect($scope.allOutcomes.length).toBe(2);
      expect($scope.selectedAnswerGroupIndex).toBe(0);
      expect($scope.answerTemplate).toBe(
        '<oppia-response-multiple-choice-input answer="{}" choices="[]">' +
        '</oppia-response-multiple-choice-input>');
    });

  it('should get name from current state', function() {
    expect($scope.getCurrentStateName()).toBe(stateName);
  });

  it('should add new feedback and select it', function() {
    spyOn(responsesService, 'getAnswerGroupCount').and.returnValue(0);
    expect($scope.allOutcomes.length).toBe(2);
    expect($scope.selectedAnswerGroupIndex).toBe(0);
    $scope.confirmNewFeedback();

    expect($scope.allOutcomes.length).toBe(3);
    expect($scope.selectedAnswerGroupIndex).toBe(2);
  });

  it('should start to add new response and then cancel it', function() {
    $scope.beginAddingNewResponse();
    expect(ctrl.addingNewResponse).toBe(true);
    expect(ctrl.classification.newOutcome.feedback.contentId).toBe(
      'feedback_1');

    $scope.cancelAddingNewResponse();
    expect(ctrl.addingNewResponse).toBe(false);
    expect(ctrl.classification.newOutcome).toBe(null);
  });
});
