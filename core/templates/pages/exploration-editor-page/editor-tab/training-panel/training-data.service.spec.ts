// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the training data service.
 */

import { UpgradedServices } from 'services/UpgradedServices';
import { TranslatorProviderForTests } from 'tests/unit-test-utils.ajs';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { TestBed } from '@angular/core/testing';
import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';

require('App.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-data.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service.ts');

describe('TrainingDataService', function() {
  var siis, ecs, rs, tds, ess, oof;

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
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: 0,
            autosaveChangeListAsync() {
              return;
            }
          }
        }
      ]
    });
  });

  beforeEach(
    angular.mock.module('oppia', TranslatorProviderForTests));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  importAllAngularServices();

  beforeEach(function() {
    angular.mock.module('oppia');
  });

  beforeEach(angular.mock.inject(function($injector, $rootScope) {
    siis = $injector.get('StateInteractionIdService');
    ecs = $injector.get('StateEditorService');
    ess = $injector.get('ExplorationStatesService');
    rs = $injector.get('ResponsesService');
    tds = $injector.get('TrainingDataService');
    oof = $injector.get('OutcomeObjectFactory');

    // Set the currently loaded interaction ID.
    siis.savedMemento = 'TextInput';

    ess.init({
      State: {
        content: {
          content_id: 'content',
          html: 'State Content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
        interaction: {
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [{
              rule_type: 'Contains',
              inputs: {x: {
                contentId: 'rule_input',
                normalizedStrSet: ['Test']
              }}
            }],
            outcome: {
              dest: 'State',
              feedback: {
                content_id: 'feedback_1',
                html: 'Feedback'
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            training_data: [],
            tagged_skill_misconception_id: null
          }],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 }
          },
          default_outcome: {
            dest: 'State',
            feedback: {
              content_id: 'default_outcome',
              html: 'Default'
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          hints: [],
          confirmed_unclassified_answers: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        },
      }
    });

    var state = ess.getState('State');
    rs.init({
      answerGroups: state.interaction.answerGroups,
      defaultOutcome: state.interaction.defaultOutcome,
      confirmedUnclassifiedAnswers: (
        state.interaction.confirmedUnclassifiedAnswers)
    });

    ecs.setActiveStateName('State');
  }));

  it('should be able to train answer groups and the default response',
    function() {
      // Training the first answer of a group should add a new classifier.
      tds.associateWithAnswerGroup(0, 'text answer');
      var state = ess.getState('State');
      expect(state.interaction.answerGroups[0].trainingData).toEqual([
        'text answer'
      ]);

      // Training a second answer to the same group should append the answer
      // to the training data.
      tds.associateWithAnswerGroup(0, 'second answer');
      state = ess.getState('State');
      expect(state.interaction.answerGroups[0].trainingData).toEqual([
        'text answer', 'second answer'
      ]);

      // Training the default response should add information to the confirmed
      // unclassified answers.
      tds.associateWithDefaultResponse('third answer');
      state = ess.getState('State');
      expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
        'third answer'
      ]);
      expect(tds.getTrainingDataOfAnswerGroup(0)).toEqual(
        ['text answer', 'second answer']);
    }
  );

  it('should be able to retrain answers between answer groups and the ' +
      'default outcome', function() {
    // Retraining an answer from the answer group to the default outcome
    // should remove it from the first, then add it to the second.
    tds.associateWithAnswerGroup(0, 'text answer');
    tds.associateWithAnswerGroup(0, 'second answer');
    tds.associateWithDefaultResponse('third answer');

    // Verify initial state.
    var state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer', 'second answer'
    ]);
    expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
      'third answer'
    ]);
    expect(tds.getTrainingDataOfAnswerGroup(0)).toEqual(
      ['text answer', 'second answer']);

    // Try to retrain the second answer (answer group -> default response).
    tds.associateWithDefaultResponse('second answer');
    state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer'
    ]);
    expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
      'third answer', 'second answer'
    ]);
    expect(tds.getTrainingDataOfAnswerGroup(0)).toEqual(
      ['text answer']);

    // Try to retrain the third answer (default response -> answer group).
    tds.associateWithAnswerGroup(0, 'third answer');
    state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer', 'third answer'
    ]);
    expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
      'second answer'
    ]);
    expect(tds.getTrainingDataOfAnswerGroup(0)).toEqual(
      ['text answer', 'third answer']);
  });

  it('should not be able to train duplicated answers', function() {
    tds.associateWithAnswerGroup(0, 'text answer');
    tds.associateWithDefaultResponse('second answer');

    // Verify initial state.
    var state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer'
    ]);
    expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
      'second answer'
    ]);
    expect(tds.getTrainingDataOfAnswerGroup(0)).toEqual(
      ['text answer']);

    // Training a duplicate answer for the answer group should change nothing.
    tds.associateWithAnswerGroup(0, 'text answer');
    state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer'
    ]);

    // Training a duplicate answer for the default response should change
    // nothing.
    tds.associateWithDefaultResponse('second answer');
    state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer'
    ]);
    expect(tds.getTrainingDataOfAnswerGroup(0)).toEqual(
      ['text answer']);
  });

  it('should get all potential outcomes of an interaction', function() {
    // First the answer group's outcome is listed, then the default.
    expect(tds.getAllPotentialOutcomes(ess.getState('State'))).toEqual([
      oof.createNew('State', 'feedback_1', 'Feedback', []),
      oof.createNew('State', 'default_outcome', 'Default', [])]);
  });

  it('should remove answer from training data associated with given answer ' +
      'group', function() {
    tds.associateWithAnswerGroup(0, 'text answer');
    tds.associateWithAnswerGroup(0, 'second answer');
    tds.associateWithAnswerGroup(0, 'another answer');

    var state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer', 'second answer', 'another answer'
    ]);

    tds.removeAnswerFromAnswerGroupTrainingData('second answer', 0);

    state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer', 'another answer'
    ]);
    expect(tds.getTrainingDataOfAnswerGroup(0)).toEqual(
      ['text answer', 'another answer']);
  });

  it('should correctly check whether answer is in confirmed unclassified ' +
      'answers', function() {
    tds.associateWithAnswerGroup(0, 'text answer');
    tds.associateWithAnswerGroup(0, 'another answer');
    tds.associateWithDefaultResponse('second answer');

    var state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer', 'another answer'
    ]);
    expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
      'second answer'
    ]);

    expect(tds.isConfirmedUnclassifiedAnswer('text answer')).toBe(false);
    expect(tds.isConfirmedUnclassifiedAnswer('second answer')).toBe(true);
    expect(tds.getTrainingDataOfAnswerGroup(0)).toEqual(
      ['text answer', 'another answer']);
  });

  it('should get all the training data answers', function() {
    tds.associateWithAnswerGroup(0, 'text answer');
    tds.associateWithAnswerGroup(0, 'another answer');
    tds.associateWithDefaultResponse('second answer');
    expect(tds.getTrainingDataAnswers()).toEqual([{
      answerGroupIndex: 0,
      answers: ['text answer', 'another answer']
    }]);
    expect(tds.getTrainingDataOfAnswerGroup(0)).toEqual(
      ['text answer', 'another answer']);
  });
});
