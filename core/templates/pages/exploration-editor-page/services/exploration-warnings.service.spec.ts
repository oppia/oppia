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
 * @fileoverview Unit tests for explorationWarningsService.
 */

import { fakeAsync, tick } from '@angular/core/testing';
import { AnswerStats } from 'domain/exploration/answer-stats.model';
import { StateTopAnswersStats } from 'domain/statistics/state-top-answers-stats-object.factory';
import { TestBed } from '@angular/core/testing';
import { ExplorationParamChangesService } from 'pages/exploration-editor-page/services/exploration-param-changes.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ExplorationInitStateNameService } from 'pages/exploration-editor-page/services/exploration-init-state-name.service';
import { ExplorationWarningsService } from './exploration-warnings.service';
import { StateTopAnswersStatsService } from 'services/state-top-answers-stats.service';
import { StateTopAnswersStatsBackendApiService } from 'services/state-top-answers-stats-backend-api.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

 class MockNgbModal {
   open() {
     return {
       result: Promise.resolve()
     };
   }
 }
 class MockExplorationParamChangesService {
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ExplorationParamChangesService,
          useClass: MockExplorationParamChangesService
        },
        ExplorationInitStateNameService,
        ExplorationStatesService,
        StateTopAnswersStatsBackendApiService,
        StateTopAnswersStatsService,
        ExplorationWarningsService
      ]
    });

    explorationInitStateNameService = TestBed.inject(
      ExplorationInitStateNameService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    stateTopAnswersStatsBackendApiService = TestBed.inject(
      StateTopAnswersStatsBackendApiService);
    stateTopAnswersStatsService = TestBed.inject(
      StateTopAnswersStatsService);
    explorationWarningsService = TestBed.inject(ExplorationWarningsService);

    explorationInitStateNameService.init('Hola');
  });

  it('should update warnings with TextInput as interaction id', () => {
    explorationStatesService.init({
      Hola: {
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: true,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: '{{HtmlValue}}'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
        param_changes: [],
        interaction: {
          confirmed_unclassified_answers: [],
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
            },
          }],
          default_outcome: {
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            dest: 'Hola',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'feedback',
              html: 'feedback',
            },
          },
          hints: [],
        },
      }
    }, false);
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
    expect(explorationWarningsService.hasCriticalWarnings()).toBe(true);
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
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: true,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          answer_groups: [
            {
              rule_specs: [],
              training_data: [],
              tagged_skill_misconception_id: null,
              outcome: {
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: '',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
              },
            },
            {
              rule_specs: [],
              training_data: [],
              tagged_skill_misconception_id: null,
              outcome: {
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: '',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
              },
            }],
          default_outcome: {
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            dest: 'Hola',
            dest_if_really_stuck: null,
            feedback: {
              content_id: '',
              html: 'feedback',
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
      }
    }, false);
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
      .toBe(true);
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
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: true,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: '{{HtmlValue}}'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
        param_changes: [],
        interaction: {
          confirmed_unclassified_answers: [],
          solution: null,
          id: null,
          answer_groups: [],
          default_outcome: {
            labelled_as_correct: true,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            dest: 'Hola',
            dest_if_really_stuck: null,
            feedback: {
              content_id: '',
              html: '',
            },
          },
          customization_args: {},
          hints: [],
        },
      }
    }, false);
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
    }]);
    expect(explorationWarningsService.countWarnings()).toBe(3);
    expect(explorationWarningsService.hasCriticalWarnings()).toBe(true);
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
    fakeAsync(() => {
      explorationStatesService.init({
        Hola: {
          classifier_model_id: null,
          solicit_answer_details: false,
          linked_skill_id: null,
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
            confirmed_unclassified_answers: [],
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                content_id: 'content_id',
                html: 'Solution explanation'
              }
            },
            answer_groups: [{
              tagged_skill_misconception_id: null,
              outcome: {
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: '',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_1',
                  html: 'something'
                },
              },
              rule_specs: [],
              training_data: []
            }],
            default_outcome: {
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'Hola',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'something',
                html: 'something',
              },
            },
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              },
              catchMisspellings: {
                value: false
              }
            },
            hints: [],
          },
        }
      }, false);
      explorationWarningsService.updateWarnings();
      tick();

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
      expect(explorationWarningsService.hasCriticalWarnings()).toBe(true);
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
    }));

  it('should update warnings when state top answers stats is initiated',
    fakeAsync(async() => {
      explorationStatesService.init({
        Hola: {
          classifier_model_id: null,
          solicit_answer_details: false,
          card_is_checkpoint: true,
          linked_skill_id: null,
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
            confirmed_unclassified_answers: [],
            customization_args: {
              rows: {
                value: true
              },
              placeholder: {
                value: 1
              },
              catchMisspellings: {
                value: false
              }
            },
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                content_id: 'null',
                html: 'Solution explanation'
              }
            },
            answer_groups: [{
              rule_specs: [],
              training_data: [],
              tagged_skill_misconception_id: null,
              outcome: {
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: '',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
              },
            }],
            default_outcome: {
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'Hola',
              dest_if_really_stuck: null,
              feedback: {
                content_id: '',
                html: 'feedback',
              },
            },
            hints: [],
          },
        }
      }, false);
      spyOn(stateTopAnswersStatsBackendApiService, 'fetchStatsAsync')
        .and.returnValue(Promise.resolve(
          new StateTopAnswersStats(
            { Hola: [new AnswerStats('hola', 'hola', 7, false)] },
            { Hola: 'TextInput' })));
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
      expect(explorationWarningsService.hasCriticalWarnings()).toBe(true);
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
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: true,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: '{{HtmlValue}}'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
          },
        },
        param_changes: [],
        interaction: {
          confirmed_unclassified_answers: [],
          id: 'TextInput',
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              content_id: 'null',
              html: 'Solution explanation'
            }
          },
          answer_groups: [{
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
            },
            rule_specs: [],
            training_data: []
          }],
          default_outcome: {
            labelled_as_correct: true,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            dest: 'State',
            dest_if_really_stuck: null,
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
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      }
    }, false);
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
    expect(explorationWarningsService.hasCriticalWarnings()).toBe(true);
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
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: true,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: '{{HtmlValue}}'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
        param_changes: [],
        interaction: {
          confirmed_unclassified_answers: [],
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              content_id: 'id',
              html: 'Solution explanation'
            }
          },
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
            },
          }],
          default_outcome: {
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            dest: 'Hola',
            dest_if_really_stuck: null,
            feedback: {
              content_id: '',
              html: 'feedback',
            },
          },
          hints: [],
        },
      },
      State: {
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
        param_changes: [],
        interaction: {
          id: 'TextInput',
          confirmed_unclassified_answers: [],
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              content_id: 'id',
              html: 'Solution explanation'
            }
          },
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
            },
          }],
          default_outcome: {
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            dest: 'State',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: 'feedback'
            },
          },
          hints: []
        }
      }
    }, false);
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
    expect(explorationWarningsService.hasCriticalWarnings()).toBe(true);
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
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: '{{HtmlValue}}'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
        param_changes: [],
        interaction: {
          confirmed_unclassified_answers: [],
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
            },
          }],
          default_outcome: {
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            dest: 'Hola',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'feedback',
              html: 'feedback',
            },
          },
          hints: [],
        },
      }
    }, false);

    explorationWarningsService.updateWarnings();
    expect(explorationWarningsService.countWarnings()).toBe(4);
    expect(explorationWarningsService.hasCriticalWarnings()).toBe(true);
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
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: true,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: '{{HtmlValue}}'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
          },
        },
        param_changes: [],
        interaction: {
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
            },
          }],
          default_outcome: {
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            dest: 'End',
            dest_if_really_stuck: null,
            feedback: {
              content_id: '',
              html: 'feedback',
            },
          },
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      End: {
        classifier_model_id: null,
        solicit_answer_details: false,
        card_is_checkpoint: true,
        linked_skill_id: null,
        content: {
          content_id: 'content',
          html: '{{HtmlValue}}'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {},
        },
        param_changes: [],
        interaction: {
          confirmed_unclassified_answers: [],
          customization_args: {
            recommendedExplorationIds: {
              value: []
            }
          },
          solution: null,
          id: 'EndExploration',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            },
          }],
          default_outcome: null,
          hints: [],
        },
      }
    }, false);

    explorationWarningsService.updateWarnings();
    expect(explorationWarningsService.countWarnings()).toBe(5);
    expect(explorationWarningsService.hasCriticalWarnings()).toBe(true);
    expect(explorationWarningsService.getAllStateRelatedWarnings()).toEqual({
      Hola: [
        'Placeholder text must be a string.',
        'Number of rows must be integral.',
      ],
      End: [
        'Please make sure end exploration interactions do not ' +
         'have any Oppia responses.',
        'Checkpoints are not allowed on the last card of the lesson.',
        'Checkpoints must not be assigned to cards that can be bypassed.'
      ]
    });
  });

  it('should show warnings if checkpoint count is more than 8 and' +
     ' bypassable state is made a checkpoint', () => {
    explorationStatesService.init({
      Hola: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          default_outcome: null,
          id: 'TextInput',
          answer_groups: [
            {
              rule_specs: [],
              training_data: [],
              tagged_skill_misconception_id: null,
              outcome: {
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: 'State1',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
              },
            },
            {
              rule_specs: [],
              training_data: [],
              tagged_skill_misconception_id: null,
              outcome: {
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: 'State2',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_2',
                  html: ''
                },
              },
            },
            {
              rule_specs: [],
              training_data: [],
              tagged_skill_misconception_id: null,
              outcome: {
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: 'State3',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_3',
                  html: ''
                },
              },
            }
          ],
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State1: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'State4',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State2: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'State4',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State3: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'State4',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State4: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'State5',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State5: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'State6',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State6: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'State7',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State7: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'End',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      End: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          answer_groups: [{
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            },
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
      }
    }, false);

    explorationWarningsService.updateWarnings();
    expect(explorationWarningsService.countWarnings()).toBe(13);
    expect(explorationWarningsService.hasCriticalWarnings()).toBe(true);
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
           'have any Oppia responses.',
        'Checkpoints are not allowed on the last card of the lesson.',
        'Checkpoints must not be assigned to cards that can be bypassed.'
      ]
    });
  });

  it('should show warnings if learner is directed more than 3 cards' +
     ' back in the exploration', () => {
    explorationStatesService.init({
      Hola: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          default_outcome: null,
          id: 'TextInput',
          answer_groups: [
            {
              rule_specs: [],
              training_data: [],
              tagged_skill_misconception_id: null,
              outcome: {
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: 'State1',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
              },
            },
            {
              rule_specs: [],
              training_data: [],
              tagged_skill_misconception_id: null,
              outcome: {
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest: 'State2',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_2',
                  html: ''
                },
              },
            }
          ],
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State1: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'State3',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State2: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'State5',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State3: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'State4',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State4: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'State6',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State5: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'End',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State6: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'State7',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: {
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
            dest: 'Hola',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'feedback',
              html: 'feedback',
            },
          },
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      State7: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          confirmed_unclassified_answers: [],
          solution: null,
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'End',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }, {
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: 'Hola',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            }
          }],
          default_outcome: null,
          customization_args: {
            rows: {
              value: true
            },
            placeholder: {
              value: 1
            },
            catchMisspellings: {
              value: false
            }
          },
          hints: [],
        },
      },
      End: {
        classifier_model_id: null,
        solicit_answer_details: false,
        linked_skill_id: null,
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
          id: 'EndExploration',
          confirmed_unclassified_answers: [],
          solution: null,
          answer_groups: [{
            tagged_skill_misconception_id: null,
            outcome: {
              labelled_as_correct: true,
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest: '',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: ''
              },
            },
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
      }
    }, false);

    explorationWarningsService.updateWarnings();
    expect(explorationWarningsService.countWarnings()).toBe(12);
    expect(explorationWarningsService.hasCriticalWarnings()).toBe(true);
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
        'Checkpoints must not be assigned to cards that can be bypassed.'
      ],
      State5: [
        'Placeholder text must be a string.',
        'Number of rows must be integral.',
        'Checkpoints must not be assigned to cards that can be bypassed.'
      ],
      State6: [
        'Placeholder text must be a string.',
        'Number of rows must be integral.',
        'Learner should not be directed back by more than' +
          ' 3 cards in the lesson.',
        'Checkpoints must not be assigned to cards that can be bypassed.'
      ],
      State7: [
        'Placeholder text must be a string.',
        'Number of rows must be integral.',
        'Learner should not be directed back by more than' +
          ' 3 cards in the lesson.'
      ],
      End: [
        'Please make sure end exploration interactions do not ' +
           'have any Oppia responses.',
      ]
    });
  });
});
