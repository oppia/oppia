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
  describe('SolutionVerificationService', function() {
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

    var scope, ecs, cls, ess, siis, scas, idc, sof, svs, IS;
    var $httpBackend;
    var mockExplorationData;

    beforeEach(function() {
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {}
      };
      module(function($provide) {
        $provide.value('explorationData', mockExplorationData);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(inject(function($rootScope, $controller, $injector) {
      scope = $rootScope.$new();
      ecs = $injector.get('editorContextService');
      cls = $injector.get('changeListService');
      ess = $injector.get('explorationStatesService');
      siis = $injector.get('stateInteractionIdService');
      scas = $injector.get('stateCustomizationArgsService');
      idc = $injector.get('interactionDetailsCache');
      sof = $injector.get('SolutionObjectFactory');
      svs = $injector.get('SolutionVerificationService');
      IS = $injector.get('INTERACTION_SPECS');
      $httpBackend = $injector.get('$httpBackend');
      scope.stateInteractionIdService = siis;
      scope.stateCustomizationArgsService = scas;
      scope.interactionDetailsCache = idc;

      ess.init({
        'First State': {
          content: {
            html: 'First State Content',
            audio_translations: {}
          },
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              correct: false,
              outcome: {
                dest: 'End State',
                feedback: [],
                param_changes: []
              },
              rule_specs: [{
                inputs: {x: 'abc'},
                rule_type: 'Contains'
              }]
            }],
            default_outcome: {
              dest: 'default',
              feedback: [],
              param_changes: []
            },
            fallbacks: [],
            hints: [{
              hint_text: 'one'
            }, {
              hint_text: 'two'
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
              outcome: {},
              correct: false
            }],
            default_outcome: {
              dest: 'default',
              feedback: [],
              param_changes: []
            },
            fallbacks: [],
            hints: []
          },
          param_changes: []
        }
      });

      var stateEditorCtrl = $controller('StateEditor', {
        $scope: scope,
        editorContextService: ecs,
        changeListService: cls,
        explorationStatesService: ess,
        editabilityService: {
          isEditable: function() {
            return true;
          }
        },
        INTERACTION_SPECS: IS
      });

      var interactionCtrl = $controller('StateInteraction', {
        $scope: scope,
        editorContextService: ecs,
        changeListService: cls,
        explorationStatesService: ess,
        editabilityService: {
          isEditable: function() {
            return true;
          }
        },
        stateInteractionIdService: siis,
        stateCustomizationArgsService: scas,
        interactionDetailsCache: idc,
        INTERACTION_SPECS: IS
      });
    }));

    it('should verify the solution correctly',
      function() {
        ecs.setActiveStateName('First State');
        scope.initStateEditor();

        var state = ess.getState('First State');
        siis.init(
          'First State', state.interaction.id, state.interaction, 'widget_id');
        scas.init(
          'First State', state.interaction.customizationArgs,
          state.interaction, 'widget_customization_args');

        siis.displayed = 'TextInput';
        scope.onCustomizationModalSavePostHook();

        ess.saveSolution('First State', sof.createNew(false, 'abc', 'nothing'));

        svs.verifySolution(0, state,
          ess.getState('First State').interaction.solution.correctAnswer,
          function() {
            ess.updateSolutionValidity('First State', true);
            expect(ess.isSolutionValid('First State')).toBe(true);
          },
          function() {
            ess.updateSolutionValidity('First State', false);
          });

        ess.saveSolution('First State', sof.createNew(false, 'xyz', 'nothing'));

        svs.verifySolution(0, state,
          ess.getState('First State').interaction.solution.correctAnswer,
          function() {
            ess.updateSolutionValidity('First State', true);
          },
          function() {
            ess.updateSolutionValidity('First State', false);
            expect(ess.isSolutionValid('First State')).toBe(false);
          });
      }
    );
  });
});
