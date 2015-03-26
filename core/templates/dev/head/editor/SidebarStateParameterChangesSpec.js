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
 * @fileoverview Unit tests for the controller of the state parameter changes editor.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('state parameter changes controller', function() {

  describe('StateParameterChangesEditor', function() {
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

      ctrl = $controller('StateParamChangesEditor', {
        $scope: scope,
        editorContextService: ecs,
        changeListService: cls,
        explorationStatesService: ess
      });
    }));

    it('should initialize the state name and related properties', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateParamChangesEditor();
      expect(scope.stateParamChanges[0].customization_args.value)
        .toEqual('something clever');
    });

    it('should save parameter edits correctly', function() {
      ecs.setActiveStateName('First State');

      var changeOne = {
        name: 'comparison',
        generator_id: 'Copier',
        customization_args: {
          value: 'something else',
          parse_with_jinja: false
        }
      };

      var changeTwo = {
        name: 'comparison',
        generator_id: 'Copier',
        customization_args: {
          value: 'And now for something completely different',
          parse_with_jinja: false
        }
      };

      scope.saveStateParamChanges(changeOne, []);
      expect(cls.getChangeList()[0].new_value.customization_args.value)
        .toEqual('something else');

      scope.saveStateParamChanges(changeTwo, changeOne);
      expect(cls.getChangeList()[1].new_value.customization_args.value).toEqual(
        'And now for something completely different'
      );
    });
  });
});
