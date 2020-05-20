// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the answer classification service
 */

import { TestBed } from '@angular/core/testing';

import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerClassificationService } from
  'pages/exploration-player-page/services/answer-classification.service';
import { AppService } from 'services/app.service';
import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { ExplorationPlayerConstants } from
  'pages/exploration-player-page/exploration-player-page.constants';
import { InteractionSpecsService } from 'services/interaction-specs.service';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { PredictionAlgorithmRegistryService } from
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/services/prediction-algorithm-registry.service';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';

describe('Answer Classification Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({providers: [CamelCaseToHyphensPipe]});

    this.acrof = TestBed.get(AnswerClassificationResultObjectFactory);
    this.acs = TestBed.get(AnswerClassificationService);
    this.as = TestBed.get(AppService);
    this.iss = TestBed.get(InteractionSpecsService);
    this.oof = TestBed.get(OutcomeObjectFactory);
    this.pars = TestBed.get(PredictionAlgorithmRegistryService);
    this.scms = TestBed.get(StateClassifierMappingService);
    this.sof = TestBed.get(StateObjectFactory);

    this.stateName = 'Test State';
    this.rules = {
      Equals: (answer, inputs) => inputs.x === answer,
      NotEquals: (answer, inputs) => inputs.x !== answer,
      Contains: (answer, inputs) => (
        answer.toLowerCase().includes(inputs.x.toLowerCase()))
    };

    this.createStateFromBackendDict = (
      () => this.sof.createFromBackendDict(this.stateName, this.stateDict));
  });

  describe('with string classifier disabled', () => {
    beforeEach(() => {
      spyOn(this.iss, 'isInteractionTrainable').and.returnValue(false);
      spyOn(this.as, 'isMachineLearningClassificationEnabled')
        .and.returnValue(false);

      this.stateDict = {
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
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {}
          }
        }
      };
    });

    it('should fail if no frontend rules are provided', () => {
      const state = this.createStateFromBackendDict();

      expect(
        () => this.acs.getMatchingClassificationResult(
          state.name, state.interaction, 0, null)
      ).toThrowError(
        'No interactionRulesService was available to classify the answer.');
    });

    it('should return the first matching answer group and first matching ' +
        'rule spec', () => {
      const state = this.createStateFromBackendDict();

      expect(
        this.acs.getMatchingClassificationResult(
          state.name, state.interaction, 10, this.rules)
      ).toEqual(
        this.acrof.createNew(
          this.oof.createNew('outcome 1', 'feedback_1', '', []), 0, 0,
          ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION));

      expect(
        this.acs.getMatchingClassificationResult(
          state.name, state.interaction, 5, this.rules)
      ).toEqual(
        this.acrof.createNew(
          this.oof.createNew('outcome 2', 'feedback_2', '', []), 1, 0,
          ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION));

      expect(
        this.acs.getMatchingClassificationResult(
          state.name, state.interaction, 6, this.rules)
      ).toEqual(
        this.acrof.createNew(
          this.oof.createNew('outcome 2', 'feedback_2', '', []), 1, 1,
          ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION));
    });

    it('should return the default rule if no answer group matches', () => {
      const state = this.createStateFromBackendDict();

      expect(
        this.acs.getMatchingClassificationResult(
          state.name, state.interaction, 7, this.rules)
      ).toEqual(
        this.acrof.createNew(
          this.oof.createNew('default', 'default_outcome', '', []), 2, 0,
          ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION));
    });

    it(
      'should fail if no answer group matches and no default rule is ' +
        'provided',
      () => {
        this.stateDict.interaction.answer_groups = [{
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
        }];

        const state = this.createStateFromBackendDict();

        expect(
          () => this.acs.getMatchingClassificationResult(
            state.name, state.interaction, 0, null)
        ).toThrowError(
          'No interactionRulesService was available to classify the answer.');
      });
  });

  describe('with string classifier enabled', () => {
    beforeEach(() => {
      spyOn(this.as, 'isMachineLearningClassificationEnabled')
        .and.returnValue(true);

      this.scms.init({
        [this.stateName]: {
          algorithm_id: 'TestClassifier',
          classifier_data: {},
          data_schema_version: 1
        }
      });
      this.pars.testOnlySetPredictionService(
        'TestClassifier', 1, { predict: (classifierData, answer) => 1 });

      this.stateDict = {
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
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {}
          }
        }
      };
    });

    it(
      'should query the prediction service if no answer group matches and ' +
        'interaction is trainable',
      () => {
        spyOn(this.iss, 'isInteractionTrainable').and.returnValue(true);

        const state = this.createStateFromBackendDict();

        expect(
          this.acs.getMatchingClassificationResult(
            state.name, state.interaction, 0, this.rules)
        ).toEqual(
          this.acrof.createNew(
            state.interaction.answerGroups[1].outcome, 1, null,
            ExplorationPlayerConstants.STATISTICAL_CLASSIFICATION));
      });

    it(
      'should return the default rule if no answer group matches and ' +
        'interaction is not trainable',
      () => {
        spyOn(this.iss, 'isInteractionTrainable').and.returnValue(false);

        const state = this.createStateFromBackendDict();

        expect(
          this.acs.getMatchingClassificationResult(
            state.name, state.interaction, 0, this.rules)
        ).toEqual(
          this.acrof.createNew(
            this.oof.createNew('default', 'default_outcome', '', []), 2, 0,
            ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION));
      });
  });

  describe('with training data classification', () => {
    beforeEach(() => {
      spyOn(this.iss, 'isInteractionTrainable').and.returnValue(true);
      spyOn(this.as, 'isMachineLearningClassificationEnabled')
        .and.returnValue(true);

      this.stateDict = {
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
            training_data: ['abc', 'input'],
            rule_specs: [{
              inputs: {
                x: 'equal'
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
            training_data: ['xyz'],
            rule_specs: [{
              inputs: {
                x: 'npu'
              },
              rule_type: 'Contains'
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
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            feedback_2: {}
          }
        }
      };
    });

    it(
      'should use training data classification if no answer group matches ' +
        'and interaction is trainable',
      () => {
        const state = this.createStateFromBackendDict();

        expect(
          this.acs.getMatchingClassificationResult(
            state.name, state.interaction, 'abc', this.rules)
        ).toEqual(
          this.acrof.createNew(
            state.interaction.answerGroups[0].outcome, 0, null,
            ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION));

        expect(
          this.acs.getMatchingClassificationResult(
            state.name, state.interaction, 'xyz', this.rules)
        ).toEqual(
          this.acrof.createNew(
            state.interaction.answerGroups[1].outcome, 1, null,
            ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION));
      });

    it(
      'should perform explicit classification before doing training data ' +
        'classification',
      () => {
        const state = this.createStateFromBackendDict();

        expect(
          this.acs.getMatchingClassificationResult(
            state.name, state.interaction, 'input', this.rules)
        ).toEqual(
          this.acrof.createNew(
            state.interaction.answerGroups[1].outcome, 1, 0,
            ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION));
      });
  });
});
