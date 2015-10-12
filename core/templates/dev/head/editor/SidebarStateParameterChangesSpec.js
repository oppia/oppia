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
    var scope, ctrl, ecs, spcs, es, epss, wd;

    beforeEach(function() {
      module('oppia');
    });

    beforeEach(inject(function($rootScope, $controller, $injector) {

      scope = $rootScope.$new();
      ecs = $injector.get('editorContextService');
      spcs = $injector.get('stateParamChangesService');
      es = $injector.get('editabilityService');
      epss = $injector.get('explorationParamSpecsService');
      wd = $injector.get('warningsData');

      GLOBALS.INVALID_PARAMETER_NAMES = ['forbiddenName'];

      epss.init({});
      spcs.init('First State', [], {
        content: [{
          type: 'text',
          value: 'First State Content'
        }],
        interaction: {
          id: 'TextInput',
          answer_groups: [{
            rule_specs: [{
              dest: 'Second State'
            }]
          }]
        },
        param_changes: []
      }, 'param_changes');

      ctrl = $controller('StateParamChangesEditor', {
        $scope: scope,
        editorContextService: ecs,
        stateParamChangesService: spcs,
        editabilityService: es,
        explorationParamSpecsService: epss,
        warningsData: wd
      });
    }));

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

      // Stub out the function that checks validity.
      scope.areDisplayedParamChangesValid = function() {
        return true;
      };

      spcs.displayed = [changeOne, changeTwo];
      scope.saveStateParamChanges();
      expect(spcs.savedMemento[0].customization_args.value)
        .toEqual('something else');
      expect(spcs.savedMemento[1].customization_args.value)
        .toEqual('And now for something completely different');

      spcs.displayed = [changeTwo, changeOne];
      scope.saveStateParamChanges();
      expect(spcs.savedMemento[0].customization_args.value)
        .toEqual('And now for something completely different');
      expect(spcs.savedMemento[1].customization_args.value)
        .toEqual('something else');
    });

    it('should update exploration parameter specs correctly when edits are saved', function() {
      ecs.setActiveStateName('First State');

      var changeOne = {
        name: 'comparison',
        generator_id: 'Copier',
        customization_args: {
          value: 'something else',
          parse_with_jinja: false
        }
      };

      spcs.displayed = [changeOne];
      scope.saveStateParamChanges();
      expect(epss.savedMemento).toEqual({
        comparison: {
          obj_type: 'UnicodeString'
        }
      });
    });
  });
});
