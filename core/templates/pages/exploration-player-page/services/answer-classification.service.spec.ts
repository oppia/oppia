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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';

import {AnswerClassificationResult} from '../../../domain/classifier/answer-classification-result.model';
import {
  AnswerClassificationService,
  InteractionRulesService,
} from './answer-classification.service';
import {CamelCaseToHyphensPipe} from '../../../filters/string-utility-filters/camel-case-to-hyphens.pipe';
import {ExplorationPlayerConstants} from '../current-lesson-player/exploration-player-page.constants';
import {InteractionSpecsService} from '../../../services/interaction-specs.service';
import {Outcome} from '../../../domain/exploration/outcome.model';
import {TextInputRuleInputs} from '../../../../../extensions/interactions/rule-input-defs';
import {State, StateBackendDict} from '../../../domain/state/state.model';
import {TextInputRulesService} from '../../../../../extensions/interactions/TextInput/directives/text-input-rules.service';
import {AlertsService} from '../../../services/alerts.service';

describe('Answer Classification Service', () => {
  const stateName = 'Test State';

  let alertsService: AlertsService;
  let answerClassificationService: AnswerClassificationService;
  let interactionSpecsService: InteractionSpecsService;
  let textInputRulesService: InteractionRulesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CamelCaseToHyphensPipe],
    });

    alertsService = TestBed.inject(AlertsService);
    answerClassificationService = TestBed.inject(AnswerClassificationService);
    interactionSpecsService = TestBed.inject(InteractionSpecsService);
    const injectedTextInputRulesService = TestBed.inject(TextInputRulesService);
    textInputRulesService = {
      Equals: (answer, inputs) =>
        injectedTextInputRulesService.Equals(
          answer as string,
          inputs as TextInputRuleInputs
        ),
      FuzzyEquals: (answer, inputs) =>
        injectedTextInputRulesService.FuzzyEquals(
          answer as string,
          inputs as TextInputRuleInputs
        ),
      StartsWith: (answer, inputs) =>
        injectedTextInputRulesService.StartsWith(
          answer as string,
          inputs as TextInputRuleInputs
        ),
      Contains: (answer, inputs) =>
        injectedTextInputRulesService.Contains(
          answer as string,
          inputs as TextInputRuleInputs
        ),
    };
  });

  describe('with string classifier disabled', () => {
    let stateDict: StateBackendDict;

    beforeEach(() => {
      spyOn(interactionSpecsService, 'isInteractionTrainable').and.returnValue(
        false
      );

      stateDict = {
        classifier_model_id: null,
        card_is_checkpoint: false,
        linked_skill_id: null,
        inapplicable_skill_misconception_ids: [],
        content: {
          content_id: 'content',
          html: 'content',
        },
        interaction: {
          confirmed_unclassified_answers: [],
          solution: null,
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
              tagged_skill_misconception_id: null,
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
              tagged_skill_misconception_id: null,
            },
            {
              outcome: {
                dest: 'outcome 2',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_2',
                  html: '',
                },
                labelled_as_correct: true,
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
                      normalizedStrSet: ['correct'],
                    },
                  },
                },
                {
                  rule_type: 'Equals',
                  inputs: {
                    x: {
                      contentId: 'rule_input_2',
                      normalizedStrSet: ['CorrectAnswer'],
                    },
                  },
                },
                {
                  rule_type: 'FuzzyEquals',
                  inputs: {
                    x: {
                      contentId: 'rule_input_3',
                      normalizedStrSet: ['Right'],
                    },
                  },
                },
              ],
              training_data: [],
              tagged_skill_misconception_id: null,
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
        },
        param_changes: [],
        solicit_answer_details: false,
      };
    });

    it('should fail if no frontend rules are provided', () => {
      const state = State.createFromBackendDict(stateName, stateDict);

      expect(() =>
        answerClassificationService.getMatchingClassificationResult(
          state.name as string,
          state.interaction,
          '0',
          // This throws "Argument of type 'null' is not assignable to parameter of type 'InteractionRulesService'.". We need to suppress this error because we need to test the runtime error thrown when interactionRulesService is null.
          // @ts-expect-error
          null
        )
      ).toThrowError(
        'No interactionRulesService was available to classify the answer.'
      );
    });

    it(
      'should return the first matching answer group and first matching ' +
        'rule spec',
      () => {
        const state = State.createFromBackendDict(stateName, stateDict);

        expect(
          answerClassificationService.getMatchingClassificationResult(
            state.name as string,
            state.interaction,
            '10',
            textInputRulesService
          )
        ).toEqual(
          new AnswerClassificationResult(
            Outcome.createNew('outcome 1', 'feedback_1', '', []),
            0,
            0,
            ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION
          )
        );

        expect(
          answerClassificationService.getMatchingClassificationResult(
            state.name as string,
            state.interaction,
            '5',
            textInputRulesService
          )
        ).toEqual(
          new AnswerClassificationResult(
            Outcome.createNew('outcome 2', 'feedback_2', '', []),
            1,
            0,
            ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION
          )
        );

        expect(
          answerClassificationService.getMatchingClassificationResult(
            state.name as string,
            state.interaction,
            '6',
            textInputRulesService
          )
        ).toEqual(
          new AnswerClassificationResult(
            Outcome.createNew('outcome 2', 'feedback_2', '', []),
            1,
            1,
            ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION
          )
        );
      }
    );

    it('should return the default rule if no answer group matches', () => {
      const state = State.createFromBackendDict(stateName, stateDict);

      expect(
        answerClassificationService.getMatchingClassificationResult(
          state.name as string,
          state.interaction,
          '777',
          textInputRulesService
        )
      ).toEqual(
        new AnswerClassificationResult(
          Outcome.createNew('default', 'default_outcome', '', []),
          3,
          0,
          ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION
        )
      );
    });

    it(
      'should fail if no answer group matches and' +
        'default outcome of interaction is not defined',
      () => {
        spyOn(alertsService, 'addWarning').and.callThrough();

        stateDict.interaction.default_outcome = null;
        const state = State.createFromBackendDict(stateName, stateDict);

        expect(() =>
          answerClassificationService.getMatchingClassificationResult(
            state.name as string,
            state.interaction,
            'abc',
            textInputRulesService
          )
        ).toThrowError(
          'No defaultOutcome was available to classify the answer.'
        );

        expect(alertsService.addWarning).toHaveBeenCalledWith(
          'Something went wrong with the exploration.'
        );
      }
    );

    it(
      'should fail if no interaction rules service is provided for ' +
        'classification',
      () => {
        stateDict.interaction.answer_groups = [
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
            tagged_skill_misconception_id: null,
          },
        ];

        const state = State.createFromBackendDict(stateName, stateDict);

        expect(() =>
          answerClassificationService.getMatchingClassificationResult(
            state.name as string,
            state.interaction,
            '0',
            // This throws "Argument of type 'null' is not assignable to parameter of type 'InteractionRulesService'.". We need to suppress this error because we need to test the runtime error thrown when interactionRulesService is null.
            // @ts-expect-error
            null
          )
        ).toThrowError(
          'No interactionRulesService was available to classify the answer.'
        );
      }
    );

    it('should check for misspellings correctly.', () => {
      stateDict.interaction.answer_groups = [
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
                  normalizedStrSet: ['IncorrectAnswer'],
                },
              },
            },
          ],
          training_data: [],
          tagged_skill_misconception_id: null,
        },
        {
          outcome: {
            dest: 'outcome 2',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'feedback_2',
              html: '',
            },
            labelled_as_correct: true,
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
                  normalizedStrSet: ['Answer'],
                },
              },
            },
            {
              rule_type: 'Equals',
              inputs: {
                x: {
                  contentId: 'rule_input_2',
                  normalizedStrSet: ['MaybeCorrect'],
                },
              },
            },
            {
              rule_type: 'FuzzyEquals',
              inputs: {
                x: {
                  contentId: 'rule_input_3',
                  normalizedStrSet: ['FuzzilyCorrect'],
                },
              },
            },
            {
              rule_type: 'Equals',
              inputs: {
                x: {
                  contentId: 'rule_input_short_answer',
                  normalizedStrSet: ['ans'],
                },
              },
            },
          ],
          training_data: [],
          tagged_skill_misconception_id: null,
        },
      ];

      const state = State.createFromBackendDict(stateName, stateDict);

      expect(
        answerClassificationService.isAnswerOnlyMisspelled(
          state.interaction,
          'anSwkp'
        )
      ).toEqual(true);

      expect(
        answerClassificationService.isAnswerOnlyMisspelled(
          state.interaction,
          'anSwer'
        )
      ).toEqual(true);

      expect(
        answerClassificationService.isAnswerOnlyMisspelled(
          state.interaction,
          'fuZZilyCeerect'
        )
      ).toEqual(true);

      expect(
        answerClassificationService.isAnswerOnlyMisspelled(
          state.interaction,
          'InCORrectAnkwpr'
        )
      ).toEqual(false);

      expect(
        answerClassificationService.isAnswerOnlyMisspelled(
          state.interaction,
          'an'
        )
      ).toEqual(false);
    });
  });

  describe('with training data classification', () => {
    let stateDict: StateBackendDict;

    beforeEach(() => {
      spyOn(interactionSpecsService, 'isInteractionTrainable').and.returnValue(
        true
      );

      stateDict = {
        classifier_model_id: null,
        card_is_checkpoint: false,
        linked_skill_id: null,
        inapplicable_skill_misconception_ids: [],
        content: {
          content_id: 'content',
          html: 'content',
        },
        interaction: {
          confirmed_unclassified_answers: [],
          solution: null,
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
              training_data: ['abc', 'input'],
              rule_specs: [
                {
                  rule_type: 'Equals',
                  inputs: {
                    x: {
                      contentId: 'rule_input_0',
                      normalizedStrSet: ['equal'],
                    },
                  },
                },
              ],
              tagged_skill_misconception_id: null,
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
              training_data: ['xyz'],
              rule_specs: [
                {
                  rule_type: 'Contains',
                  inputs: {
                    x: {
                      contentId: 'rule_input_5',
                      normalizedStrSet: ['npu'],
                    },
                  },
                },
              ],
              tagged_skill_misconception_id: null,
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
        },
        param_changes: [],
        solicit_answer_details: false,
      };
    });

    it(
      'should use training data classification if no answer group matches ' +
        'and interaction is trainable',
      () => {
        const state = State.createFromBackendDict(stateName, stateDict);

        expect(
          answerClassificationService.getMatchingClassificationResult(
            state.name as string,
            state.interaction,
            'abc',
            textInputRulesService
          )
        ).toEqual(
          new AnswerClassificationResult(
            state.interaction.answerGroups[0].outcome,
            0,
            null,
            ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION
          )
        );

        expect(
          answerClassificationService.getMatchingClassificationResult(
            state.name as string,
            state.interaction,
            'xyz',
            textInputRulesService
          )
        ).toEqual(
          new AnswerClassificationResult(
            state.interaction.answerGroups[1].outcome,
            1,
            null,
            ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION
          )
        );
      }
    );

    it(
      'should perform explicit classification before doing training data ' +
        'classification',
      () => {
        const state = State.createFromBackendDict(stateName, stateDict);

        expect(
          answerClassificationService.getMatchingClassificationResult(
            state.name as string,
            state.interaction,
            'input',
            textInputRulesService
          )
        ).toEqual(
          new AnswerClassificationResult(
            state.interaction.answerGroups[1].outcome,
            1,
            0,
            ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION
          )
        );
      }
    );

    it(
      'should check whether answer is classified explicitly ' +
        'or goes into new state',
      () => {
        spyOn(
          answerClassificationService,
          'getMatchingClassificationResult'
        ).and.callThrough();

        // Returns false when no answer group matches and
        // default outcome has destination equal to state name.

        if (stateDict.interaction.default_outcome) {
          stateDict.interaction.default_outcome.dest = stateName;
        }
        let state1 = State.createFromBackendDict(stateName, stateDict);

        let res1 =
          answerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
            state1.name as string,
            state1,
            '777',
            textInputRulesService
          );

        expect(res1).toBeFalse();
        expect(
          answerClassificationService.getMatchingClassificationResult
        ).toHaveBeenCalledWith(
          state1.name as string,
          state1.interaction,
          '777',
          textInputRulesService
        );

        // Returns true if any answer group matches.

        if (stateDict.interaction.default_outcome) {
          stateDict.interaction.default_outcome.dest = 'default';
        }
        let state2 = State.createFromBackendDict(stateName, stateDict);

        let res2 =
          answerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
            state2.name as string,
            state2,
            'equal',
            textInputRulesService
          );

        expect(res2).toBeTrue();
        expect(
          answerClassificationService.getMatchingClassificationResult
        ).toHaveBeenCalledWith(
          state2.name as string,
          state2.interaction,
          'equal',
          textInputRulesService
        );
      }
    );
  });
});
