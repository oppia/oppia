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
    var scope, filter, ctrl, explorationData,
        mockWarningsData, q, cls, ecs, vs, fs, ess;

    beforeEach(function() {
      module('oppia');
    });

    beforeEach(inject(function($rootScope, $q, $filter, $controller, $injector) {

      scope = $rootScope.$new();
      filter = $filter;
      q = $q;
      ecs = $injector.get('editorContextService');
      cls = $injector.get('changeListService');
      vs = $injector.get('validatorsService');
      fs = $injector.get('focusService');
      ess = $injector.get('explorationStatesService');

      GLOBALS = {INVALID_NAME_CHARS: '#@&^%$'};

      mockWarningsData = {
        addWarning: function(warning) {}
      };
      spyOn(mockWarningsData, 'addWarning');

      mockExplorationData = {
        data: {
          param_changes: []
        },
        getData: function() {
          var deferred = q.defer();
          deferred.resolve(mockExplorationData.data);
          return deferred.promise;
        }
      };

      ess.setStates({
        'First State': {
          widget: {
            handlers: [{
              rule_specs: [{
                dest: null
              }]
            }]
          },
          param_changes: []
        },
        'Second State': {
          widget: {
            handlers: [{
              rule_specs: [{
                dest: null
              }]
            }]
          },
          param_changes: []
        },
        'Third State': {
          widget: {
            handlers: [{
              rule_specs: [{
                dest: null
              }]
            }]
          },
          content: [{
            type: 'text',
            value: 'This is some content.'
          }],
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
        $filter: filter,
        $q: q,
        warningsData: mockWarningsData,
        explorationData: mockExplorationData,
        editorContextService: ecs,
        changeListService: cls,
        validatorsService: vs,
        focusService: fs,
        explorationStatesService: ess,
        editabilityService: {
          isEditable: function() {
            return true;
          }
        }        
      });
    }));

    it('should initialize the state name and related properties', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateEditor();
      expect(scope.contentMemento).toBeNull();
      expect(scope.content[0].value).toEqual('This is some content.');
      expect(scope.stateParamChanges[0].customization_args.value)
        .toEqual('something clever');
    });

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
      scope.initStateEditor();
      expect(scope.saveStateName('#')).toBe(false);
      expect(vs.isValidEntityName('#', true)).toBe(false);
      expect(scope.saveStateName('END')).toBe(false);
      expect(scope.saveStateName('enD')).toBe(false);
      expect(scope.saveStateName('end')).toBe(false);
      expect(ecs.getActiveStateName()).toBe('Third State');
    });

    it('should not save duplicate state names', function() {
      expect(scope.saveStateName('Second State')).toBe(false);
    });

    it('should check that state names are changeable', function() {
      ecs.setActiveStateName('First State');
      scope.initStateEditor();
      expect(scope.stateName).toEqual('First State');
      expect(ecs.getActiveStateName()).toEqual('First State');

      scope.saveStateName('Fourth State');
      expect(scope.stateName).toEqual('Fourth State');
      expect(ecs.getActiveStateName()).toEqual('Fourth State');

      scope.saveStateName('Fifth State');
      expect(scope.stateName).toEqual('Fifth State');
      expect(ecs.getActiveStateName()).toEqual('Fifth State');
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
    });

    it('should not re-save unedited state names', function() {
      ecs.setActiveStateName('Second State');
      scope.initStateEditor();
      scope.openStateNameEditor();
      expect(scope.saveStateName('Second State')).toBe(false);
    });

    it('should not change state name if state name edits fail', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateEditor();
      scope.openStateNameEditor();

      // This is not a valid state name.
      scope.saveStateName('#!% State');
      expect(ecs.getActiveStateName()).toEqual('Third State');

      // Long states name will not save.
      scope.saveStateName(
        'This state name is too long to be saved. Try to be brief next time.'
      );
      expect(ecs.getActiveStateName()).toEqual('Third State');

      // This will not save because it is an already existing state name.
      scope.saveStateName('First State');
      expect(ecs.getActiveStateName()).toEqual('Third State');

      // Will not save because the memento is the same as the new state name.
      scope.saveStateName('Third State');
      expect(ecs.getActiveStateName()).toEqual('Third State');
    });

    it('should correctly handle no-op edits', function() {
      ecs.setActiveStateName('First State');
      scope.initStateEditor();
      expect(scope.contentMemento).toBeNull();
      expect(scope.content).toEqual([]);
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
