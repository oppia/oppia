// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Solution Verification Service.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {StateCustomizationArgsService} from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {Interaction} from 'domain/exploration/InteractionObjectFactory';
import {SolutionObjectFactory} from 'domain/exploration/SolutionObjectFactory';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {SolutionVerificationService} from 'pages/exploration-editor-page/editor-tab/services/solution-verification.service';
import {ExplorationDataService} from 'pages/exploration-editor-page/services/exploration-data.service';
import {importAllAngularServices} from 'tests/unit-test-utils.ajs';

require('pages/exploration-editor-page/services/exploration-states.service.ts');

describe('Solution Verification Service', () => {
  let ess, siis, scas, sof, svs, see;
  let mockInteractionState;
  importAllAngularServices();

  beforeEach(
    angular.mock.module('oppia', function ($provide) {
      $provide.value('NgbModal', {
        open: () => {
          return {
            result: Promise.resolve(),
          };
        },
      });
    })
  );
  beforeEach(() => {
    mockInteractionState = {
      TextInput: {
        display_mode: 'inline',
        is_terminal: false,
      },
      TerminalInteraction: {
        display_mode: 'inline',
        is_terminal: true,
      },
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: INTERACTION_SPECS,
          useValue: mockInteractionState,
        },
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: 0,
            autosaveChangeListAsync() {
              return;
            },
          },
        },
      ],
    });

    siis = TestBed.get(StateInteractionIdService);
    scas = TestBed.get(StateCustomizationArgsService);
    sof = TestBed.get(SolutionObjectFactory);
    see = TestBed.get(StateEditorService);
    svs = TestBed.get(SolutionVerificationService);
  });

  // TODO(#11149): Replace $injector.get(...) to TestBed.get in following
  // block when ExplorationStateService has been migrated to Angular 8.
  beforeEach(
    angular.mock.inject(function ($injector) {
      ess = $injector.get('ExplorationStatesService');
      ess.init({
        'First State': {
          content: {
            content_id: 'content',
            html: 'First State Content',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
              hint_1: {},
              hint_2: {},
            },
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [
              {
                outcome: {
                  dest: 'End State',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feedback_1',
                    html: '',
                  },
                  labelled_as_correct: false,
                  param_changes: [],
                  refresher_exploration_id: null,
                },
                rule_specs: [
                  {
                    rule_type: 'Contains',
                    inputs: {
                      x: {
                        contentId: 'rule_input',
                        normalizedStrSet: ['abc'],
                      },
                    },
                  },
                ],
              },
            ],
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
            default_outcome: {
              dest: 'First State',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'default_outcome',
                html: '',
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null,
            },
            hints: [
              {
                hint_content: {
                  content_id: 'hint_1',
                  html: 'one',
                },
              },
              {
                hint_content: {
                  content_id: 'hint_2',
                  html: 'two',
                },
              },
            ],
          },
          param_changes: [],
          solicit_answer_details: false,
        },
        'End State': {
          content: {
            content_id: 'content',
            html: '',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {},
            },
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [
              {
                rule_specs: [],
                outcome: {
                  dest: 'default',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'feedback_1',
                    html: '',
                  },
                  labelled_as_correct: false,
                  param_changes: [],
                  refresher_exploration_id: null,
                },
              },
            ],
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
            default_outcome: {
              dest: 'default',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'default_outcome',
                html: '',
              },
              param_changes: [],
            },
            hints: [],
          },
          param_changes: [],
          solicit_answer_details: false,
        },
      });
    })
  );

  it('should verify a correct solution', () => {
    var state = ess.getState('First State');
    siis.init(
      'First State',
      state.interaction.id,
      state.interaction,
      'widget_id'
    );
    scas.init(
      'First State',
      state.interaction.customizationArgs,
      state.interaction,
      'widget_customization_args'
    );

    siis.savedMemento = 'TextInput';
    ess.saveSolution('First State', sof.createNew(false, 'abc', 'nothing'));

    expect(
      svs.verifySolution(
        'First State',
        state.interaction,
        ess.getState('First State').interaction.solution.correctAnswer
      )
    ).toBe(true);

    see.setInQuestionMode(true);
    state.interaction.answerGroups[0].outcome.dest = 'First State';
    state.interaction.answerGroups[0].outcome.labelledAsCorrect = true;
    expect(
      svs.verifySolution(
        'First State',
        state.interaction,
        ess.getState('First State').interaction.solution.correctAnswer
      )
    ).toBe(true);
  });

  it('should verify an incorrect solution', () => {
    var state = ess.getState('First State');
    siis.init(
      'First State',
      state.interaction.id,
      state.interaction,
      'widget_id'
    );
    scas.init(
      'First State',
      state.interaction.customizationArgs,
      state.interaction,
      'widget_customization_args'
    );

    siis.savedMemento = 'TextInput';
    ess.saveSolution('First State', sof.createNew(false, 'xyz', 'nothing'));

    expect(
      svs.verifySolution(
        'First State',
        state.interaction,
        ess.getState('First State').interaction.solution.correctAnswer
      )
    ).toBe(false);
  });

  it("should throw an error if Interaction's id is null", () => {
    const interaction = new Interaction(
      [],
      [],
      {
        choices: {
          value: [new SubtitledHtml('This is a choice', '')],
        },
      },
      null,
      [],
      null,
      null
    );

    expect(() => {
      svs.verifySolution('State 1', interaction, 'Answer');
    }).toThrowError('Interaction ID must not be null');
  });
});
