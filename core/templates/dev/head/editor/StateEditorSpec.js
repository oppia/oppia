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
 *
 * @author wagnerdmike@gmail.com (Michael Wagner)
 */

describe('State Editor controller', function() {

  describe('StateEditor', function() {
    var scope, ctrl, ecs, cls, ess;

    beforeEach(function() {
      module('oppia');
    });

    beforeEach(inject(function($rootScope, $controller, $injector) {

      scope = $rootScope.$new();
      ecs = $injector.get('editorContextService');
      cls = $injector.get('changeListService');
      ess = $injector.get('explorationStatesService');

      GLOBALS.INVALID_NAME_CHARS = '#@&^%$';

      ess.setStates({
        'First State': {
          content: [{
            type: 'text',
            value: 'First State Content'
          }],
          interaction: {
            id: 'TextInput',
            handlers: [{
              rule_specs: [{
                dest: 'Second State'
              }]
            }]
          },
          param_changes: []
        },
        'Second State': {
          content: [{
            type: 'text',
            value: 'Second State Content'
          }],
          interaction: {
            id: 'TextInput',
            handlers: [{
              rule_specs: [{
                dest: 'Second State'
              }]
            }]
          },
          param_changes: []
        },
        'Third State': {
          content: [{
            type: 'text',
            value: 'This is some content.'
          }],
          interaction: {
            id: 'TextInput',
            handlers: [{
              rule_specs: [{
                dest: 'Second State'
              }]
            }]
          },
          param_changes: [{
            name: 'comparison',
            generator_id: 'Copier',
            customization_args: {
              value: 'something clever',
              parse_with_jinja: false
            }
          }]
        }
      });

      scope.getContent = function(contentString) {
        return [{type: 'text', value: contentString}];
      };

      ctrl = $controller('StateEditor', {
        $scope: scope,
        editorContextService: ecs,
        changeListService: cls,
        explorationStatesService: ess,
        editabilityService: {
          isEditable: function() {
            return true;
          }
        },
        INTERACTION_SPECS: {
          TextInput: {
            display_mode: 'inline',
            is_terminal: false
          }
        }
      });
    }));

    it('should initialize the state name and related properties', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateEditor();
      expect(scope.contentMemento).toBeNull();
      expect(scope.content[0].value).toEqual('This is some content.');
    });

    it('should correctly handle no-op edits', function() {
      ecs.setActiveStateName('First State');
      scope.initStateEditor();
      expect(scope.contentMemento).toBeNull();
      expect(scope.content).toEqual(scope.getContent('First State Content'));
      scope.content = scope.getContent(
        'And now for something completely different.'
      );
      scope.openStateContentEditor();
      expect(scope.contentMemento[0].value)
        .toEqual('And now for something completely different.');
      scope.saveTextContent();
      expect(scope.contentMemento).toEqual(null);
      expect(cls.getChangeList()).toEqual([]);
    });

    it('should check that content edits are saved correctly',
       function() {
      ecs.setActiveStateName('Third State');
      expect(cls.getChangeList()).toEqual([]);
      scope.content = scope.getContent('abababab');
      scope.openStateContentEditor();
      scope.content = scope.getContent('babababa');
      scope.saveTextContent();
      expect(cls.getChangeList().length).toBe(1);
      expect(cls.getChangeList()[0].new_value[0].value).toEqual('babababa');
      expect(cls.getChangeList()[0].old_value[0].value).toEqual('abababab');

      scope.openStateContentEditor();
      scope.content = scope.getContent(
        'And now for something completely different.'
      );
      scope.saveTextContent();
      expect(cls.getChangeList().length).toBe(2);
      expect(cls.getChangeList()[1].new_value[0].value)
        .toEqual('And now for something completely different.');
      expect(cls.getChangeList()[1].old_value[0].value).toEqual('babababa');
    });

    it('should not re-save unedited content', function() {
      ecs.setActiveStateName('Second State');
      scope.initStateEditor();
      expect(cls.getChangeList()).toEqual([]);
      expect(scope.contentMemento).toBeNull();
      scope.content = scope.getContent('Eroica');
      scope.saveTextContent();
      expect(cls.getChangeList()).toEqual([]);
    });

    it('should not save any changes to content when an edit is cancelled',
       function() {
      ecs.setActiveStateName('Third State');
      scope.initStateEditor();
      var contentBeforeEdit = angular.copy(scope.content);
      scope.content = scope.getContent('Test Content');
      scope.cancelEdit();
      expect(scope.contentMemento).toBeNull();
      expect(scope.content).toEqual(contentBeforeEdit);
    });
  });
});
