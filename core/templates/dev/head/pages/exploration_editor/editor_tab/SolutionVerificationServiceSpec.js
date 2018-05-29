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

describe('Solution Verification Service', function() {
  beforeEach(function() {
    module('oppia');
    // Set a global value for INTERACTION_SPECS that will be used by all the
    // descendant dependencies.
    module(function($provide) {
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
    });
  });

  var ess, siis, scas, idc, sof, svs, IS, mockFunctions;
  var rootScope;
  var mockExplorationData;
  var successCallbackSpy, errorCallbackSpy;

  beforeEach(function() {
    mockExplorationData = {
      explorationId: 0,
      autosaveChangeList: function() {}
    };
    module(function($provide) {
      $provide.value('ExplorationDataService', [mockExplorationData][0]);
    });
    spyOn(mockExplorationData, 'autosaveChangeList');
  });

  beforeEach(inject(function($injector) {
    ess = $injector.get('ExplorationStatesService');
    siis = $injector.get('stateInteractionIdService');
    scas = $injector.get('stateCustomizationArgsService');
    idc = $injector.get('InteractionDetailsCacheService');
    sof = $injector.get('SolutionObjectFactory');
    svs = $injector.get('SolutionVerificationService');
    IS = $injector.get('INTERACTION_SPECS');
    rootScope = $injector.get('$rootScope');

    ess.init({
      'First State': {
        content: {
          html: 'First State Content',
          audio_translations: {}
        },
        interaction: {
          id: 'TextInput',
          answer_groups: [{
            outcome: {
              dest: 'End State',
              feedback: {
                html: '',
                audio_translations: {}
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
          default_outcome: {
            dest: 'First State',
            feedback: {
              html: '',
              audio_translations: {}
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null
          },
          hints: [{
            hint_content: 'one'
          }, {
            hint_content: 'two'
          }]
        },
        param_changes: []
      },
      'End State': {
        content: {
          html: '',
          audio_translations: {}
        },
        interaction: {
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [],
            outcome: {
              dest: 'default',
              feedback: {
                html: '',
                audio_translations: {}
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            }
          }],
          default_outcome: {
            dest: 'default',
            feedback: {
              html: '',
              audio_translations: {}
            },
            param_changes: []
          },
          hints: []
        },
        param_changes: []
      }
    });
  }));

  describe('Success case', function() {
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
        svs.verifySolution(0, state,
          ess.getState('First State').interaction.solution.correctAnswer)
      ).toBe(true);
    });
  });

  describe('Failure case', function() {
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
        svs.verifySolution(0, state,
          ess.getState('First State').interaction.solution.correctAnswer)
      ).toBe(false);
    });
  });
});
