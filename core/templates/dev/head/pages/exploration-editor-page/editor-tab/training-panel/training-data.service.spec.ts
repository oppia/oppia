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

// TODO(#7222): Remove the following block of unnnecessary imports once
// training-data.service.ts is upgraded to Angular 8.
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
/* eslint-disable max-len */
import { AnswerGroupsCacheService } from
  'pages/exploration-editor-page/editor-tab/services/answer-groups-cache.service';
/* eslint-enable max-len */
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
/* eslint-disable max-len */
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
/* eslint-enable max-len */
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
/* eslint-disable max-len */
import { StateEditorService } from
  'components/state-editor/state-editor-properties-services/state-editor.service';
/* eslint-enable max-len */
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
// ^^^ This block is to be removed.

require('App.ts');
require('pages/exploration-editor-page/services/change-list.service.ts');
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
  var $httpBackend;
  var scope, siis, ecs, cls, rs, tds, ess, IS, oof;
  var mockExplorationData;

  beforeEach(
    angular.mock.module('oppia', GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS));

  beforeEach(function() {
    angular.mock.module('oppia');
    // Set a global value for INTERACTION_SPECS that will be used by all the
    // descendant dependencies.
    angular.mock.module(function($provide) {
      $provide.constant('INTERACTION_SPECS', {
        TextInput: {
          display_mode: 'inline',
          is_terminal: false
        }
      });
      $provide.value('AngularNameService', new AngularNameService());
      $provide.value(
        'AnswerClassificationResultObjectFactory',
        new AnswerClassificationResultObjectFactory());
      $provide.value(
        'AnswerGroupsCacheService', new AnswerGroupsCacheService());
      $provide.value(
        'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
          new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
          new RuleObjectFactory()));
      $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
      $provide.value(
        'ExplorationDraftObjectFactory', new ExplorationDraftObjectFactory());
      $provide.value('FractionObjectFactory', new FractionObjectFactory());
      $provide.value(
        'HintObjectFactory', new HintObjectFactory(
          new SubtitledHtmlObjectFactory()));
      $provide.value(
        'OutcomeObjectFactory', new OutcomeObjectFactory(
          new SubtitledHtmlObjectFactory()));
      $provide.value(
        'ParamChangeObjectFactory', new ParamChangeObjectFactory());
      $provide.value(
        'ParamChangesObjectFactory', new ParamChangesObjectFactory(
          new ParamChangeObjectFactory()));
      $provide.value('RuleObjectFactory', new RuleObjectFactory());
      $provide.value(
        'RecordedVoiceoversObjectFactory',
        new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
      $provide.value('SolutionValidityService', new SolutionValidityService());
      $provide.value(
        'StateClassifierMappingService', new StateClassifierMappingService(
          new ClassifierObjectFactory()));
      $provide.value(
        'StateEditorService', new StateEditorService(
          new SolutionValidityService()));
      $provide.value(
        'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
      $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
      $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
      $provide.value(
        'WrittenTranslationObjectFactory',
        new WrittenTranslationObjectFactory());
      $provide.value(
        'WrittenTranslationsObjectFactory',
        new WrittenTranslationsObjectFactory(
          new WrittenTranslationObjectFactory()));
    });
    mockExplorationData = {
      explorationId: 0,
      autosaveChangeList: function() {}
    };
    angular.mock.module(function($provide) {
      $provide.value('ExplorationDataService', [mockExplorationData][0]);
    });
    spyOn(mockExplorationData, 'autosaveChangeList');
  });

  beforeEach(angular.mock.inject(function($injector, $rootScope) {
    scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
    siis = $injector.get('StateInteractionIdService');
    ecs = $injector.get('StateEditorService');
    cls = $injector.get('ChangeListService');
    ess = $injector.get('ExplorationStatesService');
    rs = $injector.get('ResponsesService');
    tds = $injector.get('TrainingDataService');
    IS = $injector.get('INTERACTION_SPECS');
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
              inputs: {
                x: 'Test'
              }
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

    // Try to retrain the second answer (answer group -> default response).
    tds.associateWithDefaultResponse('second answer');
    state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer'
    ]);
    expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
      'third answer', 'second answer'
    ]);

    // Try to retrain the third answer (default response -> answer group).
    tds.associateWithAnswerGroup(0, 'third answer');
    state = ess.getState('State');
    expect(state.interaction.answerGroups[0].trainingData).toEqual([
      'text answer', 'third answer'
    ]);
    expect(state.interaction.confirmedUnclassifiedAnswers).toEqual([
      'second answer'
    ]);
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
  });

  it('should get all the training data answers', function() {
    tds.associateWithAnswerGroup(0, 'text answer');
    tds.associateWithAnswerGroup(0, 'another answer');
    tds.associateWithDefaultResponse('second answer');
    expect(tds.getTrainingDataAnswers()).toEqual([{
      answerGroupIndex: 0,
      answers: ['text answer', 'another answer']
    }]);
  });
});
