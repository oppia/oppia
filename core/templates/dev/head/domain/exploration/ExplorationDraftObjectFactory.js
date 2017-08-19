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
 * @fileoverview Factory for creating nre frontend instances of ExplorationDraft
 * domain objects..
 */

 oppia.factory('ExplorationDraftObjectFactory', [
   function() {
     var ExplorationDraft = function(draftChanges, draftChangeListId) {
       this.draftChanges = draftChanges;
       this.draftChangeListId = draftChangeListId;
     };

     ExplorationDraft.prototype.isDraftValid = function(validDraftId) {
       return (validDraftId === this.draftChangeListId);
     };

     ExplorationDraft.prototype.getDraftChanges = function() {
       return this.draftChanges;
     };

     ExplorationDraft.createFromDict = function(
       explorationDraftDict) {
       return new ExplorationDraft(
         explorationDraftDict.draftChanges,
         explorationDraftDict.draftChangeListId);
     };
     return ExplorationDraft;
   };
 ]);
