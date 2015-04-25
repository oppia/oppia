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

    it('should correctly set and get state names', function() {
      ecs.setActiveStateName('A State');
      expect(ecs.getActiveStateName()).toBe('A State');
    });

    it('should not allow invalid state names to be set', function() {
      ecs.setActiveStateName('');
      expect(ecs.getActiveStateName()).toBeNull();

      ecs.setActiveStateName(null);
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
      expect(ets.displayed).toBeUndefined();
      expect(ets.savedMemento).toBeUndefined();
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
      ets.saveDisplayedValue();
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

      ets.saveDisplayedValue();
      expect(ets.hasChanged()).toBe(false);
    });
  });
});


describe('Exploration rights service', function() {
  beforeEach(module('oppia'));

  describe('exploration rights service', function() {
    var ers = null;

    beforeEach(inject(function($injector) {
      ers = $injector.get('explorationRightsService');

      GLOBALS.EXPLORATION_STATUS_PRIVATE = 'private';
      GLOBALS.EXPLORATION_STATUS_PUBLIC = 'public';
      GLOBALS.EXPLORATION_STATUS_PUBLICIZED = 'publicized';
    }));

    it('correctly initializes the service', function() {
      expect(ers.ownerNames).toBeUndefined();
      expect(ers.editorNames).toBeUndefined();
      expect(ers.viewerNames).toBeUndefined();
      expect(ers._status).toBeUndefined();
      expect(ers._clonedFrom).toBeUndefined();
      expect(ers._isCommunityOwned).toBeUndefined();
      expect(ers._viewableIfPrivate).toBeUndefined();

      ers.init(['abc'], [], [], 'private', 'e1234', true, true);

      expect(ers.ownerNames).toEqual(['abc']);
      expect(ers.editorNames).toEqual([]);
      expect(ers.viewerNames).toEqual([]);
      expect(ers._status).toEqual('private');
      expect(ers._clonedFrom).toEqual('e1234');
      expect(ers._isCommunityOwned).toBe(true);
      expect(ers._viewableIfPrivate).toBe(true);
    });

    it('reports the correct derived statuses', function() {
      ers.init(['abc'], [], [], 'private', 'e1234', true);
      expect(ers.isPrivate()).toBe(true);
      expect(ers.isPublic()).toBe(false);
      expect(ers.isPublicized()).toBe(false);

      ers.init(['abc'], [], [], 'public', 'e1234', true);
      expect(ers.isPrivate()).toBe(false);
      expect(ers.isPublic()).toBe(true);
      expect(ers.isPublicized()).toBe(false);

      ers.init(['abc'], [], [], 'publicized', 'e1234', true);
      expect(ers.isPrivate()).toBe(false);
      expect(ers.isPublic()).toBe(false);
      expect(ers.isPublicized()).toBe(true);
    });

    it('reports the correct cloning status', function() {
      ers.init(['abc'], [], [], 'publicized', '1234', true);
      expect(ers.isCloned()).toBe(true);
      expect(ers.clonedFrom()).toEqual('1234');

      ers.init(['abc'], [], [], 'publicized', null, true);
      expect(ers.isCloned()).toBe(false);
      expect(ers.clonedFrom()).toBeNull();
    });

    it('reports the correct community-owned status', function() {
      ers.init(['abc'], [], [], 'publicized', '1234', false);
      expect(ers.isCommunityOwned()).toBe(false);

      ers.init(['abc'], [], [], 'publicized', '1234', true);
      expect(ers.isCommunityOwned()).toBe(true);
    });
  });
});

describe('New state template service', function() {
  beforeEach(module('oppia'));

  describe('new state template service', function() {
    var nsts = null;
    var NEW_STATE_NAME = 'new state name';

    beforeEach(inject(function($injector) {
      // TODO(sll): Make this match the dict in the backend so that there
      // is a single source of truth.
      GLOBALS.NEW_STATE_TEMPLATE = {
        content: [{type: 'text', value: ''}],
        interaction: {
          customization_args: {
            rows: {value: 1},
            placeholder: {value: 'Type your answer here.'}
          },
          handlers: [{
            name: 'submit',
            rule_specs: [{
              dest: '(untitled state)',
              definition: {rule_type: 'default'},
              feedback: [],
              param_changes: []
            }],
          }],
          id: 'TextInput'
        },
        param_changes: [],
        unresolved_answers: {},
      };
      nsts = $injector.get('newStateTemplateService');
    }));

    it('should correctly make a new state template given a state name', function() {
      expect(nsts.getNewStateTemplate(NEW_STATE_NAME)).toEqual({
        content: [{type: 'text', value: ''}],
        interaction: {
          customization_args: {
            rows: {value: 1},
            placeholder: {value: 'Type your answer here.'}
          },
          handlers: [{
            name: 'submit',
            rule_specs: [{
              dest: NEW_STATE_NAME,
              definition: {rule_type: 'default'},
              feedback: [],
              param_changes: []
            }]
          }],
          id: 'TextInput'
        },
        param_changes: [],
        unresolved_answers: {}
      });
    });
  });
});
