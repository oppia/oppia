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
 * @fileoverview Unit tests for the learner answer info service.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerClassificationService } from
  'pages/exploration-player-page/services/answer-classification.service';
import { ExplorationPlayerConstants } from
  'pages/exploration-player-page/exploration-player-page.constants.ts';
import { LearnerAnswerDetailsBackendApiService } from
  'domain/statistics/learner-answer-details-backend-api.service.ts';
import { IInteractionRules, LearnerAnswerInfoService } from
  'pages/exploration-player-page/services/learner-answer-info.service.ts';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory.ts';
import { State, StateObjectFactory } from 'domain/state/StateObjectFactory.ts';

describe('Learner answer info service', () => {
  let sof: StateObjectFactory = null;
  let oof: OutcomeObjectFactory = null;
  let acrof: AnswerClassificationResultObjectFactory = null;
  let stateDict = null;
  let firstState: State = null;
  let secondState: State = null;
  let thirdState: State = null;
  let mockAnswer: string = null;
  let mockInteractionRulesService: IInteractionRules = null;
  let ladbas: LearnerAnswerDetailsBackendApiService = null;
  let learnerAnswerInfoService: LearnerAnswerInfoService = null;
  let answerClassificationService: AnswerClassificationService = null;
  let DEFAULT_OUTCOME_CLASSIFICATION;
  let httpTestingController;

  beforeEach(() => {
    stateDict = {
      content: {
        content_id: 'content',
        html: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
          feedback_1: {},
          feedback_2: {}
        }
      },
      interaction: {
        id: 'RuleTest',
        answer_groups: [{
          outcome: {
            dest: 'outcome 1',
            feedback: {
              content_id: 'feedback_1',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          rule_specs: [{
            inputs: {
              x: 10
            },
            rule_type: 'Equals'
          }]
        }, {
          outcome: {
            dest: 'outcome 2',
            feedback: {
              content_id: 'feedback_2',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          rule_specs: [{
            inputs: {
              x: 5
            },
            rule_type: 'Equals'
          }, {
            inputs: {
              x: 7
            },
            rule_type: 'NotEquals'
          }, {
            inputs: {
              x: 6
            },
            rule_type: 'Equals'
          }]
        }],
        default_outcome: {
          dest: 'default',
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: []
      },
      param_changes: [],
      solicit_answer_details: true,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
          feedback_1: {},
          feedback_2: {}
        }
      }
    };
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    sof = TestBed.get(StateObjectFactory);
    oof = TestBed.get(OutcomeObjectFactory);
    acrof = TestBed.get(AnswerClassificationResultObjectFactory);
    firstState = sof.createFromBackendDict('new state', stateDict);
    secondState = sof.createFromBackendDict('fake state', stateDict);
    thirdState = sof.createFromBackendDict('demo state', stateDict);
    ladbas = TestBed.get(LearnerAnswerDetailsBackendApiService);
    learnerAnswerInfoService = TestBed.get(LearnerAnswerInfoService);
    answerClassificationService = TestBed.get(AnswerClassificationService);
    DEFAULT_OUTCOME_CLASSIFICATION =
      ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION;
    spyOn(answerClassificationService, 'getMatchingClassificationResult')
      .and.returnValue(acrof.createNew(
        oof.createNew('default', 'default_outcome', '', []), 2, 0,
        DEFAULT_OUTCOME_CLASSIFICATION));
    mockAnswer = 'This is my answer';
    mockInteractionRulesService = {
      Equals: function(answer, inputs) {
        return inputs.x === answer;
      },
      NotEquals: function(answer, inputs) {
        return inputs.x !== answer;
      }
    };
    // Spying the random function to return 0, so that
    // getRandomProbabilityIndex() returns 0, which is a private function in
    // LearnerAnswerInfoService. This will help to mark the
    // canAskLearnerAnswerInfo which is a boolean variable as true as every
    // probability index is greater than 0.
    spyOn(Math, 'random').and.returnValue(0);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('.initLearnerAnswerInfo', () => {
    beforeEach(() => {
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', firstState, mockAnswer, mockInteractionRulesService, false);
    });

    it('should return can ask learner for answer info true', function() {
      expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toBe(
        true);
    });

    it('should return current answer', function() {
      expect(learnerAnswerInfoService.getCurrentAnswer()).toEqual(
        'This is my answer');
    });

    it('should return current interaction rules service', function() {
      expect(
        learnerAnswerInfoService.getCurrentInteractionRulesService()).toEqual(
        mockInteractionRulesService);
    });
  });

  describe('learner answer info service', () => {
    beforeEach(() => {
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', firstState, mockAnswer, mockInteractionRulesService, false);
    });

    it('should not ask for answer details for same state', function() {
      expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toBe(
        true);
      spyOn(ladbas, 'recordLearnerAnswerDetails');
      learnerAnswerInfoService.recordLearnerAnswerInfo('My answer details');
      expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toBe(
        false);
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', firstState, mockAnswer, mockInteractionRulesService, false);
      expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toBe(
        false);
    });
  });

  describe(
    'should not ask for answer details for trivial interaction ids',
    () => {
      beforeEach(() => {
        firstState.interaction.id = 'EndExploration';
        learnerAnswerInfoService.initLearnerAnswerInfoService(
          '10', firstState, mockAnswer, mockInteractionRulesService, false);
      });

      it('should return can ask learner for answer info false', function() {
        expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toBe(
          false);
      });
    });

  describe('init learner answer info service with solicit answer details false',
    () => {
      beforeEach(() => {
        firstState.solicitAnswerDetails = false;
        learnerAnswerInfoService.initLearnerAnswerInfoService(
          '10', firstState, mockAnswer, mockInteractionRulesService, false);
      });

      it('should return can ask learner for answer info false', function() {
        expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toBe(
          false);
      });
    });

  describe('.recordLearnerAnswerInfo', () => {
    beforeEach(() => {
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', firstState, mockAnswer, mockInteractionRulesService, false);
    });

    it('should record learner answer details', function() {
      spyOn(ladbas, 'recordLearnerAnswerDetails');
      learnerAnswerInfoService.recordLearnerAnswerInfo('My details');
      expect(
        ladbas.recordLearnerAnswerDetails).toHaveBeenCalledWith(
        '10', 'new state', 'RuleTest', 'This is my answer', 'My details');
    });
  });

  describe('learner answer info service', () => {
    beforeEach(() => {
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', firstState, mockAnswer, mockInteractionRulesService, false);
      spyOn(ladbas, 'recordLearnerAnswerDetails');
      learnerAnswerInfoService.recordLearnerAnswerInfo('My details 1');
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', secondState, mockAnswer, mockInteractionRulesService, false);
      learnerAnswerInfoService.recordLearnerAnswerInfo('My details 1');
    });

    it('should not record answer details more than two times', function() {
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10', thirdState, mockAnswer, mockInteractionRulesService, false);
      expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toBe(
        false);
    });
  });

  describe('return html from the service', () => {
    it('should return solicit answer details question', function() {
      expect(
        learnerAnswerInfoService.getSolicitAnswerDetailsQuestion()).toEqual(
        '<p translate="I18N_SOLICIT_ANSWER_DETAILS_QUESTION"></p>');
    });

    it('should return solicit answer details feedback', function() {
      expect(
        learnerAnswerInfoService.getSolicitAnswerDetailsFeedback()).toEqual(
        '<p translate="I18N_SOLICIT_ANSWER_DETAILS_FEEDBACK"></p>');
    });
  });
});
