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

describe('ExplorationDraftObjectFactory', function() {
  beforeEach(module('oppia'));

  describe('exploration draft object factory', function() {
    var ExplorationDraftObjectFactory = null;
    var explorationId = '100';
    var draftChangeListId = 2;
    var changeList = [];
    var draftDict = {
      draftChanges: changeList,
      draftChangeListId: draftChangeListId
    };
    var draft = null;

    beforeEach(inject(function($injector) {
      ExplorationDraftObjectFactory = $injector.get(
        'ExplorationDraftObjectFactory');
      draft = (
        ExplorationDraftObjectFactory.createFromLocalStorageDict(
          draftDict));
    }));

    it('should determine if the draft is valid', function() {
      expect(draft.isValid(
        draftChangeListId)).toBeTruthy();
      expect(draft.isValid(
        draftChangeListId + 1)).toBeFalsy();
    });

    it('should return the correct changeList', function() {
      expect(draft.getChanges()).toEqual(changeList);
    });

    it('should create a valid local storage dict', function() {
      expect(ExplorationDraftObjectFactory.toLocalStorageDict(
        changeList, draftChangeListId)).toEqual(draftDict);
    });
  });
});
