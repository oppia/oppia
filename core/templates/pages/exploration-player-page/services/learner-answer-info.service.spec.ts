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
 * @fileoverview Unit tests for the learner answer info service.
 */

import {TestBed} from '@angular/core/testing';
import {AnswerClassificationResult} from 'domain/classifier/answer-classification-result.model';
import {OutcomeObjectFactory} from 'domain/exploration/OutcomeObjectFactory';
import {
  State,
  StateBackendDict,
  StateObjectFactory,
} from 'domain/state/StateObjectFactory';
import {LearnerAnswerDetailsBackendApiService} from 'domain/statistics/learner-answer-details-backend-api.service';
import {
  AnswerClassificationService,
  InteractionRulesService,
} from 'pages/exploration-player-page/services/answer-classification.service';
import {LearnerAnswerInfoService} from 'pages/exploration-player-page/services/learner-answer-info.service';
import {ExplorationPlayerConstants} from 'pages/exploration-player-page/exploration-player-page.constants';
import {TextInputRulesService} from 'interactions/TextInput/directives/text-input-rules.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('Learner answer info service', () => {
  let sof: StateObjectFactory;
  let oof: OutcomeObjectFactory;
  let stateDict: StateBackendDict;
  let firstState: State;
  let secondState: State;
  let thirdState: State;
  let tirs: InteractionRulesService;
  let mockAnswer: string;
  let ladbas: LearnerAnswerDetailsBackendApiService;
  let learnerAnswerInfoService: LearnerAnswerInfoService;
  let answerClassificationService: AnswerClassificationService;
  let DEFAULT_OUTCOME_CLASSIFICATION: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LearnerAnswerInfoService],
    });
    stateDict = {
      content: {
        content_id: 'content',
        html: 'content',
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
          feedback_1: {},
          feedback_2: {},
        },
      },
      interaction: {
        id: 'TextInput',
        customization_args: {
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: '',
            },
          },
          rows: {value: 1},
          catchMisspellings: {
            value: false,
          },
        },
        answer_groups: [
          {
            outcome: {
              dest: 'outcome 1',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: '',
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            rule_specs: [
              {
                rule_type: 'Equals',
                inputs: {
                  x: {
                    contentId: 'rule_input_0',
                    normalizedStrSet: ['10'],
                  },
                },
              },
            ],
            training_data: [],
            tagged_skill_misconception_id: '',
          },
          {
            outcome: {
              dest: 'outcome 2',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: '',
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
            },
            rule_specs: [
              {
                rule_type: 'Equals',
                inputs: {
                  x: {
                    contentId: 'rule_input_1',
                    normalizedStrSet: ['5'],
                  },
                },
              },
              {
                rule_type: 'Equals',
                inputs: {
                  x: {
                    contentId: 'rule_input_2',
                    normalizedStrSet: ['6'],
                  },
                },
              },
              {
                rule_type: 'FuzzyEquals',
                inputs: {
                  x: {
                    contentId: 'rule_input_3',
                    normalizedStrSet: ['7'],
                  },
                },
              },
            ],
            training_data: [],
            tagged_skill_misconception_id: '',
          },
        ],
        default_outcome: {
          dest: 'default',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: '',
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
        },
        hints: [],
        confirmed_unclassified_answers: [],
        solution: null,
      },
      param_changes: [],
      solicit_answer_details: true,
      card_is_checkpoint: false,
      linked_skill_id: null,
      classifier_model_id: '',
    };

    sof = TestBed.get(StateObjectFactory);
    oof = TestBed.get(OutcomeObjectFactory);
    learnerAnswerInfoService = TestBed.get(LearnerAnswerInfoService);
    answerClassificationService = TestBed.get(AnswerClassificationService);
    ladbas = TestBed.get(LearnerAnswerDetailsBackendApiService);
    DEFAULT_OUTCOME_CLASSIFICATION =
      ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION;
    firstState = sof.createFromBackendDict('new state', stateDict);
    secondState = sof.createFromBackendDict('fake state', stateDict);
    thirdState = sof.createFromBackendDict('demo state', stateDict);
    tirs = TestBed.get(TextInputRulesService);

    spyOn(
      answerClassificationService,
      'getMatchingClassificationResult'
    ).and.returnValue(
      new AnswerClassificationResult(
        oof.createNew('default', 'default_outcome', '', []),
        2,
        0,
        DEFAULT_OUTCOME_CLASSIFICATION
      )
    );

    mockAnswer = 'This is my answer';
    // Spying the random function to return 0, so that
    // getRandomProbabilityIndex() returns 0, which is a private function in
    // LearnerAnswerInfoService. This will help to mark the
    // canAskLearnerAnswerInfo which is a boolean variable as true as every
    // probability index is greater than 0.
    spyOn(Math, 'random').and.returnValue(0);
  });

  describe('.initLearnerAnswerInfo', () => {
    beforeEach(function () {
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10',
        firstState,
        mockAnswer,
        tirs,
        false
      );
    });

    it('should return can ask learner for answer info true', () => {
      expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toEqual(
        true
      );
    });

    it('should return current answer', () => {
      expect(learnerAnswerInfoService.getCurrentAnswer()).toEqual(
        'This is my answer'
      );
    });

    it('should return current interaction rules service', () => {
      expect(
        learnerAnswerInfoService.getCurrentInteractionRulesService()
      ).toEqual(tirs);
    });
  });

  describe('learner answer info service', () => {
    beforeEach(function () {
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10',
        firstState,
        mockAnswer,
        tirs,
        false
      );
    });

    it('should not ask for answer details for same state', () => {
      expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toEqual(
        true
      );
      learnerAnswerInfoService.recordLearnerAnswerInfo('My answer details');
      expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toEqual(
        false
      );
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10',
        firstState,
        mockAnswer,
        tirs,
        false
      );
      expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toEqual(
        false
      );
    });
  });

  describe('should not ask for answer details for trivial interaction ids', () => {
    beforeEach(function () {
      firstState.interaction.id = 'EndExploration';
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10',
        firstState,
        mockAnswer,
        tirs,
        false
      );
    });

    it('should return can ask learner for answer info false', () => {
      expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toEqual(
        false
      );
    });
  });

  describe('init learner answer info service with solicit answer details false', () => {
    beforeEach(function () {
      firstState.solicitAnswerDetails = false;
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10',
        firstState,
        mockAnswer,
        tirs,
        false
      );
    });
    it('should return can ask learner for answer info false', () => {
      expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toEqual(
        false
      );
    });
  });

  describe('.recordLearnerAnswerInfo', () => {
    beforeEach(function () {
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10',
        firstState,
        mockAnswer,
        tirs,
        false
      );
    });

    it('should record learner answer details', () => {
      spyOn(ladbas, 'recordLearnerAnswerDetailsAsync');
      learnerAnswerInfoService.recordLearnerAnswerInfo('My details');
      expect(ladbas.recordLearnerAnswerDetailsAsync).toHaveBeenCalledWith(
        '10',
        'new state',
        'TextInput',
        'This is my answer',
        'My details'
      );
    });
  });

  describe('learner answer info service', () => {
    beforeEach(function () {
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10',
        firstState,
        mockAnswer,
        tirs,
        false
      );
      learnerAnswerInfoService.recordLearnerAnswerInfo('My details 1');
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10',
        secondState,
        mockAnswer,
        tirs,
        false
      );
      learnerAnswerInfoService.recordLearnerAnswerInfo('My details 1');
    });

    it('should not record answer details more than two times', () => {
      learnerAnswerInfoService.initLearnerAnswerInfoService(
        '10',
        thirdState,
        mockAnswer,
        tirs,
        false
      );
      expect(learnerAnswerInfoService.getCanAskLearnerForAnswerInfo()).toEqual(
        false
      );
    });
  });

  describe('return html from the service', () => {
    it('should return solicit answer details question', () => {
      expect(
        learnerAnswerInfoService.getSolicitAnswerDetailsQuestion()
      ).toEqual('<p translate="I18N_SOLICIT_ANSWER_DETAILS_QUESTION"></p>');
    });

    it('should return solicit answer details feedabck', () => {
      expect(
        learnerAnswerInfoService.getSolicitAnswerDetailsFeedback()
      ).toEqual('<p translate="I18N_SOLICIT_ANSWER_DETAILS_FEEDBACK"></p>');
    });
  });
});
