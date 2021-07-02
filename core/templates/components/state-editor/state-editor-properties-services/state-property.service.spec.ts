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

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ChangeListService } from 'pages/exploration-editor-page/services/change-list.service';
import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';
import { AlertsService } from 'services/alerts.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

require('pages/exploration-editor-page/services/change-list.service.ts');
require('pages/exploration-editor-page/services/exploration-title.service.ts');

class MockExplorationDataService {
  explorationId: 0;
  autosaveChangeListAsync() {
    return;
  }

  discardDraftAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
}

describe('Change list service', function() {
  describe('change list service', function() {
    var cls: ChangeListService = null;
    var $httpBackend = null;
    let explorationDataService: MockExplorationDataService;
    let alertsService: AlertsService;
    let autosaveChangeListSpy;
    let warningSpy;

    var autosaveDraftUrl = 'createhandler/autosave_draft/0';
    var validAutosaveResponse = {
      is_version_of_draft_valid: true
    };

    beforeEach(() => {
      explorationDataService = new MockExplorationDataService();
      TestBed.configureTestingModule({
        providers: [
          AlertsService,
          ChangeListService,
          {
            provide: ExplorationDataService,
            useValue: explorationDataService
          }
        ]
      });
    });

    beforeEach(() => {
      cls = TestBed.inject(ChangeListService);
      alertsService = TestBed.inject(AlertsService);

      warningSpy = spyOn(alertsService, 'addWarning');
      autosaveChangeListSpy = spyOn(
        explorationDataService, 'autosaveChangeListAsync');
    });

    beforeEach(angular.mock.inject(function($injector) {
      $httpBackend = $injector.get('$httpBackend');
    }));

    it('should correctly get and save changes', fakeAsync(() => {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      tick(200);
      expect(cls.getChangeList()).not.toBe([]);
      expect(warningSpy).not.toHaveBeenCalled();
      expect(autosaveChangeListSpy).toHaveBeenCalled();
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
      expect(warningSpy).not.toHaveBeenCalled();
      expect(autosaveChangeListSpy).toHaveBeenCalled();
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
      expect(warningSpy).not.toHaveBeenCalled();
      expect(autosaveChangeListSpy).toHaveBeenCalled();
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
      expect(warningSpy).not.toHaveBeenCalled();
      expect(autosaveChangeListSpy).toHaveBeenCalled();
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
      expect(warningSpy).not.toHaveBeenCalled();
      expect(autosaveChangeListSpy).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    }));

    it('should detect invalid exploration properties', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editExplorationProperty('fake_property', 'newThing', 'oldThing');
      expect(warningSpy).toHaveBeenCalledWith(
        'Invalid exploration property: fake_property');
      expect(autosaveChangeListSpy).not.toHaveBeenCalled();
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
      expect(warningSpy).not.toHaveBeenCalled();
      expect(autosaveChangeListSpy).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    }));

    it('should detect invalid exploration properties', function() {
      expect(cls.getChangeList()).toEqual([]);
      cls.editStateProperty(
        'stateName', 'fake_property', 'newThing', 'oldThing');
      expect(warningSpy).toHaveBeenCalledWith(
        'Invalid state property: fake_property');
      expect(autosaveChangeListSpy).not.toHaveBeenCalled();
    });

    it('should correctly discard all changes', fakeAsync(() => {
      expect(cls.getChangeList()).toEqual([]);
      cls.addState('newState');
      tick(200);
      expect(cls.getChangeList()).not.toBe([]);
      cls.discardAllChanges();
      expect(cls.getChangeList()).toEqual([]);
      expect(autosaveChangeListSpy).toHaveBeenCalled();
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
        expect(autosaveChangeListSpy).toHaveBeenCalled();
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
      expect(autosaveChangeListSpy).toHaveBeenCalled();
      $httpBackend.expectPUT(autosaveDraftUrl).respond(validAutosaveResponse);
    }));
  });
});

describe('Exploration title service', function() {
  describe('exploration title service', function() {
    var ets = null;
    var $httpBackend = null;

    var autosaveDraftUrl = 'createhandler/autosave_draft/0';
    var validAutosaveResponse = {
      is_version_of_draft_valid: true
    };
    let explorationDataService: MockExplorationDataService;
    let autosaveChangeListSpy;
    importAllAngularServices();

    beforeEach(() => {
      explorationDataService = new MockExplorationDataService();
      TestBed.configureTestingModule({
        providers: [
          {
            provide: ExplorationDataService,
            useValue: explorationDataService
          }
        ]
      });
    });

    beforeEach(() => {
      angular.mock.module(function($provide) {
        $provide.constant('INVALID_NAME_CHARS', '#@&^%$');
      });

      autosaveChangeListSpy = spyOn(
        explorationDataService, 'autosaveChangeListAsync');
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
      expect(autosaveChangeListSpy).not.toHaveBeenCalled();
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
      expect(autosaveChangeListSpy).toHaveBeenCalled();
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
        expect(autosaveChangeListSpy).not.toHaveBeenCalled();
        expect(ets.hasChanged()).toBe(false);
      });
  });
});
