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
 * @fileoverview Unit tests for the controller of the 'State Editor'.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('App.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/state-name-editor/' +
  'state-name-editor.directive.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/stateful/focus-manager.service.ts');

describe('Sidebar state name controller', function() {
  describe('SidebarStateName', function() {
    var scope, filter, ctrl, ecs, fs, ess, rootScope, outerScope;
    var $httpBackend;
    var mockExplorationData;

    var autosaveDraftUrl = 'createhandler/autosave_draft/0';
    var validAutosaveResponse = {
      is_version_of_draft_valid: true
    };

    beforeEach(angular.mock.module('directiveTemplates'));
    beforeEach(function() {
      angular.mock.module('oppia');
    });
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
        $provide.constant('INVALID_NAME_CHARS', '#@&^%$');
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(angular.mock.inject(function(
        $compile, $filter, $injector, $rootScope, $templateCache) {
      filter = $filter;
      rootScope = $rootScope;
      ecs = $injector.get('StateEditorService');
      fs = $injector.get('FocusManagerService');
      ess = $injector.get('ExplorationStatesService');
      $httpBackend = $injector.get('$httpBackend');

      ess.init({
        'First State': {
          content: {
            content_id: 'content',
            html: 'First State Content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          interaction: {
            answer_groups: [],
            default_outcome: {
              dest: 'Second State',
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
              default_outcome: {}
            }
          },
        },
        'Second State': {
          content: {
            content_id: 'content',
            html: 'Second State Content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          interaction: {
            answer_groups: [],
            default_outcome: {
              dest: 'Second State',
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
              default_outcome: {}
            }
          },
        },
        'Third State': {
          content: {
            content_id: 'content',
            html: 'This is some content.'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {}
            }
          },
          interaction: {
            answer_groups: [],
            default_outcome: {
              dest: 'Second State',
              feedback: {
                content_id: 'default_outcome',
                html: ''
              },
              param_changes: []
            },
            hints: []
          },
          param_changes: [{
            name: 'comparison',
            generator_id: 'Copier',
            customization_args: {
              value: 'something clever',
              parse_with_jinja: false
            }
          }],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
        }
      });

      outerScope = $rootScope.$new();
      var elem = angular.element(
        '<state-name-editor></state-name-editor>');
      var compiledElem = $compile(elem)(outerScope);
      outerScope.$digest();
      scope = compiledElem[0].getControllerScope();
    }));

    it('should correctly normalize whitespace in a state name', function() {
      expect(scope._getNormalizedStateName('   First     State  '))
        .toEqual('First State');
      expect(scope._getNormalizedStateName('Fourth     State       '))
        .toEqual('Fourth State');
      expect(scope._getNormalizedStateName('Fourth State'))
        .toEqual('Fourth State');
      expect(scope._getNormalizedStateName('    ')).toEqual('');
      expect(scope._getNormalizedStateName('Z    ')).toEqual('Z');
      expect(scope._getNormalizedStateName('    .')).toEqual('.');
    });

    it('should not save state names longer than 50 characters', function() {
      expect(
        scope.saveStateName(
          'babababababababababababababababababababababababababab')
      ).toBe(false);
    });

    it('should not save invalid names', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateNameEditor();
      expect(scope.saveStateName('#')).toBe(false);
      expect(ecs.getActiveStateName()).toBe('Third State');
    });

    it('should not save duplicate state names', function() {
      expect(scope.saveStateName('Second State')).toBe(false);
    });

    it('should check that state names are changeable', function() {
      ecs.setActiveStateName('First State');
      scope.initStateNameEditor();
      expect(scope.stateName).toEqual('First State');
      expect(ecs.getActiveStateName()).toEqual('First State');

      scope.saveStateName('Fourth State');
      expect(scope.stateName).toEqual('Fourth State');
      expect(ecs.getActiveStateName()).toEqual('Fourth State');
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);

      scope.saveStateName('Fifth State');
      expect(scope.stateName).toEqual('Fifth State');
      expect(ecs.getActiveStateName()).toEqual('Fifth State');
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should allow state names to be variations of \'END\'', function() {
      ecs.setActiveStateName('First State');
      scope.initStateNameEditor();

      expect(scope.saveStateName('END')).toBe(true);
      expect(scope.saveStateName('enD')).toBe(true);
      expect(scope.saveStateName('end')).toBe(true);
    });

    it('should check that state name edits are independent', function() {
      ecs.setActiveStateName('Third State');
      scope.saveStateName('Fourth State');
      expect(ecs.getActiveStateName()).toEqual('Fourth State');
      expect(ess.getState('Fourth State')).toBeTruthy();
      expect(ess.getState('Third State')).toBeFalsy();

      ecs.setActiveStateName('First State');
      scope.saveStateName('Fifth State');
      expect(ess.getState('Fifth State')).toBeTruthy();
      expect(ess.getState('First State')).toBeFalsy();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should not re-save unedited state names', function() {
      ecs.setActiveStateName('Second State');
      scope.initStateNameEditor();
      scope.openStateNameEditor();
      expect(scope.saveStateName('Second State')).toBe(false);
    });

    it('should not change state name if state name edits fail', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateNameEditor();
      scope.openStateNameEditor();

      // This is not a valid state name.
      scope.saveStateName('#!% State');
      expect(ecs.getActiveStateName()).toEqual('Third State');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();

      // Long state names will not save.
      scope.saveStateName(
        'This state name is too long to be saved. Try to be brief next time.'
      );
      expect(ecs.getActiveStateName()).toEqual('Third State');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();

      // This will not save because it is an already existing state name.
      scope.saveStateName('First State');
      expect(ecs.getActiveStateName()).toEqual('Third State');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();

      // Will not save because the memento is the same as the new state name.
      scope.saveStateName('Third State');
      expect(ecs.getActiveStateName()).toEqual('Third State');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
    });
  });
});
