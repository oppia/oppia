// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the controller of 'State Interactions'.
 */

describe('State Interaction controller', function() {
  describe('StateInteraction', function() {
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

    var scope, ecs, cls, ess, siis, scas, idc, IS;
    var $httpBackend;
    var mockExplorationData;

    beforeEach(function() {
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {}
      };
      module(function($provide) {
        $provide.value('ExplorationDataService', mockExplorationData);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(inject(function($rootScope, $controller, $injector) {
      scope = $rootScope.$new();
      ecs = $injector.get('EditorStateService');
      cls = $injector.get('ChangeListService');
      ess = $injector.get('explorationStatesService');
      siis = $injector.get('stateInteractionIdService');
      scas = $injector.get('stateCustomizationArgsService');
      idc = $injector.get('InteractionDetailsCacheService');
      IS = $injector.get('INTERACTION_SPECS');
      $httpBackend = $injector.get('$httpBackend');
      scope.stateInteractionIdService = siis;
      scope.stateCustomizationArgsService = scas;
      scope.InteractionDetailsCacheService = idc;

      ess.init({
        'First State': {
          content: {
            html: 'First State Content',
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
              },
            }],
            default_outcome: {
              dest: 'default',
              feedback: {
                html: '',
                audio_translations: {}
              },
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: []
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
              labelled_as_correct: false,
              param_changes: [],
              refresher_exploration_id: null
            },
            hints: []
          },
          param_changes: []
        }
      });

      var stateEditorCtrl = $controller('StateEditor', {
        $scope: scope,
        EditorStateService: ecs,
        ChangeListService: cls,
        explorationStatesService: ess,
        EditabilityService: {
          isEditable: function() {
            return true;
          }
        },
        INTERACTION_SPECS: IS
      });

      var interactionCtrl = $controller('StateInteraction', {
        $scope: scope,
        EditorStateService: ecs,
        ChangeListService: cls,
        explorationStatesService: ess,
        EditabilityService: {
          isEditable: function() {
            return true;
          }
        },
        stateInteractionIdService: siis,
        stateCustomizationArgsService: scas,
        InteractionDetailsCacheService: idc,
        INTERACTION_SPECS: IS
      });
    }));

    it('should keep non-empty content when setting a terminal interaction',
      function() {
        ecs.setActiveStateName('First State');
        scope.initStateEditor();

        var state = ess.getState('First State');
        siis.init(
          'First State', state.interaction.id, state.interaction, 'widget_id');
        scas.init(
          'First State', state.interaction.customizationArgs,
          state.interaction, 'widget_customization_args');

        siis.displayed = 'TerminalInteraction';
        scope.onCustomizationModalSavePostHook();

        expect(ess.getState('First State').content.getHtml()).toEqual(
          'First State Content');
        expect(ess.getState('First State').interaction.id).toEqual(
          'TerminalInteraction');
      }
    );

    it('should change to default text when adding a terminal interaction',
      function() {
        ecs.setActiveStateName('End State');
        scope.initStateEditor();

        var state = ess.getState('End State');
        siis.init(
          'End State', state.interaction.id, state.interaction, 'widget_id');
        scas.init(
          'End State', state.interaction.customizationArgs,
          state.interaction, 'widget_customization_args');

        siis.displayed = 'TerminalInteraction';
        scope.onCustomizationModalSavePostHook();

        expect(state.content.getHtml()).toEqual('');
        expect(ess.getState('End State').content.getHtml()).toEqual(
          'Congratulations, you have finished!');
        expect(ess.getState('End State').interaction.id).toEqual(
          'TerminalInteraction');
      }
    );

    it('should not default text when adding a non-terminal interaction',
      function() {
        ecs.setActiveStateName('End State');
        scope.initStateEditor();

        var state = ess.getState('End State');
        siis.init(
          'End State', state.interaction.id, state.interaction, 'widget_id');
        scas.init(
          'End State', state.interaction.customizationArgs,
          state.interaction, 'widget_customization_args');

        siis.displayed = 'TextInput';
        scope.onCustomizationModalSavePostHook();

        expect(state.content.getHtml()).toEqual('');
        expect(ess.getState('End State').content.getHtml()).toEqual('');
        expect(ess.getState('End State').interaction.id).toEqual('TextInput');
      }
    );
  });
});
