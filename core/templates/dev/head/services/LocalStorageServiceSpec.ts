// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview unit tests for the local save services.
 */

describe('LocalStorageService', function() {
  beforeEach(module('oppia'));

  describe('behavior in editor', function() {
    var LocalStorageService = null;
    var ExplorationDraftObjectFactory = null;
    var explorationIdOne = '100';
    var draftChangeListIdOne = 2;
    var changeList = [];
    var explorationIdTwo = '101';
    var draftChangeListIdTwo = 1;
    var draftDictOne = {
      draftChanges: changeList,
      draftChangeListId: draftChangeListIdOne
    };
    var draftDictTwo = {
      draftChanges: changeList,
      draftChangeListId: draftChangeListIdTwo
    };
    var draftOne = null;
    var draftTwo = null;

    beforeEach(inject(function($injector) {
      LocalStorageService = $injector.get('LocalStorageService');
      ExplorationDraftObjectFactory = $injector.get(
        'ExplorationDraftObjectFactory');
      draftOne = ExplorationDraftObjectFactory.createFromLocalStorageDict(
        draftDictOne);
      draftTwo = ExplorationDraftObjectFactory.createFromLocalStorageDict(
        draftDictTwo);
    }));

    it('should correctly save the draft', function() {
      LocalStorageService.saveExplorationDraft(explorationIdOne,
        changeList, draftChangeListIdOne);
      LocalStorageService.saveExplorationDraft(explorationIdTwo,
        changeList, draftChangeListIdTwo);
      expect(LocalStorageService.getExplorationDraft(
        explorationIdOne)).toEqual(draftOne);
      expect(LocalStorageService.getExplorationDraft(
        explorationIdTwo)).toEqual(draftTwo);
    });

    it('should correctly remove the draft', function() {
      LocalStorageService.saveExplorationDraft(explorationIdTwo,
        changeList, draftChangeListIdTwo);
      LocalStorageService.removeExplorationDraft(explorationIdTwo);
      expect(LocalStorageService.getExplorationDraft(
        explorationIdTwo)).toBeNull();
    });
  });
});
