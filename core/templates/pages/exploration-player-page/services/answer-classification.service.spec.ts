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

import { AnswerClassificationResult } from 'domain/classifier/answer-classification-result.model';
import { AnswerClassificationService, InteractionRulesService } from 'pages/exploration-player-page/services/answer-classification.service';
import { AppService } from 'services/app.service';
import { CamelCaseToHyphensPipe } from 'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { Classifier } from 'domain/classifier/classifier.model';
import { ExplorationPlayerConstants } from 'pages/exploration-player-page/exploration-player-page.constants';
import { InteractionSpecsService } from 'services/interaction-specs.service';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { PredictionAlgorithmRegistryService } from 'pages/exploration-player-page/services/prediction-algorithm-registry.service';
import { StateClassifierMappingService } from 'pages/exploration-player-page/services/state-classifier-mapping.service';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { TextClassifierFrozenModel } from 'classifiers/proto/text_classifier';
import { TextInputRulesService } from 'interactions/TextInput/directives/text-input-rules.service';
import { AlertsService } from 'services/alerts.service';
import { TextInputPredictionService } from 'interactions/TextInput/text-input-prediction.service';

describe('Answer Classification Service', () => {
  const stateName = 'Test State';

  let alertsService: AlertsService;
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

    alertsService = TestBed.inject(AlertsService);
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
            rows: { value: 1 },
            catchMisspellings: {
              value: false
            }
          },
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              dest_if_really_stuck: null,
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
              dest_if_really_stuck: null,
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
          }, {
            outcome: {
              dest: 'outcome 2',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {
                x: {
                  contentId: 'rule_input_1',
                  normalizedStrSet: ['correct']
                }
              }
            }, {
              rule_type: 'Equals',
              inputs: {
                x: {
                  contentId: 'rule_input_2',
                  normalizedStrSet: ['CorrectAnswer']
                }
              }
            }, {
              rule_type: 'FuzzyEquals',
              inputs: {
                x: {
                  contentId: 'rule_input_3',
                  normalizedStrSet: ['Right']
                }
              }
            }],
          }],
          default_outcome: {
            dest: 'default',
            dest_if_really_stuck: null,
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
        solicit_answer_details: false
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
          3, 0,
          ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION
        )
      );
    });

    it('should fail if no answer group matches and' +
    'default outcome of interaction is not defined', () => {
      spyOn(alertsService, 'addWarning').and.callThrough();

      stateDict.interaction.default_outcome = null;
      const state = (
        stateObjectFactory.createFromBackendDict(stateName, stateDict));

      expect(
        () => answerClassificationService.getMatchingClassificationResult(
          state.name, state.interaction, 'abc', textInputRulesService)
      ).toThrowError(
        'No defaultOutcome was available to classify the answer.');

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Something went wrong with the exploration.');
    });

    it(
      'should fail if no answer group matches and no default rule is ' +
        'provided',
      () => {
        stateDict.interaction.answer_groups = [{
          outcome: {
            dest: 'outcome 1',
            dest_if_really_stuck: null,
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

    it('should check for misspellings correctly.', () => {
      stateDict.interaction.answer_groups = [{
        outcome: {
          dest: 'outcome 1',
          dest_if_really_stuck: null,
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
              normalizedStrSet: ['IncorrectAnswer']
            }
          }
        }],
      }, {
        outcome: {
          dest: 'outcome 2',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'feedback_2',
            html: ''
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        rule_specs: [{
          rule_type: 'Equals',
          inputs: {
            x: {
              contentId: 'rule_input_1',
              normalizedStrSet: ['Answer']
            }
          }
        }, {
          rule_type: 'Equals',
          inputs: {
            x: {
              contentId: 'rule_input_2',
              normalizedStrSet: ['MaybeCorrect']
            }
          }
        }, {
          rule_type: 'FuzzyEquals',
          inputs: {
            x: {
              contentId: 'rule_input_3',
              normalizedStrSet: ['FuzzilyCorrect']
            }
          }
        }, {
          rule_type: 'Equals',
          inputs: {
            x: {
              contentId: 'rule_input_short_answer',
              normalizedStrSet: ['ans']
            }
          }
        }],
      }];

      const state = (
        stateObjectFactory.createFromBackendDict(stateName, stateDict));

      expect(answerClassificationService.isAnswerOnlyMisspelled(
        state.interaction, 'anSwkp')).toEqual(true);

      expect(answerClassificationService.isAnswerOnlyMisspelled(
        state.interaction, 'anSwer')).toEqual(true);

      expect(answerClassificationService.isAnswerOnlyMisspelled(
        state.interaction, 'fuZZilyCeerect')).toEqual(true);

      expect(answerClassificationService.isAnswerOnlyMisspelled(
        state.interaction, 'InCORrectAnkwpr')).toEqual(false);

      expect(answerClassificationService.isAnswerOnlyMisspelled(
        state.interaction, 'an')).toEqual(false);
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
        'TestClassifier', 1,
        {
          predict: (classifierData, answer) => 1
        } as TextInputPredictionService
      );

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
            rows: { value: 1 },
            catchMisspellings: {
              value: false
            }
          },
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              dest_if_really_stuck: null,
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
              dest_if_really_stuck: null,
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
            dest_if_really_stuck: null,
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
      };
    });

    it('should query the prediction service if no answer group matches and ' +
        'interaction is trainable', () => {
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

    it('should get default rule if the answer group can not be predicted',
      () => {
        spyOn(
          predictionAlgorithmRegistryService, 'getPredictionService'
        ).and.returnValue({
          predict: (classifierData, answer) => -1
        } as TextInputPredictionService);

        const state = (
          stateObjectFactory.createFromBackendDict(stateName, stateDict));

        expect(
          answerClassificationService.getMatchingClassificationResult(
            state.name, state.interaction, '0', textInputRulesService)
        ).toEqual(
          new AnswerClassificationResult(
            outcomeObjectFactory.createNew(
              'default', 'default_outcome', '', []), 2, 0,
            ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION));
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
            rows: { value: 1 },
            catchMisspellings: {
              value: false
            }
          },
          answer_groups: [{
            outcome: {
              dest: 'outcome 1',
              dest_if_really_stuck: null,
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
              dest_if_really_stuck: null,
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
            dest_if_really_stuck: null,
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

    it('should check whether answer is classified explicitly ' +
        'or goes into new state', () => {
      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.callThrough();

      // Returns false when no answer group matches and
      // default outcome has destination equal to state name.

      stateDict.interaction.default_outcome.dest = stateName;
      let state1 = (
        stateObjectFactory.createFromBackendDict(stateName, stateDict));

      let res1 = (
        answerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
          state1.name, state1, '777', textInputRulesService));

      expect(res1).toBeFalse();
      expect(
        answerClassificationService.getMatchingClassificationResult
      ).toHaveBeenCalledWith(
        state1.name, state1.interaction, '777', textInputRulesService);

      // Returns true if any answer group matches.

      stateDict.interaction.default_outcome.dest = 'default';
      let state2 = (
        stateObjectFactory.createFromBackendDict(stateName, stateDict));

      let res2 = (
        answerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
          state2.name, state2, 'equal', textInputRulesService));

      expect(res2).toBeTrue();
      expect(
        answerClassificationService.getMatchingClassificationResult
      ).toHaveBeenCalledWith(
        state2.name, state2.interaction, 'equal', textInputRulesService);
    });
  });
});
