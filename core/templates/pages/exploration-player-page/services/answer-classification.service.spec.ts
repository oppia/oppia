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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AnswerClassificationResult } from
  'domain/classifier/answer-classification-result.model';
import { AnswerClassificationService, InteractionRulesService } from
  'pages/exploration-player-page/services/answer-classification.service';
import { AppService } from 'services/app.service';
import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { Classifier } from 'domain/classifier/classifier.model';
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
import { TextClassifierFrozenModel } from 'classifiers/proto/text_classifier';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';

describe('Answer Classification Service', () => {
  const stateName = 'Test State';

  let answerClassificationService: AnswerClassificationService;
  let appService: AppService;
  let interactionSpecsService: InteractionSpecsService;
  let outcomeObjectFactory: OutcomeObjectFactory;
  let predictionAlgorithmRegistryService: PredictionAlgorithmRegistryService;
  let stateClassifierMappingService: StateClassifierMappingService;
  let stateObjectFactory: StateObjectFactory;
  let textInputRulesService: InteractionRulesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CamelCaseToHyphensPipe],
    });

    answerClassificationService = TestBed.get(AnswerClassificationService);
    appService = TestBed.get(AppService);
    interactionSpecsService = TestBed.get(InteractionSpecsService);
    outcomeObjectFactory = TestBed.get(OutcomeObjectFactory);
    predictionAlgorithmRegistryService = TestBed.get(
      PredictionAlgorithmRegistryService);
    stateClassifierMappingService = TestBed.get(StateClassifierMappingService);
    stateObjectFactory = TestBed.get(StateObjectFactory);
    textInputRulesService = TestBed.get(TextInputRulesService);
  });

  describe('with string classifier disabled', () => {
    let stateDict;
    let expId = '0';

    beforeEach(() => {
      spyOn(
        interactionSpecsService, 'isInteractionTrainable'
      ).and.returnValue(false);
      spyOn(appService, 'isMachineLearningClassificationEnabled')
        .and.returnValue(false);
      stateClassifierMappingService.init(expId, 0);

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
          id: 'TextInput',
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 }
          },
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
              rule_type: 'Equals',
              inputs: {
                x: {
                  contentId: 'rule_input_0',
                  normalizedStrSet: ['10']
                }
              }
            }],
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
              rule_type: 'Equals',
              inputs: {
                x: {
                  contentId: 'rule_input_1',
                  normalizedStrSet: ['5']
                }
              }
            }, {
              rule_type: 'Equals',
              inputs: {
                x: {
                  contentId: 'rule_input_2',
                  normalizedStrSet: ['6']
                }
              }
            }, {
              rule_type: 'FuzzyEquals',
              inputs: {
                x: {
                  contentId: 'rule_input_3',
                  normalizedStrSet: ['7']
                }
              }
            }],
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
      const state = (
        stateObjectFactory.createFromBackendDict(stateName, stateDict));

      expect(
        () => answerClassificationService.getMatchingClassificationResult(
          state.name, state.interaction, '0', null)
      ).toThrowError(
        'No interactionRulesService was available to classify the answer.');
    });

    it('should return the first matching answer group and first matching ' +
        'rule spec', () => {
      const state = (
        stateObjectFactory.createFromBackendDict(stateName, stateDict));

      expect(
        answerClassificationService.getMatchingClassificationResult(
          state.name, state.interaction, '10', textInputRulesService)
      ).toEqual(
        new AnswerClassificationResult(
          outcomeObjectFactory.createNew('outcome 1', 'feedback_1', '', []),
          0, 0,
          ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION));

      expect(
        answerClassificationService.getMatchingClassificationResult(
          state.name, state.interaction, '5', textInputRulesService)
      ).toEqual(
        new AnswerClassificationResult(
          outcomeObjectFactory.createNew('outcome 2', 'feedback_2', '', []),
          1, 0,
          ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION));

      expect(
        answerClassificationService.getMatchingClassificationResult(
          state.name, state.interaction, '6', textInputRulesService)
      ).toEqual(
        new AnswerClassificationResult(
          outcomeObjectFactory.createNew('outcome 2', 'feedback_2', '', []),
          1, 1,
          ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION));
    });

    it('should return the default rule if no answer group matches', () => {
      const state = (
        stateObjectFactory.createFromBackendDict(stateName, stateDict));

      expect(
        answerClassificationService.getMatchingClassificationResult(
          state.name, state.interaction, '777', textInputRulesService)
      ).toEqual(
        new AnswerClassificationResult(
          outcomeObjectFactory.createNew('default', 'default_outcome', '', []),
          2, 0,
          ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION
        )
      );
    });

    it(
      'should fail if no answer group matches and no default rule is ' +
        'provided',
      () => {
        stateDict.interaction.answer_groups = [{
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
            rule_type: 'Equals',
            inputs: {
              x: {
                contentId: 'rule_input_0',
                normalizedStrSet: ['10']
              }
            }
          }],
        }];

        const state = (
          stateObjectFactory.createFromBackendDict(stateName, stateDict));

        expect(
          () => answerClassificationService.getMatchingClassificationResult(
            state.name, state.interaction, '0', null)
        ).toThrowError(
          'No interactionRulesService was available to classify the answer.');
      });
  });

  describe('with string classifier enabled', () => {
    let stateDict;
    let expId = '0';

    beforeEach(() => {
      spyOn(appService, 'isMachineLearningClassificationEnabled')
        .and.returnValue(true);

      let modelJson = {
        KNN: {
          occurrence: 40,
          K: 30,
          T: 20,
          top: 10,
          fingerprint_data: {},
          token_to_id: {}
        },
        SVM: {
          classes: [],
          kernel_params: {
            kernel: 'kernel',
            coef0: 1,
            degree: 2,
            gamma: 3,
          },
          intercept: [],
          n_support: [],
          probA: [],
          support_vectors: [[]],
          probB: [],
          dual_coef: [[]]
        },
        cv_vocabulary: {}
      };
      let textClassifierModel = new TextClassifierFrozenModel();
      // The model_json attribute in TextClassifierFrozenModel class can't be
      // changed to camelcase since the class definition is automatically
      // compiled with the help of protoc.
      textClassifierModel.model_json = JSON.stringify(modelJson);
      let testClassifier = new Classifier(
        'TestClassifier', textClassifierModel.serialize(), 1);

      stateClassifierMappingService.init(expId, 0);
      stateClassifierMappingService.testOnlySetClassifierData(
        stateName, testClassifier);
      predictionAlgorithmRegistryService.testOnlySetPredictionService(
        'TestClassifier', 1, { predict: (classifierData, answer) => 1 });

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
          id: 'TextInput',
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 }
          },
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
              rule_type: 'Equals',
              inputs: {
                x: {
                  contentId: 'rule_input_0',
                  normalizedStrSet: ['10']
                }
              }
            }],
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
            rule_input_translations: {},
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {
                x: {
                  contentId: 'rule_input_1',
                  normalizedStrSet: ['5']
                }
              }
            }, {
              rule_type: 'Equals',
              inputs: {
                x: {
                  contentId: 'rule_input_2',
                  normalizedStrSet: ['7']
                }
              }
            }],
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
        spyOn(
          interactionSpecsService, 'isInteractionTrainable'
        ).and.returnValue(true);

        const state = (
          stateObjectFactory.createFromBackendDict(stateName, stateDict));

        expect(
          answerClassificationService.getMatchingClassificationResult(
            state.name, state.interaction, '0', textInputRulesService)
        ).toEqual(
          new AnswerClassificationResult(
            state.interaction.answerGroups[1].outcome, 1, null,
            ExplorationPlayerConstants.STATISTICAL_CLASSIFICATION));
      });

    it(
      'should return the default rule if no answer group matches and ' +
        'interaction is not trainable',
      () => {
        spyOn(
          interactionSpecsService, 'isInteractionTrainable'
        ).and.returnValue(false);

        const state = (
          stateObjectFactory.createFromBackendDict(stateName, stateDict));

        expect(
          answerClassificationService.getMatchingClassificationResult(
            state.name, state.interaction, '0', textInputRulesService)
        ).toEqual(
          new AnswerClassificationResult(
            outcomeObjectFactory.createNew(
              'default', 'default_outcome', '', []),
            2, 0,
            ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION
          )
        );
      });
  });

  describe('with training data classification', () => {
    let stateDict;
    let expId = '0';

    beforeEach(() => {
      spyOn(
        interactionSpecsService, 'isInteractionTrainable'
      ).and.returnValue(true);
      spyOn(appService, 'isMachineLearningClassificationEnabled')
        .and.returnValue(true);
      stateClassifierMappingService.init(expId, 0);

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
          id: 'TextInput',
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 }
          },
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
              rule_type: 'Equals',
              inputs: {
                x: {
                  contentId: 'rule_input_0',
                  normalizedStrSet: ['equal']
                }
              }
            }],
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
              rule_type: 'Contains',
              inputs: {
                x: {
                  contentId: 'rule_input_5',
                  normalizedStrSet: ['npu']
                }
              }
            }],
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
        const state = (
          stateObjectFactory.createFromBackendDict(stateName, stateDict));

        expect(
          answerClassificationService.getMatchingClassificationResult(
            state.name, state.interaction, 'abc', textInputRulesService)
        ).toEqual(
          new AnswerClassificationResult(
            state.interaction.answerGroups[0].outcome, 0, null,
            ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION));

        expect(
          answerClassificationService.getMatchingClassificationResult(
            state.name, state.interaction, 'xyz', textInputRulesService)
        ).toEqual(
          new AnswerClassificationResult(
            state.interaction.answerGroups[1].outcome, 1, null,
            ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION));
      });

    it(
      'should perform explicit classification before doing training data ' +
        'classification',
      () => {
        const state = (
          stateObjectFactory.createFromBackendDict(stateName, stateDict));

        expect(
          answerClassificationService.getMatchingClassificationResult(
            state.name, state.interaction, 'input', textInputRulesService)
        ).toEqual(
          new AnswerClassificationResult(
            state.interaction.answerGroups[1].outcome, 1, 0,
            ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION));
      });
  });
});
