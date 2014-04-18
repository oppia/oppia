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
 * @fileoverview Unit tests for the services and controllers of the exploration
 *   editor page.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Editor context service', function() {
  beforeEach(module('oppia'));

  describe('editor context service', function() {
    var ecs = null;

    beforeEach(inject(function($injector) {
      ecs = $injector.get('editorContextService');
    }));

    it('should correctly determine whether we are in a state context', function() {
      expect(ecs.isInStateContext()).toBe(false);
      ecs.setActiveStateName('A State');
      expect(ecs.isInStateContext()).toBe(true);
    });

    it('should correctly clear the active state name', function() {
      ecs.setActiveStateName('A State');
      expect(ecs.isInStateContext()).toBe(true);
      ecs.clearActiveStateName();
      expect(ecs.isInStateContext()).toBe(false);
      expect(ecs.getActiveStateName()).toBeNull();
    });

    it('should correctly set and get state names', function() {
      ecs.setActiveStateName('A State');
      expect(ecs.getActiveStateName()).toBe('A State');
    });

    it('should not allow invalid state names to be set', function() {
      ecs.setActiveStateName('');
      expect(ecs.isInStateContext()).toBe(false);
      expect(ecs.getActiveStateName()).toBeNull();

      ecs.setActiveStateName(null);
      expect(ecs.isInStateContext()).toBe(false);
      expect(ecs.getActiveStateName()).toBeNull();
    });
  });
});


describe('Change list service', function() {
  beforeEach(module('oppia'));

  describe('change list service', function() {
    var cls = null;
    var mockWarningsData;

    beforeEach(function() {
      mockWarningsData = {
        addWarning: function(warning) {}
      };
      module(function($provide) {
        $provide.value('warningsData', mockWarningsData)
      });
      spyOn(mockWarningsData, 'addWarning');
    });

    beforeEach(inject(function($injector) {
      cls = $injector.get('changeListService');
    }));

    it('should correctly get and save changes', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      expect(cls.getChangeList()).not.toBe([]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
    });

    it('should correctly add a new state', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
    });

    it('should correctly rename a state', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.renameState('newName', 'oldName');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'rename_state',
        old_state_name: 'oldName',
        new_state_name: 'newName'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
    });

    it('should correctly delete a state', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.deleteState('deletedState');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'delete_state',
        state_name: 'deletedState'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
    });

    it('should correctly edit an exploration property', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editExplorationProperty('title', 'newTitle', 'oldTitle');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'edit_exploration_property',
        property_name: 'title',
        new_value: 'newTitle',
        old_value: 'oldTitle'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
    });

    it('should detect invalid exploration properties', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editExplorationProperty('fake_property', 'newThing', 'oldThing');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Invalid exploration property: fake_property');
    });

    it('should correctly edit a state property', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editStateProperty('stateName', 'content', 'newC', 'oldC');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'edit_state_property',
        state_name: 'stateName',
        property_name: 'content',
        new_value: 'newC',
        old_value: 'oldC'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
    });

    it('should detect invalid exploration properties', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editStateProperty(
        'stateName', 'fake_property', 'newThing', 'oldThing');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Invalid state property: fake_property');
    });

    it('should correctly discard all changes', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      expect(cls.getChangeList()).not.toBe([]);
      cls.discardAllChanges();
      expect(cls.getChangeList()).toEqual([]);
    });

    it('should correctly handle multiple changes in succession', function() {
      expect(cls.getChangeList()).toEqual([]);

      cls.addState('newState1');
      cls.addState('newState2');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState1'
      }, {
        cmd: 'add_state',
        state_name: 'newState2'
      }]);
    });

    it('should correctly undo changes', function() {
      expect(cls.getChangeList()).toEqual([]);

      cls.addState('newState1');
      cls.addState('newState2');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState1'
      }, {
        cmd: 'add_state',
        state_name: 'newState2'
      }]);

      cls.undoLastChange();
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState1'
      }]);

      cls.undoLastChange();
      expect(cls.getChangeList()).toEqual([]);
    })
  });
});


describe('Exploration title service', function() {
  beforeEach(module('oppia'));

  describe('exploration title service', function() {
    var ets = null;

    beforeEach(inject(function($injector) {
      ets = $injector.get('explorationTitleService');
    }));

    it('correctly initializes the service', function() {
      expect(ets.displayed).toBeNull();
      expect(ets.savedMemento).toBeNull();
      ets.init('A title');
      expect(ets.displayed).toEqual('A title');
      expect(ets.savedMemento).toEqual('A title');
    });

    it('updates only the title and not the memento', function() {
      ets.init('A title');
      ets.displayed = 'New title';
      expect(ets.displayed).toEqual('New title');
      expect(ets.savedMemento).toEqual('A title');
    });

    it('restores correctly from the memento', function() {
      ets.init('A title');
      ets.displayed = 'New title';
      ets.restoreFromMemento();
      expect(ets.displayed).toEqual('A title');
      expect(ets.savedMemento).toEqual('A title');
    });

    it('updates the memento with the displayed title', function() {
      ets.init('A title');
      ets.displayed = 'New title';
      expect(ets.savedMemento).toEqual('A title');      
      ets.updateMemento();
      expect(ets.savedMemento).toEqual('New title');
    });

    it('correctly reports whether the title has changed since it was saved', function() {
      ets.init('A title');
      expect(ets.hasChanged()).toBe(false);
      ets.displayed = 'A title';
      expect(ets.hasChanged()).toBe(false);
      ets.displayed = 'New title';
      expect(ets.hasChanged()).toBe(true);
      ets.displayed = 'A title';
      expect(ets.hasChanged()).toBe(false);

      ets.updateMemento();
      expect(ets.hasChanged()).toBe(false);
    });
  });
});
