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
 * @fileoverview Unit tests for ExplorationWarningsService.
 */

import { fakeAsync, TestBed } from '@angular/core/testing';
import { AnswerStats } from 'domain/exploration/answer-stats.model';
import { StateTopAnswersStats } from 'domain/statistics/state-top-answers-stats-object.factory';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';
import { ExplorationWarningsService } from './exploration-warnings.service';
import { ExplorationStatesService } from './exploration-states.service';
import { ExplorationInitStateNameService } from './exploration-init-state-name.service';
import { StateTopAnswersStatsService } from 'services/state-top-answers-stats.service';
import { StateTopAnswersStatsBackendApiService } from 'services/state-top-answers-stats-backend-api.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExplorationParamChangesService } from './exploration-param-changes.service';
import { TextInputValidationService } from 'interactions/TextInput/directives/text-input-validation.service';
import { ContinueValidationService } from 'interactions/Continue/directives/continue-validation.service';

class MockExplorationParamChanges {
  savedMemento = [{
    customizationArgs: {
      parse_with_jinja: false,
      value: '5'
    },
    generatorId: 'Copier',
    name: 'ParamChange1'
  }, {
    customizationArgs: {
      parse_with_jinja: true,
      value: '{{ParamChange2}}'
    },
    generatorId: 'Copier',
  }, {
    customizationArgs: {
      parse_with_jinja: true,
      value: '5'
    },
    generatorId: 'RandomSelector',
    name: 'ParamChange3'
  }];
}

describe('Exploration Warnings Service', () => {
  let explorationInitStateNameService: ExplorationInitStateNameService;
  let explorationWarningsService: ExplorationWarningsService;
  let explorationStatesService: ExplorationStatesService;
  let stateTopAnswersStatsService: StateTopAnswersStatsService;
  let stateTopAnswersStatsBackendApiService:
   StateTopAnswersStatsBackendApiService;
  let textInputValidationService: TextInputValidationService;
  let continueValidationService: ContinueValidationService;

  describe('when exploration param changes has jinja values', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          {
            provide: ExplorationParamChangesService,
            useClass: MockExplorationParamChanges
          }
          ,
          TextInputValidationService,
          ContinueValidationService
        ]
      });
      explorationInitStateNameService = TestBed.inject(
        ExplorationInitStateNameService);
      explorationWarningsService = TestBed.inject(ExplorationWarningsService);
      explorationStatesService = TestBed.inject(ExplorationStatesService);
      stateTopAnswersStatsBackendApiService = TestBed.inject(
        StateTopAnswersStatsBackendApiService);
      stateTopAnswersStatsService = TestBed.inject(
        StateTopAnswersStatsService);
      textInputValidationService = TestBed.inject(TextInputValidationService);
      continueValidationService = TestBed.inject(ContinueValidationService);
      spyOn(textInputValidationService, 'getCustomizationArgsWarnings')
        .and.returnValue([]);
      spyOn(continueValidationService, 'getCustomizationArgsWarnings')
        .and.returnValue([]);
      explorationInitStateNameService.init('Hola');
    });

    it('should update warnings with TextInput as interaction id', () => {
      explorationStatesService.init({
        Hola: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: {
              dest: 'Hola',
              feedback: {
                content_id: '',
                html: '',
              },
            },
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        }
      });
      explorationWarningsService.updateWarnings();

      expect(explorationWarningsService.getWarnings()).toEqual([{
        type: 'critical',
        message: 'Please ensure the value of parameter "ParamChange2" is' +
        ' set before it is referred to in the initial list of parameter' +
        ' changes.'
      }, {
        type: 'critical',
        message: 'Please ensure the value of parameter "HtmlValue" is set' +
        ' before using it in "Hola".'
      }, {
        type: 'error',
        message: 'The following card has errors: Hola.'
      }, {
        type: 'error',
        message: 'In \'Hola\', the following answer group has a classifier' +
        ' with no training data: 0'
      }]);
      expect(explorationWarningsService.hasCriticalWarnings()).toBeTrue();
      expect(explorationWarningsService.countWarnings()).toBe(4);
      expect(explorationWarningsService.getAllStateRelatedWarnings()).toEqual({
        Hola: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
          'There\'s no way to complete the exploration starting from this' +
          ' card. To fix this, make sure that the last card in the chain' +
          ' starting from this one has an \'End Exploration\' question type.'
        ]
      });
    });

    it('should update warnings with Continue as interaction id', () => {
      explorationStatesService.init({
        Hola: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'Continue',
            answer_groups: [{
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }, {
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: {
              dest: 'Hola',
              feedback: {
                content_id: '',
                html: '',
              },
            },
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              },
              buttonText: {
                value: {
                  unicode_str: '',
                  content_id: ''
                }
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        }
      });
      explorationWarningsService.updateWarnings();

      expect(explorationWarningsService.getWarnings()).toEqual([{
        type: 'critical',
        message: 'Please ensure the value of parameter "ParamChange2" is set' +
        ' before it is referred to in the initial list of parameter changes.'
      }, {
        type: 'critical',
        message: 'Please ensure the value of parameter "HtmlValue" is set' +
        ' before using it in "Hola".'
      }, {
        type: 'error',
        message: 'The following card has errors: Hola.'
      }, {
        type: 'error',
        message: 'In \'Hola\', the following answer groups have classifiers' +
        ' with no training data: 0, 1'
      }]);
      expect(explorationWarningsService.countWarnings()).toBe(4);
      expect(explorationWarningsService.hasCriticalWarnings())
        .toBeTrue();
      expect(explorationWarningsService.getAllStateRelatedWarnings()).toEqual({
        Hola: [
          'The button text should not be empty.',
          'Only the default outcome is necessary for a continue interaction.',
          'There\'s no way to complete the exploration starting from this' +
          ' card. To fix this, make sure that the last card in the chain' +
          ' starting from this one has an \'End Exploration\' question type.'
        ]
      });
    });

    it('should update warnings when no interaction id is provided', () => {
      explorationStatesService.init({
        Hola: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: null,
            answer_groups: [{
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: {
              dest: 'Hola',
              feedback: {
                content_id: '',
                html: '',
              },
            },
            customization_args: {},
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        }
      });
      explorationWarningsService.updateWarnings();

      expect(explorationWarningsService.getWarnings()).toEqual([{
        type: 'critical',
        message: 'Please ensure the value of parameter "ParamChange2" is set' +
        ' before it is referred to in the initial list of parameter changes.'
      }, {
        type: 'critical',
        message: 'Please ensure the value of parameter "HtmlValue" is set' +
        ' before using it in "Hola".'
      }, {
        type: 'error',
        message: 'The following card has errors: Hola.'
      }, {
        type: 'error',
        message: 'In \'Hola\', the following answer group has a classifier' +
        ' with no training data: 0'
      }]);
      expect(explorationWarningsService.countWarnings()).toBe(4);
      expect(explorationWarningsService.hasCriticalWarnings()).toBeTrue();
      expect(explorationWarningsService.getAllStateRelatedWarnings()).toEqual({
        Hola: [
          'Please add an interaction to this card.',
          'There\'s no way to complete the exploration starting from this' +
          ' card. To fix this, make sure that the last card in the chain' +
          ' starting from this one has an \'End Exploration\' question type.'
        ]
      });
    });

    it('should update warnings when there is a solution in the interaction',
      () => {
        explorationStatesService.init({
          Hola: {
            card_is_checkpoint: true,
            content: {
              content_id: 'content',
              html: '{{HtmlValue}}'
            },
            recorded_voiceovers: {
              voiceovers_mapping: {},
            },
            param_changes: [],
            interaction: {
              id: 'TextInput',
              solution: {
                correct_answer: 'This is the correct answer',
                answer_is_exclusive: false,
                explanation: {
                  html: 'Solution explanation'
                }
              },
              answer_groups: [{
                outcome: {
                  dest: '',
                  feedback: {
                    content_id: 'feedback_1',
                    html: ''
                  },
                  labelled_as_correct: true,
                  param_changes: [],
                  refresher_exploration_id: 'a',
                  missing_prerequisite_skill_id: 'abc'
                },
                tagged_skill_misconception_id: null,
                rule_specs: [],
                training_data: []
              }],
              default_outcome: {
                dest: 'Hola',
                feedback: {
                  content_id: '',
                  html: '',
                },
              },
              customization_args: {
                rows: {
                  value: true
                },
                placeholder: {
                  value: 1
                }
              },
              hints: [],
            },
            written_translations: {
              translations_mapping: {
                content: {},
                default_outcome: {},
              },
            },
          }
        });
        explorationWarningsService.updateWarnings();

        expect(explorationWarningsService.getWarnings()).toEqual([{
          type: 'critical',
          message: 'Please ensure the value of parameter "ParamChange2"' +
          ' is set before it is referred to in the initial list of' +
          ' parameter changes.'
        }, {
          type: 'critical',
          message: 'Please ensure the value of parameter "HtmlValue" is set' +
          ' before using it in "Hola".'
        }, {
          type: 'error',
          message: 'The following card has errors: Hola.'
        }, {
          type: 'error',
          message: 'In \'Hola\', the following answer group has a classifier' +
          ' with no training data: 0'
        }]);
        expect(explorationWarningsService.countWarnings()).toBe(4);
        expect(explorationWarningsService.hasCriticalWarnings()).toBeTrue();
        expect(explorationWarningsService.getAllStateRelatedWarnings())
          .toEqual({
            Hola: [
              'Placeholder text must be a string.',
              'Number of rows must be integral.',
              'The current solution does not lead to another card.',
              'There\'s no way to complete the exploration starting from' +
              ' this card. To fix this, make sure that the last card in' +
              ' the chain starting from this one has an \'End Exploration\'' +
              ' question type.'
            ]
          });
      });

    it('should update warnings when state top answers stats is initiated',
      fakeAsync(async() => {
        explorationStatesService.init({
          Hola: {
            card_is_checkpoint: true,
            content: {
              content_id: 'content',
              html: '{{HtmlValue}}'
            },
            recorded_voiceovers: {
              voiceovers_mapping: {},
            },
            param_changes: [],
            interaction: {
              id: 'TextInput',
              solution: {
                correct_answer: 'This is the correct answer',
                answer_is_exclusive: false,
                explanation: {
                  html: 'Solution explanation'
                }
              },
              answer_groups: [{
                outcome: {
                  dest: '',
                  feedback: {
                    content_id: 'feedback_1',
                    html: ''
                  },
                  labelled_as_correct: true,
                  param_changes: [],
                  refresher_exploration_id: 'a',
                  missing_prerequisite_skill_id: 'abc'
                },
                tagged_skill_misconception_id: null,
                rule_specs: [],
                training_data: []
              }],
              default_outcome: {
                dest: 'Hola',
                feedback: {
                  content_id: '',
                  html: '',
                },
              },
              customization_args: {
                rows: {
                  value: true
                },
                placeholder: {
                  value: 1
                }
              },
              hints: [],
            },
            written_translations: {
              translations_mapping: {
                content: {},
                default_outcome: {},
              },
            },
          }
        });
        spyOn(stateTopAnswersStatsBackendApiService, 'fetchStatsAsync')
          .and.returnValue(Promise.resolve(
            new StateTopAnswersStats(
              {Hola: [new AnswerStats('hola', 'hola', 7, false)]},
              {Hola: 'TextInput'})));
        await stateTopAnswersStatsService.initAsync(
          'expId', explorationStatesService.getStates());

        explorationWarningsService.updateWarnings();

        expect(explorationWarningsService.getWarnings()).toEqual([{
          type: 'critical',
          message: 'Please ensure the value of parameter "ParamChange2" is' +
          ' set before it is referred to in the initial list of parameter' +
          ' changes.'
        }, {
          type: 'critical',
          message: 'Please ensure the value of parameter "HtmlValue" is set' +
          ' before using it in "Hola".'
        }, {
          type: 'error',
          message: 'The following card has errors: Hola.'
        }, {
          type: 'error',
          message: 'In \'Hola\', the following answer group has a classifier' +
          ' with no training data: 0'
        }]);
        expect(explorationWarningsService.countWarnings()).toBe(4);
        expect(explorationWarningsService.hasCriticalWarnings()).toBeTrue();
        expect(explorationWarningsService.getAllStateRelatedWarnings())
          .toEqual({
            Hola: [
              'Placeholder text must be a string.',
              'Number of rows must be integral.',
              'There is an answer among the top 10 which has no explicit' +
              ' feedback.',
              'The current solution does not lead to another card.',
              'There\'s no way to complete the exploration starting from' +
              ' this card. To fix this, make sure that the last card in' +
              ' the chain starting from this one has an \'End Exploration\'' +
              ' question type.'
            ]
          });
      }));

    it('should update warnings when state name is not equal to the default' +
    ' outcome destination', () => {
      explorationStatesService.init({
        Hola: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                html: 'Solution explanation'
              }
            },
            answer_groups: [{
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: {
              dest: 'State',
              feedback: {
                content_id: '',
                html: '',
              },
            },
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        }
      });
      explorationWarningsService.updateWarnings();

      expect(explorationWarningsService.getWarnings()).toEqual([{
        type: 'critical',
        message: 'Please ensure the value of parameter "ParamChange2" is set' +
        ' before it is referred to in the initial list of parameter changes.'
      }, {
        type: 'critical',
        message: 'Please ensure the value of parameter "HtmlValue" is set' +
        ' before using it in "Hola".'
      }, {
        type: 'error',
        message: 'The following card has errors: Hola.'
      }, {
        type: 'error',
        message: 'In \'Hola\', the following answer group has a classifier' +
        ' with no training data: 0'
      }]);
      expect(explorationWarningsService.countWarnings()).toBe(4);
      expect(explorationWarningsService.hasCriticalWarnings()).toBeTrue();
      expect(explorationWarningsService.getAllStateRelatedWarnings()).toEqual({
        Hola: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
          'There\'s no way to complete the exploration starting from this' +
          ' card. To fix this, make sure that the last card in the chain' +
          ' starting from this one has an \'End Exploration\' question type.'
        ]
      });
    });

    it('should update warnings when there are two states but only one saved' +
    ' memento value', () => {
      explorationStatesService.init({
        Hola: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                html: 'Solution explanation'
              }
            },
            answer_groups: [{
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: {
              dest: 'Hola',
              feedback: {
                content_id: '',
                html: '',
              },
            },
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        },
        State: {
          card_is_checkpoint: false,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                html: 'Solution explanation'
              }
            },
            answer_groups: [{
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: {
              dest: 'State',
              feedback: {
                content_id: '',
                html: '',
              },
            },
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        }
      });
      explorationWarningsService.updateWarnings();

      expect(explorationWarningsService.getWarnings()).toEqual([{
        type: 'critical',
        message: 'Please ensure the value of parameter "ParamChange2" is set' +
        ' before it is referred to in the initial list of parameter changes.'
      }, {
        type: 'critical',
        message: 'Please ensure the value of parameter "HtmlValue" is set' +
        ' before using it in "Hola".'
      }, {
        type: 'error',
        message: 'The following cards have errors: Hola, State.'
      }, {
        type: 'error',
        message: 'In \'Hola\', the following answer group has a classifier' +
        ' with no training data: 0'
      }, {
        type: 'error',
        message: 'In \'State\', the following answer group has a classifier' +
        ' with no training data: 0'
      }]);
      expect(explorationWarningsService.countWarnings()).toBe(5);
      expect(explorationWarningsService.hasCriticalWarnings()).toBeTrue();
      expect(explorationWarningsService.getAllStateRelatedWarnings()).toEqual({
        Hola: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
          'The current solution does not lead to another card.',
        ],
        State: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
          'The current solution does not lead to another card.',
          'This card is unreachable.'
        ]
      });
    });

    it('should update warning when first card is not a checkpoint', () => {
      explorationStatesService.init({
        Hola: {
          card_is_checkpoint: false,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: {
              dest: 'Hola',
              feedback: {
                content_id: '',
                html: '',
              },
            },
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        }
      });

      explorationWarningsService.updateWarnings();
      expect(explorationWarningsService.countWarnings()).toBe(4);
      expect(explorationWarningsService.hasCriticalWarnings()).toBeTrue();
      expect(explorationWarningsService.getAllStateRelatedWarnings()).toEqual({
        Hola: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
          'There\'s no way to complete the exploration starting from this' +
          ' card. To fix this, make sure that the last card in the chain' +
          ' starting from this one has an \'End Exploration\' question type.',
          'The first card of the lesson must be a checkpoint.'
        ]
      });
    });

    it('should show warning if terminal card is a checkpoint', () => {
      explorationStatesService.init({
        Hola: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: {
              dest: 'End',
              feedback: {
                content_id: '',
                html: '',
              },
            },
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        },
        End: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'EndExploration',
            answer_groups: [{
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_2',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: null,
            customization_args: {
              recommendedExplorationIds: {
                value: []
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        }
      });

      explorationWarningsService.updateWarnings();
      expect(explorationWarningsService.countWarnings()).toBe(5);
      expect(explorationWarningsService.hasCriticalWarnings()).toBeTrue();
      expect(explorationWarningsService.getAllStateRelatedWarnings()).toEqual({
        Hola: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
        ],
        End: [
          'Please make sure end exploration interactions do not ' +
          'have any answer groups.',
          'Checkpoints are not allowed on the last card of the lesson.',
          'Checkpoints must not be assigned to cards that can be bypassed.'
        ]
      });
    });

    it('should show warnings if checkpoint count is more than 8 and' +
      ' bypassable state is made a checkpoint', () => {
      explorationStatesService.init({
        Hola: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            answer_groups: [
              {
                outcome: {
                  dest: 'State1',
                  feedback: {
                    content_id: 'feedback_1',
                    html: ''
                  },
                  labelled_as_correct: true,
                  param_changes: [],
                  refresher_exploration_id: 'a',
                  missing_prerequisite_skill_id: 'abc'
                },
                tagged_skill_misconception_id: null,
                rule_specs: [],
                training_data: []
              },
              {
                outcome: {
                  dest: 'State2',
                  feedback: {
                    content_id: 'feedback_2',
                    html: ''
                  },
                  labelled_as_correct: true,
                  param_changes: [],
                  refresher_exploration_id: 'a',
                  missing_prerequisite_skill_id: 'abc'
                },
                tagged_skill_misconception_id: null,
                rule_specs: [],
                training_data: []
              },
              {
                outcome: {
                  dest: 'State3',
                  feedback: {
                    content_id: 'feedback_3',
                    html: ''
                  },
                  labelled_as_correct: true,
                  param_changes: [],
                  refresher_exploration_id: 'a',
                  missing_prerequisite_skill_id: 'abc'
                },
                tagged_skill_misconception_id: null,
                rule_specs: [],
                training_data: []
              }
            ],
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        },
        State1: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              outcome: {
                dest: 'State4',
                feedback: {
                  content_id: 'feedback_2',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: null,
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        },
        State2: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              outcome: {
                dest: 'State4',
                feedback: {
                  content_id: 'feedback_2',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: null,
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        },
        State3: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              outcome: {
                dest: 'State4',
                feedback: {
                  content_id: 'feedback_2',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: null,
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
            confirmed_unclassified_answers: [],
            solution: {
              answer_is_exclusive: true,
              correct_answer: '10',
              explanation: {
                html: 'placeholder value',
                content_id: ''
              }
            }
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        },
        State4: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              outcome: {
                dest: 'State5',
                feedback: {
                  content_id: 'feedback_2',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: null,
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
            confirmed_unclassified_answers: [],
            solution: {
              answer_is_exclusive: true,
              correct_answer: '10',
              explanation: {
                html: 'placeholder value',
                content_id: ''
              }
            }
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        },
        State5: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              outcome: {
                dest: 'State6',
                feedback: {
                  content_id: 'feedback_2',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: null,
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
            confirmed_unclassified_answers: [],
            solution: {
              answer_is_exclusive: true,
              correct_answer: '10',
              explanation: {
                html: 'placeholder value',
                content_id: ''
              }
            }
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        },
        State6: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              outcome: {
                dest: 'State7',
                feedback: {
                  content_id: 'feedback_2',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: null,
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
            confirmed_unclassified_answers: [],
            solution: {
              answer_is_exclusive: true,
              correct_answer: '10',
              explanation: {
                html: 'placeholder value',
                content_id: ''
              }
            }
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        },
        State7: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              outcome: {
                dest: 'End',
                feedback: {
                  content_id: 'feedback_2',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: null,
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        },
        End: {
          card_is_checkpoint: true,
          content: {
            content_id: 'content',
            html: '{{HtmlValue}}'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'EndExploration',
            answer_groups: [{
              outcome: {
                dest: '',
                feedback: {
                  content_id: 'feedback_2',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: 'a',
                missing_prerequisite_skill_id: 'abc'
              },
              tagged_skill_misconception_id: null,
              rule_specs: [],
              training_data: []
            }],
            default_outcome: null,
            customization_args: {
              recommendedExplorationIds: {
                value: []
              }
            },
            confirmed_unclassified_answers: [],
            solution: {
              answer_is_exclusive: true,
              correct_answer: '10',
              explanation: {
                html: 'placeholder value',
                content_id: ''
              }
            },
            hints: [],
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
        }
      });

      explorationWarningsService.updateWarnings();
      expect(explorationWarningsService.countWarnings()).toBe(13);
      expect(explorationWarningsService.hasCriticalWarnings()).toBeTrue();
      expect(explorationWarningsService.getCheckpointCountWarning()).toEqual(
        'Only a maximum of 8 checkpoints are allowed per lesson.');
      expect(explorationWarningsService.getAllStateRelatedWarnings()).toEqual({
        Hola: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
        ],
        State1: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
          'Checkpoints must not be assigned to cards that can be bypassed.'
        ],
        State2: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
          'Checkpoints must not be assigned to cards that can be bypassed.'
        ],
        State3: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
          'Checkpoints must not be assigned to cards that can be bypassed.'
        ],
        State4: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
        ],
        State5: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
        ],
        State6: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
        ],
        State7: [
          'Placeholder text must be a string.',
          'Number of rows must be integral.',
        ],
        End: [
          'Please make sure end exploration interactions do not ' +
          'have any answer groups.',
          'Checkpoints are not allowed on the last card of the lesson.',
          'Checkpoints must not be assigned to cards that can be bypassed.'
        ]
      });
    });
  });

  class MockExplorationInitStateNameService {
    savedMemento = 'Hola';
  }

  class MockExplorationParamChangesService {
    savedMemento = [{
      customizationArgs: {
        parse_with_jinja: true,
        value: ''
      },
      generatorId: 'Copier',
    }];
  }

  describe('when exploration param changes has no jinja values', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          {
            provide: ExplorationParamChangesService,
            useClass: MockExplorationParamChangesService
          },
          {
            provide: ExplorationInitStateNameService,
            useClass: MockExplorationInitStateNameService
          },
          TextInputValidationService,
          ContinueValidationService
        ]
      });
      explorationWarningsService = TestBed.inject(ExplorationWarningsService);
      explorationStatesService = TestBed.inject(ExplorationStatesService);
    });

    it('should update warning to an empty array', () => {
      explorationStatesService.init({
        Hola: {
          content: {
            content_id: 'content',
            html: ''
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
          },
          param_changes: [],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              outcome: {
                dest: 'State',
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: false,
                missing_prerequisite_skill_id: null,
                refresher_exploration_id: null,
                param_changes: []
              },
              rule_specs: [{
                rule_type: 'Equals',
                inputs: {x: {
                  contentId: 'rule_input',
                  normalizedStrSet: ['10']
                }}
              }],
              training_data: ['1'],
              tagged_skill_misconception_id: null
            }],
            default_outcome: {
              dest: '',
              feedback: {
                content_id: '',
                html: '',
              },
              labelled_as_correct: false,
              missing_prerequisite_skill_id: null,
              refresher_exploration_id: null,
              param_changes: []
            },
            customization_args: {
              rows: {
                value: 1
              },
              placeholder: {
                value: {
                  unicode_str: 'placeholder value',
                  content_id: ''
                }
              }
            },
            hints: [],
            confirmed_unclassified_answers: [],
            solution: {
              answer_is_exclusive: true,
              correct_answer: '10',
              explanation: {
                html: 'placeholder value',
                unicode_str: 'placeholder value',
                content_id: ''
              }
            }
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
            },
          },
          classifier_model_id: null,
          solicit_answer_details: false,
          linked_skill_id: null,
          card_is_checkpoint: false,
          next_content_id_index: null,
        },
        State: {
          param_changes: [],
          content: {
            content_id: '',
            html: ''
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          interaction: {
            id: 'EndExploration',
            default_outcome: null,
            confirmed_unclassified_answers: [],
            customization_args: {
              recommendedExplorationIds: {
                value: []
              }
            },
            solution: null,
            answer_groups: [],
            hints: []
          },
          solicit_answer_details: false,
          card_is_checkpoint: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          classifier_model_id: null,
          linked_skill_id: null,
          next_content_id_index: null
        }
      } as StateObjectsBackendDict);
      explorationWarningsService.updateWarnings();

      expect(explorationWarningsService.getWarnings()).toEqual([]);
      expect(explorationWarningsService.getAllStateRelatedWarnings()).toEqual(
        {});
    });
  });
});
