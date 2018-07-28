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
 * @fileoverview A service that maintains a record of which state
 * in the exploration is currently active.
 */

oppia.factory('EditorStateService', [
  '$log', 'SolutionValidityService',
  function(
      $log, SolutionValidityService) {
    var activeStateName = null;
    var stateNames = [];
    var correctnessFeedbackEnabled = null;
    var inQuestionMode = null;

    return {
      getActiveStateName: function() {
        return activeStateName;
      },
      setActiveStateName: function(newActiveStateName) {
        if (newActiveStateName === '' || newActiveStateName === null) {
          $log.error('Invalid active state name: ' + newActiveStateName);
          return;
        }
        activeStateName = newActiveStateName;
      },
      setInQuestionMode: function(newModeValue) {
        inQuestionMode = newModeValue;
      },
      getInQuestionMode: function() {
        return isInQuestionMode;
      },
      setCorrectnessFeedbackEnabled: function(newCorrectnessFeedbackEnabled) {
        correctnessFeedbackEnabled = newCorrectnessFeedbackEnabled;
      },
      getCorrectnessFeedbackEnabled: function() {
        return correctnessFeedbackEnabled;
      },
      setStateNames: function(newStateNames) {
        stateNames = newStateNames;
      },
      getStateNames: function() {
        return stateNames;
      },
      isCurrentSolutionValid: function() {
        return SolutionValidityService.isSolutionValid(activeStateName);
      },
      deleteCurrentSolutionValidity: function() {
        SolutionValidityService.deleteSolutionValidity(activeStateName);
      }
    };
  }]);
