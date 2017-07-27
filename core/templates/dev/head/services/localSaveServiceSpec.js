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
 * @fileoverview unit tests for the local save services.
 */

 describe('localSaveService', function() {
   beforeEach(module('oppia'));

   describe('behavior in editor', function() {
     var localSaveService = null;
     var explorationIdOne = '100';
     var draftChangeListIdOne = 2;
     var changeList = []
     var explorationIdTwo = '101';
     var draftChangeListIdTwo = 1;
     var saveOne = {
       draftChanges: changeList,
       draftChangeListId: draftChangeListIdOne};
     var saveTwo = {
       draftChanges: changeList,
       draftChangeListId: draftChangeListIdTwo};

     beforeEach(inject(function($injector) {
       localSaveService = $injector.get('localSaveService');
     }));

     it('should correctly save the draft', function() {
       localSaveService.saveExplorationDraft(explorationIdOne,
         changeList, draftChangeListIdOne);
        localSaveService.saveExplorationDraft(explorationIdTwo,
          changeList, draftChangeListIdTwo);
       expect(localSaveService.getExplorationDraft(
         explorationIdOne)).toEqual(saveOne);
       expect(localSaveService.getExplorationDraft(
         explorationIdTwo)).toEqual(saveTwo);
     });

     it('should correctly remove the draft', function() {
      localSaveService.saveExplorationDraft(explorationIdTwo,
         changeList, draftChangeListIdTwo);
       localSaveService.removeExplorationDraft(explorationIdTwo);
       expect(localSaveService.getExplorationDraft(
         explorationIdTwo)).toBeNull();
     });
   });
 });
