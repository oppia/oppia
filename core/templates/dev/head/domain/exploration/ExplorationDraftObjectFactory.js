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
 * @fileoverview Factory for creating instances of ExplorationDraft
 * domain objects.
 */

oppia.factory('ExplorationDraftObjectFactory', [
  function() {
    var ExplorationDraft = function(draftChanges, draftChangeListId) {
      this.draftChanges = draftChanges;
      this.draftChangeListId = draftChangeListId;
    };

    /**
     * Checks whether the draft object has been overwritten by another
     * draft which has been committed to the back-end. If the supplied draft id
     * has a different value then a newer changeList must have been committed
     * to the back-end.
     * @param {Integer} - currentDraftId. The id of the draft changes whch was
     *  retrieved from the back-end.
     * @returns {Boolean} - True iff the currentDraftId is the same as the
     * draftChangeListId corresponding to this draft.
     */
    ExplorationDraft.prototype.isValid = function(currentDraftId) {
      return (currentDraftId === this.draftChangeListId);
    };

    ExplorationDraft.prototype.getChanges = function() {
      return this.draftChanges;
    };

    ExplorationDraft.createFromLocalStorageDict = function(
        explorationDraftDict) {
      return new ExplorationDraft(
        explorationDraftDict.draftChanges,
        explorationDraftDict.draftChangeListId);
    };

    ExplorationDraft.toLocalStorageDict = function(
        changeList, draftChangeListId) {
      return {
        draftChanges: changeList,
        draftChangeListId: draftChangeListId
      };
    };

    return ExplorationDraft;
  }
]);
