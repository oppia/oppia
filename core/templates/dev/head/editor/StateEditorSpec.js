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
        mockWarningsData, q, cls, ecs, vs, fs;

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

      GLOBALS = {INVALID_NAME_CHARS: '#@&^%$'};

      // Without this added, saveStateName
      // cannot check for an initStateName property.
      scope.$parent.$parent = {};

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

      scope.$parent.states = {
        'First State': {
          widget: {
            handlers: [{
              rule_specs: [{
                dest: null
              }]
            }]
          }
        },
        'Second State': {
          widget: {
            handlers: [{
              rule_specs: [{
                dest: null
              }]
            }]
          }
        },
        'Third State': {
          widget: {
            handlers: [{
              rule_specs: [{
                dest: null
              }]
            }]
          },
          content: ['This is some content.'],
          param_changes: ['Add state', 'Changed content']
        }
      };

      scope.refreshGraph = function() {
        return true;
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
        focusService: fs
      });
    }));

    it('should initialize the state name and related properties', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateEditor();
      expect(scope.contentMemento).toBeNull();
      expect(scope.content).toEqual(['This is some content.']);
      expect(scope.stateParamChanges).toEqual(['Add state', 'Changed content']);
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
      expect(mockWarningsData.addWarning)
        .toHaveBeenCalledWith(
          'State names should be at most 50 characters long.'
        );
    });

    it('should not save invalid names', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateEditor();
      expect(scope.saveStateName('#')).toBe(false);
      expect(vs.isValidEntityName('#', true)).toBe(false);
      expect(ecs.getActiveStateName()).toBe('Third State');
    });

    it('should not save duplicate state names', function() {
      expect(scope.saveStateName('Second State')).toBe(false);
      expect(mockWarningsData.addWarning)
        .toHaveBeenCalledWith("The name 'Second State' is already in use.");
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
      expect(scope.$parent.states.hasOwnProperty('Fourth State')).toBe(true);
      expect(scope.$parent.states.hasOwnProperty('Third State')).toBe(false);

      ecs.setActiveStateName('First State');
      scope.saveStateName('Fifth State');
      expect(scope.$parent.states.hasOwnProperty('Fifth State')).toBe(true);
      expect(scope.$parent.states.hasOwnProperty('First State')).toBe(false);
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

      scope.saveStateName('#!% State');
      expect(ecs.getActiveStateName()).toEqual('Third State');

      scope.saveStateName(
        'This state name is too long to be saved. Try to be brief next time.'
      );
      expect(ecs.getActiveStateName()).toEqual('Third State');

      scope.saveStateName('First State');
      expect(ecs.getActiveStateName()).toEqual('Third State');

      scope.saveStateName('Third State');
      expect(ecs.getActiveStateName()).toEqual('Third State');
    });

    it('should edit content correctly', function() {
      ecs.setActiveStateName('Third State');
      scope.initStateEditor();
      expect(scope.contentMemento).toBeNull();
      scope.content = ['The quick brown fox jumped over the lazy dogs'];
      scope.editContent();
      expect(scope.contentMemento)
        .toEqual(['The quick brown fox jumped over the lazy dogs']);
    });

    it('should save content correctly', function() {
      ecs.setActiveStateName('First State');
      scope.initStateEditor();
      expect(scope.contentMemento).toBeNull();
      expect(scope.content).toEqual([]);
      scope.content = ['And now for something completely different.'];
      scope.editContent();
      expect(scope.contentMemento)
        .toEqual(['And now for something completely different.']);
      scope.saveTextContent();
      expect(scope.contentMemento).toEqual(null);
      expect(cls.getChangeList()).not.toEqual([]);
    });


    it('should check that content edits are saved correctly',
       function() {
      ecs.setActiveStateName('Third State');
      expect(cls.getChangeList()).toEqual([]);
      scope.content = ['abababab'];
      scope.editContent();
      scope.content = ['babababa'];
      scope.saveTextContent();
      expect(cls.getChangeList().length).toBe(1);
      expect(cls.getChangeList()[0].new_value).toEqual(['babababa']);
      expect(cls.getChangeList()[0].old_value).toEqual(['abababab']);

      scope.editContent();
      scope.content = ['And now for something completely different.'];
      scope.saveTextContent();
      expect(cls.getChangeList().length).toBe(2);
      expect(cls.getChangeList()[1].new_value)
        .toEqual(['And now for something completely different.']);
      expect(cls.getChangeList()[1].old_value).toEqual(['babababa']);

      scope.content = ['dadadada'];
      scope.saveTextContent();
      expect(cls.getChangeList().length).toBe(2);
      expect(cls.getChangeList()[1].new_value).not.toEqual(['dadadada']);

      scope.content = ['Abraham Lincoln'];
      scope.saveTextContent();
      expect(cls.getChangeList().length).toBe(2);
      expect(cls.getChangeList()[1].new_value).not.toEqual(['Abraham Lincoln']);
    });

    it('should not re-save unedited content', function() {
      ecs.setActiveStateName('Second State');
      scope.initStateEditor();
      expect(cls.getChangeList()).toEqual([]);
      expect(scope.contentMemento).toBeNull();
      scope.content = ['Eroica'];
      scope.saveTextContent();
      expect(cls.getChangeList()).toEqual([]);
    });

    it('should save parameter edits correctly', function() {
      ecs.setActiveStateName('First State');
      scope.saveStateParamChanges('Adding a parameter change.', '');
      expect(cls.getChangeList()[0].new_value)
        .toEqual('Adding a parameter change.');

      scope.saveStateParamChanges(
        'Let us change again.', 'Adding a parameter change.'
      );
      expect(cls.getChangeList()[1].new_value).toEqual('Let us change again.');
    });
  });
});
