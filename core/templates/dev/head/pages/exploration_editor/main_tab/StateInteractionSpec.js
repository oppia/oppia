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
      IS = $injector.get('INTERACTION_SPECS');
      $httpBackend = $injector.get('$httpBackend');
      scope.stateInteractionIdService = siis;
      scope.stateCustomizationArgsService = scas;
      scope.interactionDetailsCache = idc;

      ess.init({
        'First State': {
          content: [{
            type: 'text',
            value: 'First State Content'
          }],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [{
                dest: 'End State'
              }]
            }]
          },
          param_changes: []
        },
        'End State': {
          content: [{
            type: 'text',
            value: ''
          }],
          interaction: {
            id: 'TextInput',
            answer_groups: [{
              rule_specs: [{
                dest: 'End State'
              }]
            }]
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

    it('should keep non-empty content when setting a terminal interaction',
        function() {
      ecs.setActiveStateName('First State');
      scope.initStateEditor();

      var state = ess.getState('First State');
      siis.init(
        'First State', state.interaction.id, state.interaction, 'widget_id');
      scas.init(
        'First State', state.interaction.customization_args,
        state.interaction, 'widget_customization_args');

      siis.displayed = 'TerminalInteraction';
      scope.onCustomizationModalSavePostHook();

      expect(ess.getState('First State').content[0].value).toEqual(
        'First State Content');
      expect(ess.getState('First State').interaction.id).toEqual(
        'TerminalInteraction');
    });

    it('should change to default text when adding a terminal interaction',
       function() {
      ecs.setActiveStateName('End State');
      scope.initStateEditor();

      var state = ess.getState('End State');
      siis.init(
        'End State', state.interaction.id, state.interaction, 'widget_id');
      scas.init(
        'End State', state.interaction.customization_args,
        state.interaction, 'widget_customization_args');

      siis.displayed = 'TerminalInteraction';
      scope.onCustomizationModalSavePostHook();

      expect(state.content[0].value).toEqual('');
      expect(ess.getState('End State').content[0].value).toEqual(
        'Congratulations, you have finished!');
      expect(ess.getState('End State').interaction.id).toEqual(
        'TerminalInteraction');
    });

    it('should not default text when adding a non-terminal interaction',
        function() {
      ecs.setActiveStateName('End State');
      scope.initStateEditor();

      var state = ess.getState('End State');
      siis.init(
        'End State', state.interaction.id, state.interaction, 'widget_id');
      scas.init(
        'End State', state.interaction.customization_args,
        state.interaction, 'widget_customization_args');

      siis.displayed = 'TextInput';
      scope.onCustomizationModalSavePostHook();

      expect(state.content[0].value).toEqual('');
      expect(ess.getState('End State').content[0].value).toEqual('');
      expect(ess.getState('End State').interaction.id).toEqual('TextInput');
    });
  });
});
