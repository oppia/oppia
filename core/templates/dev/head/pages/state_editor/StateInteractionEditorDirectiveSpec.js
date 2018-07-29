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

    beforeEach(module('directiveTemplates'));
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

    beforeEach(inject(function(
        $compile, $controller, $injector, $rootScope, $templateCache) {
      scope = $rootScope.$new();
      ecs = $injector.get('EditorStateService');
      cls = $injector.get('ChangeListService');
      ess = $injector.get('ExplorationStatesService');
      siis = $injector.get('StateInteractionIdService');
      scas = $injector.get('StateCustomizationArgsService');
      idc = $injector.get('InteractionDetailsCacheService');
      IS = $injector.get('INTERACTION_SPECS');
      $httpBackend = $injector.get('$httpBackend');
      scope.StateInteractionIdService = siis;
      scope.StateCustomizationArgsService = scas;
      scope.InteractionDetailsCacheService = idc;

      ess.init({
        'First State': {
          content: {
            content_id: 'content',
            html: 'First State Content'
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {},
            feedback_1: {}
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
              },
            }],
            default_outcome: {
              dest: 'default',
              feedback: {
                content_id: 'default_outcome',
                html: ''
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
            content_id: 'content',
            html: ''
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {},
            feedback_1: {}
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
            default_outcome: {
              dest: 'default',
              feedback: {
                content_id: 'default_outcome',
                html: ''
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

      var stateEditorCtrl = $controller('ExplorationEditorTab', {
        $scope: scope,
        EditorStateService: ecs,
        ChangeListService: cls,
        ExplorationStatesService: ess,
        EditabilityService: {
          isEditable: function() {
            return true;
          }
        },
        INTERACTION_SPECS: IS
      });

      var templateHtml = $templateCache.get(
        '/pages/exploration_editor/editor_tab/' +
        'state_interaction_editor_directive.html');
      $compile(templateHtml, $rootScope);
      $rootScope.$digest();

      outerScope = $rootScope.$new();
      outerScope.saveStateContent = jasmine.createSpy('saveStateContent');
      outerScope.saveInteractionId = jasmine.createSpy('saveInteractionId');
      outerScope.recomputeGraph = jasmine.createSpy('createGraph');
      outerScope.saveInteractionCustomizationArgs =
        jasmine.createSpy('saveInteractionCustomizationArgs');
      var elem = angular.element(
        '<state-interaction-editor on-save-state-content="saveStateContent" ' +
        'on-save-interaction-id="saveInteractionId" ' +
        'on-save-interaction-customization-args=' +
        '"saveInteractionCustomizationArgs" ' +
        'recompute-graph="recomputeGraph">' +
        '</state-interaction-editor>');
      var compiledElem = $compile(elem)(outerScope);
      outerScope.$digest();
      directiveScope = compiledElem[0].getControllerScope();
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
        directiveScope.onCustomizationModalSavePostHook();

        expect(outerScope.saveInteractionId).toHaveBeenCalled();
        expect(outerScope.saveInteractionCustomizationArgs).toHaveBeenCalled();
        expect(outerScope.recomputeGraph).toHaveBeenCalled();
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
        directiveScope.onCustomizationModalSavePostHook();

        expect(outerScope.saveInteractionId).toHaveBeenCalled();
        expect(outerScope.saveInteractionCustomizationArgs).toHaveBeenCalled();
        expect(outerScope.recomputeGraph).toHaveBeenCalled();
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
        directiveScope.onCustomizationModalSavePostHook();

        expect(outerScope.saveInteractionCustomizationArgs).toHaveBeenCalled();
        expect(outerScope.recomputeGraph).toHaveBeenCalled();
      }
    );
  });
});
