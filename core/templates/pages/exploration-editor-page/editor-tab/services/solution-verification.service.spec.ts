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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';

require('App.ts');
require('domain/exploration/SolutionObjectFactory.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'solution-verification.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-customization-args.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service.ts');

describe('Solution Verification Service', function() {
  var ess, siis, scas, sof, svs, see;
  var mockExplorationData;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', new AngularNameService());
    $provide.constant('INTERACTION_SPECS', {
      TextInput: {
        display_mode: 'inline',
        is_terminal: false
      },
      TerminalInteraction: {
        display_mode: 'inline',
        is_terminal: true
      }
    });
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(function() {
    mockExplorationData = {
      explorationId: 0,
      autosaveChangeList: function() {}
    };
    angular.mock.module(function($provide) {
      $provide.value('ExplorationDataService', [mockExplorationData][0]);
    });
    spyOn(mockExplorationData, 'autosaveChangeList');
  });

  beforeEach(angular.mock.inject(function($injector) {
    ess = $injector.get('ExplorationStatesService');
    siis = $injector.get('StateInteractionIdService');
    scas = $injector.get('StateCustomizationArgsService');
    sof = $injector.get('SolutionObjectFactory');
    see = $injector.get('StateEditorService');
    svs = $injector.get('SolutionVerificationService');

    ess.init({
      'First State': {
        content: {
          content_id: 'content',
          html: 'First State Content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            hint_1: {},
            hint_2: {}
          }
        },
        interaction: {
          id: 'TextInput',
          answer_groups: [{
            outcome: {
              dest: 'End State',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            rule_specs: [{
              inputs: {x: 'abc'},
              rule_type: 'Contains'
            }]
          }],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 }
          },
          default_outcome: {
            dest: 'First State',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          hints: [{
            hint_content: {
              content_id: 'hint_1',
              html: 'one'
            }
          }, {
            hint_content: {
              content_id: 'hint_2',
              html: 'two'
            }
          }]
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {},
            hint_1: {},
            hint_2: {}
          }
        }
      },
      'End State': {
        content: {
          content_id: 'content',
          html: ''
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
            rule_specs: [],
            outcome: {
              dest: 'default',
              feedback: {
                content_id: 'feedback_1',
                html: ''
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            }
          }],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: ''
              }
            },
            rows: { value: 1 }
          },
          default_outcome: {
            dest: 'default',
            feedback: {
              content_id: 'default_outcome',
              html: ''
            },
            param_changes: []
          },
          hints: []
        },
        param_changes: [],
        solicit_answer_details: false,
        written_translations: {
          translations_mapping: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          }
        }
      }
    });
  }));

  it('should verify a correct solution', function() {
    var state = ess.getState('First State');
    siis.init(
      'First State', state.interaction.id, state.interaction, 'widget_id');
    scas.init(
      'First State', state.interaction.customizationArgs,
      state.interaction, 'widget_customization_args');

    siis.savedMemento = 'TextInput';
    ess.saveSolution('First State', sof.createNew(false, 'abc', 'nothing'));

    expect(
      svs.verifySolution('First State', state.interaction,
        ess.getState('First State').interaction.solution.correctAnswer)
    ).toBe(true);

    see.setInQuestionMode(true);
    state.interaction.answerGroups[0].outcome.dest = 'First State';
    state.interaction.answerGroups[0].outcome.labelledAsCorrect = true;
    expect(
      svs.verifySolution('First State', state.interaction,
        ess.getState('First State').interaction.solution.correctAnswer)
    ).toBe(true);
  });

  it('should verify an incorrect solution', function() {
    var state = ess.getState('First State');
    siis.init(
      'First State', state.interaction.id, state.interaction, 'widget_id');
    scas.init(
      'First State', state.interaction.customizationArgs,
      state.interaction, 'widget_customization_args');

    siis.savedMemento = 'TextInput';
    ess.saveSolution('First State', sof.createNew(false, 'xyz', 'nothing'));

    expect(
      svs.verifySolution('First State', state.interaction,
        ess.getState('First State').interaction.solution.correctAnswer)
    ).toBe(false);
  });
});
