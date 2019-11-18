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

// TODO(#7222): Remove the following block of unnnecessary imports once
// state-interaction-editor.directive.ts is upgraded to Angular 8.
import { ExplorationFeaturesService } from
  'services/exploration-features.service';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require(
  'pages/exploration-editor-page/editor-tab/' +
  'exploration-editor-tab.directive.ts');

require('pages/exploration-editor-page/services/change-list.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'interaction-details-cache.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-content.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-customization-args.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service.ts');

describe('State Interaction controller', function() {
  describe('StateInteraction', function() {
    beforeEach(function() {
      angular.mock.module('oppia');
      angular.mock.module(function($provide) {
        $provide.value(
          'ExplorationFeaturesService', new ExplorationFeaturesService());
      });
      // Set a global value for INTERACTION_SPECS that will be used by all the
      // descendant dependencies.
      angular.mock.module(function($provide) {
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
    beforeEach(angular.mock.module('oppia', function($provide) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    }));

    var scope, ecs, cls, ess, siis, scas, scs, idc, IS;
    var $httpBackend;
    var mockExplorationData;
    var outerScope, directiveScope;
    var $componentController;
    var stateEditorCtrl;

    beforeEach(angular.mock.module('directiveTemplates'));
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

    beforeEach(angular.mock.inject(function(
        _$componentController_, $compile, $controller, $injector, $rootScope,
        $templateCache) {
      $componentController = _$componentController_;
      scope = $rootScope.$new();
      ecs = $injector.get('StateEditorService');
      cls = $injector.get('ChangeListService');
      ess = $injector.get('ExplorationStatesService');
      siis = $injector.get('StateInteractionIdService');
      scs = $injector.get('StateContentService');
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
          param_changes: [],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
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

      stateEditorCtrl = $componentController('explorationEditorTab', {
        StateEditorService: ecs,
        ChangeListService: cls,
        ExplorationStatesService: ess,
        EditabilityService: {
          isEditable: function() {
            return true;
          }
        },
        INTERACTION_SPECS: IS
      }, {});

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
        stateEditorCtrl.initStateEditor();

        var state = ess.getState('First State');
        scs.init('First State', state.content);
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
        stateEditorCtrl.initStateEditor();

        var state = ess.getState('End State');
        scs.init('End State', state.content);
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
        stateEditorCtrl.initStateEditor();

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
