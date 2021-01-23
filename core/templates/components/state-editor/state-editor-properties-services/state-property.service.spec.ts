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

import { fakeAsync, tick } from '@angular/core/testing';
// TODO(#7222): Remove the following block of unnnecessary imports once
// state-property.service.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/exploration-editor-page/services/change-list.service.ts');
require('pages/exploration-editor-page/services/exploration-title.service.ts');

describe('Change list service', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

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
      angular.mock.module(function($provide) {
        $provide.value('AlertsService', [mockWarningsData][0]);
      });
      spyOn(mockWarningsData, 'addWarning');
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {},
        discardDraft: function() {}
      };
      angular.mock.module(function($provide) {
        $provide.value('ExplorationDataService', [mockExplorationData][0]);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(angular.mock.inject(function($injector) {
      cls = $injector.get('ChangeListService');
      $httpBackend = $injector.get('$httpBackend');
    }));

    it('should correctly get and save changes', fakeAsync(() => {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      tick(200);
      expect(cls.getChangeList()).not.toBe([]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    }));

    it('should correctly add a new state', fakeAsync(() => {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      tick(200);
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    }));

    it('should correctly rename a state', fakeAsync(() => {
      expect(cls.getChangeList()).toEqual([]);
      cls.renameState('newName', 'oldName');
      tick(200);
      expect(cls.getChangeList()).toEqual([{
        cmd: 'rename_state',
        old_state_name: 'oldName',
        new_state_name: 'newName'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    }));

    it('should correctly delete a state', fakeAsync(() => {
      expect(cls.getChangeList()).toEqual([]);
      cls.deleteState('deletedState');
      tick(200);
      expect(cls.getChangeList()).toEqual([{
        cmd: 'delete_state',
        state_name: 'deletedState'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    }));

    it('should correctly edit an exploration property', fakeAsync(() => {
      expect(cls.getChangeList()).toEqual([]);
      cls.editExplorationProperty('title', 'newTitle', 'oldTitle');
      tick(200);
      expect(cls.getChangeList()).toEqual([{
        cmd: 'edit_exploration_property',
        property_name: 'title',
        new_value: 'newTitle',
        old_value: 'oldTitle'
      }]);
      expect(mockWarningsData.addWarning).not.toHaveBeenCalled();
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    }));

    it('should detect invalid exploration properties', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editExplorationProperty('fake_property', 'newThing', 'oldThing');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Invalid exploration property: fake_property');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
    });

    it('should correctly edit a state property', fakeAsync(() => {
      expect(cls.getChangeList()).toEqual([]);
      cls.editStateProperty('stateName', 'content', 'newC', 'oldC');
      tick(200);
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
    }));

    it('should detect invalid exploration properties', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editStateProperty(
        'stateName', 'fake_property', 'newThing', 'oldThing');
      expect(mockWarningsData.addWarning).toHaveBeenCalledWith(
        'Invalid state property: fake_property');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
    });

    it('should correctly discard all changes', fakeAsync(() => {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      tick(200);
      expect(cls.getChangeList()).not.toBe([]);
      cls.discardAllChanges();
      expect(cls.getChangeList()).toEqual([]);
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    }));

    it('should correctly handle multiple changes in succession',
      fakeAsync(() => {
        expect(cls.getChangeList()).toEqual([]);

        cls.addState('newState1');
        tick(100);
        cls.addState('newState2');
        expect(cls.getChangeList()).toEqual([{
          cmd: 'add_state',
          state_name: 'newState1'
        }, {
          cmd: 'add_state',
          state_name: 'newState2'
        }]);
        tick(200);
        expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
        $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
      }));

    it('should correctly undo changes', fakeAsync(() => {
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
      tick(200);

      cls.undoLastChange();
      expect(cls.getChangeList()).toEqual([{
        cmd: 'add_state',
        state_name: 'newState1'
      }]);

      cls.undoLastChange();
      expect(cls.getChangeList()).toEqual([]);
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    }));
  });
});

describe('Exploration title service', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

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
      angular.mock.module(function($provide) {
        $provide.value('ExplorationDataService', [mockExplorationData][0]);
        $provide.constant('INVALID_NAME_CHARS', '#@&^%$');
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(angular.mock.inject(function($injector) {
      ets = $injector.get('ExplorationTitleService');
      $httpBackend = $injector.get('$httpBackend');
    }));

    it('should correctly initialize the service', function() {
      expect(ets.displayed).toBeUndefined();
      expect(ets.savedMemento).toBeUndefined();
      ets.init('A title');
      expect(ets.displayed).toEqual('A title');
      expect(ets.savedMemento).toEqual('A title');
    });

    it('should update only the title and not the memento', function() {
      ets.init('A title');
      ets.displayed = 'New title';
      expect(ets.displayed).toEqual('New title');
      expect(ets.savedMemento).toEqual('A title');
      expect(mockExplorationData.autosaveChangeList).not.toHaveBeenCalled();
    });

    it('should restore correctly from the memento', function() {
      ets.init('A title');
      ets.displayed = 'New title';
      ets.restoreFromMemento();
      expect(ets.displayed).toEqual('A title');
      expect(ets.savedMemento).toEqual('A title');
    });

    it('should update the memento with the displayed title', fakeAsync(() => {
      ets.init('A title');
      ets.displayed = 'New title';
      expect(ets.savedMemento).toEqual('A title');
      ets.saveDisplayedValue();
      tick(200);
      expect(ets.savedMemento).toEqual('New title');
      expect(mockExplorationData.autosaveChangeList).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    }));

    it('should report whether the title has changed since it was saved',
      function() {
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
