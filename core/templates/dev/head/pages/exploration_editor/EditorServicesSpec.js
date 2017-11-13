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
 */


describe('Exploration data service', function() {
  beforeEach(module('oppia'));

  describe('getData local save', function() {
    var eds = null;
    var mockBackendApiService = null;
    var mockLocalStorageService = null;
    var mockUrlService = null;
    var responseWhenDraftChangesAreValid = null;
    var responseWhenDraftChangesAreInvalid = null;
    var $q = null;

    beforeEach(function() {
      module(function($provide) {
        $provide.value(
          'LocalStorageService', mockLocalStorageService);
      });
      module(function($provide) {
        $provide.value(
          'EditableExplorationBackendApiService', mockBackendApiService);
      });
      module(function($provide) {
        $provide.value(
          'urlService', mockUrlService);
      });
    });

    beforeEach(function() {
      mockUrlService = {
        getPathname: function() {}
      };

      mockBackendApiService = {
        fetchApplyDraftExploration: function() {}
      };

      mockLocalStorageService = {
        getExplorationDraft: function() {},
        removeExplorationDraft: function() {}
      };
      spyOn(mockUrlService, 'getPathname').and.returnValue('/create/exp_id');
    });

    beforeEach(inject(function($injector) {
      eds = $injector.get('explorationData');
      $q = $injector.get('$q');
    }));

    beforeEach(function() {
      expDataResponse = {
        draft_change_list_id: 3,
      };

      responseWhenDraftChangesAreValid = {
        isValid: function() {
          return true;
        },
        getChanges: function() {
          return [];
        }
      };

      responseWhenDraftChangesAreInvalid = {
        isValid: function() {
          return false;
        },
        getChanges: function() {
          return [];
        }
      };

      spyOn(mockBackendApiService, 'fetchApplyDraftExploration').
        and.returnValue($q.when(expDataResponse));
      spyOn(eds, 'autosaveChangeList');
    });


    it('should autosave draft changes when draft ids match', function() {
      errorCallback = function() {};
      spyOn(mockLocalStorageService, 'getExplorationDraft').
        and.returnValue(responseWhenDraftChangesAreValid);
      eds.getData(errorCallback).then(function(data) {
        expect(eds.autosaveChangeList()).toHaveBeenCalled();
      });
    });

    it('should call error callback when draft ids do not match', function() {
      errorCallback = function() {};
      spyOn(mockLocalStorageService, 'getExplorationDraft').
        and.returnValue(responseWhenDraftChangesAreInvalid);
      spyOn(window, 'errorCallback');
      eds.getData(errorCallback).then(function(data) {
        expect(errorCallback()).toHaveBeenCalled();
      });
    });
  });
});

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

describe('Angular names service', function() {
  beforeEach(module('oppia'));

  describe('angular name service', function() {
    var ans = null;

    beforeEach(inject(function($injector) {
      ans = $injector.get('angularNameService');
    }));

    it('should map interaction ID to correct RulesService', function() {
      expect(ans.getNameOfInteractionRulesService('TextInput')).toEqual(
        'textInputRulesService');
    });
  });
});

describe('Change list service', function() {
  beforeEach(module('oppia'));

  describe('change list service', function() {
    var cls = null;
    var $httpBackend = null;
    var mockWarningsData;
    var mockExplorationData;

    var autosaveDraftUrl = 'createhandler/autosave_draft/0';
    var validAutosaveResponse = {
      is_version_of_draft_valid: true
    };

    beforeEach(function() {
      mockWarningsData = {
        addWarning: function() {}
      };
      module(function($provide) {
        $provide.value('AlertsService', mockWarningsData);
      });
      spyOn(mockWarningsData, 'addWarning');
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {},
        discardDraft: function() {}
      };
      module(function($provide) {
        $provide.value('explorationData', mockExplorationData);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(inject(function($injector) {
      cls = $injector.get('changeListService');
      $httpBackend = $injector.get('$httpBackend');
    }));

    it('should correctly get and save changes', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      expect(cls.getChangeList()).not.toBe([]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly add a new state', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
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
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should correctly delete a state', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.deleteState('deletedState');
      expect(cls.getChangeList()).toEqual([{
        cmd: 'delete_state',
        state_name: 'deletedState'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
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
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should detect invalid exploration properties', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editExplorationProperty('fake_property', 'newThing', 'oldThing');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Invalid exploration property: fake_property');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
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
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('should detect invalid exploration properties', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editStateProperty(
        'stateName', 'fake_property', 'newThing', 'oldThing');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Invalid state property: fake_property');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
    });

    it('should correctly discard all changes', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      expect(cls.getChangeList()).not.toBe([]);
      cls.discardAllChanges();
      expect(cls.getChangeList()).toEqual([]);
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
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
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
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
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });
  });
});

describe('Exploration title service', function() {
  beforeEach(module('oppia'));

  describe('exploration title service', function() {
    var ets = null;
    var $httpBackend = null;
    var mockExplorationData;

    var autosaveDraftUrl = 'createhandler/autosave_draft/0';
    var validAutosaveResponse = {
      is_version_of_draft_valid: true
    };

    beforeEach(function() {
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {}
      };
      module(function($provide) {
        $provide.value('explorationData', mockExplorationData);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(inject(function($injector) {
      ets = $injector.get('explorationTitleService');
      $httpBackend = $injector.get('$httpBackend');
      
      GLOBALS.INVALID_NAME_CHARS = '#@&^%$';
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
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
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
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    });

    it('reports whether the title has changed since it was saved', function() {
      ets.init('A title');
      expect(ets.hasChanged()).toBe(false);
      ets.displayed = 'A title';
      expect(ets.hasChanged()).toBe(false);
      ets.displayed = 'New title';
      expect(ets.hasChanged()).toBe(true);
      ets.displayed = 'A title';
      expect(ets.hasChanged()).toBe(false);

      ets.saveDisplayedValue();
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
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

      GLOBALS.ACTIVITY_STATUS_PRIVATE = 'private';
      GLOBALS.ACTIVITY_STATUS_PUBLIC = 'public';
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

    it('reports the correct cloning status', function() {
      ers.init(['abc'], [], [], 'public', '1234', true);
      expect(ers.isCloned()).toBe(true);
      expect(ers.clonedFrom()).toEqual('1234');

      ers.init(['abc'], [], [], 'public', null, true);
      expect(ers.isCloned()).toBe(false);
      expect(ers.clonedFrom()).toBeNull();
    });

    it('reports the correct community-owned status', function() {
      ers.init(['abc'], [], [], 'public', '1234', false);
      expect(ers.isCommunityOwned()).toBe(false);

      ers.init(['abc'], [], [], 'public', '1234', true);
      expect(ers.isCommunityOwned()).toBe(true);
    });

    it('reports the correct derived statuses', function() {
      ers.init(['abc'], [], [], 'private', 'e1234', true);
      expect(ers.isPrivate()).toBe(true);
      expect(ers.isPublic()).toBe(false);

      ers.init(['abc'], [], [], 'public', 'e1234', true);
      expect(ers.isPrivate()).toBe(false);
      expect(ers.isPublic()).toBe(true);
    });
  });
});
