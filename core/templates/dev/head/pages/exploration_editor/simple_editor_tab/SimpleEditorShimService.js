// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service that acts as a "go-between" between the
 * simple-editor-related services and the rest of the exploration editor,
 * analogous to how the BackendApiServices bridge the frontend communications
 * with the backend. All communication of data from the simple editor to other
 * services (load, fetch, set, etc.) should pass through this service.
 */

oppia.factory('SimpleEditorShimService', [
  'explorationTitleService', 'explorationInitStateNameService',
  'explorationStatesService',
  function(
      explorationTitleService, explorationInitStateNameService,
      explorationStatesService) {
    return {
      getTitle: function() {
        return explorationTitleService.savedMemento;
      },
      getIntroductionHtml: function() {
        var initStateName = this.getInitStateName();
        return this.getState(initStateName).content[0].value;
      },
      getInitStateName: function() {
        return explorationInitStateNameService.savedMemento;
      },
      getAllStateNames: function() {
        return explorationStatesService.getStateNames();
      },
      getState: function(stateName) {
        return angular.copy(explorationStatesService.getState(stateName));
      },
      getContentHtml: function(stateName) {
        return this.getState(stateName).content[0].value;
      },
      getInteractionId: function(stateName) { 
        return this.getState(stateName).interaction.id;
      },
      saveTitle: function(newTitle) {
        explorationTitleService.displayed = newTitle;
        explorationTitleService.saveDisplayedValue();
      },
      saveIntroductionHtml: function(newIntroductionHtml) {
        explorationStatesService.saveStateContent(this.getInitStateName(), [{
          type: 'text',
          value: newIntroductionHtml
        }]);
      },
      saveInteractionId: function(stateName, newInteractionId) {
        explorationStatesService.saveInteractionId(stateName, newInteractionId);
      },
      saveCustomizationArgs: function(stateName, newCustomizationArgs) {
        explorationStatesService.saveInteractionCustomizationArgs(
          stateName, newCustomizationArgs);
      },
      saveAnswerGroups: function(stateName, newAnswerGroups) {
        explorationStatesService.saveInteractionAnswerGroups(
          stateName, newAnswerGroups);
      },
      saveDefaultOutcome: function(stateName, newDefaultOutcome) {
        explorationStatesService.saveInteractionDefaultOutcome(
          stateName, newDefaultOutcome);
      },
      saveBridgeHtml: function(stateName, newHtml) {
        explorationStatesService.saveStateContent(stateName, [{
          type: 'text',
          value: newHtml
        }]);
      },
      addState: function(newStateName) {
        explorationStatesService.addState(newStateName);
      },
      deleteState: function(stateName) {
        explorationStatesService.confirmDelete(stateName);
      },
      saveStateContent: function(stateName, newStateContent) {
        explorationStatesService.saveStateContent(stateName, newStateContent);
      }
    };
  }
]);
