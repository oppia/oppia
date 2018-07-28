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

// Service for keeping track of solution validity.
oppia.factory('SolutionValidityService', [
  function() {
    return {
      init: function(stateNames) {
        this.solutionValidities = {};
        var self = this;
        stateNames.forEach(function(stateName) {
          self.solutionValidities[stateName] = true;
        });
      },
      onRenameState: function(newStateName, oldStateName) {
        this.solutionValidities[newStateName] =
          this.solutionValidities[oldStateName];
        this.deleteSolutionValidity(oldStateName);
      },
      updateValidity: function(stateName, solutionIsValid) {
        this.solutionValidities[stateName] = solutionIsValid;
      },
      isSolutionValid: function(stateName) {
        if (this.solutionValidities.hasOwnProperty(stateName)) {
          return this.solutionValidities[stateName];
        }
      },
      deleteSolutionValidity: function(stateName) {
        delete this.solutionValidities[stateName];
      },
      getAllValidities: function() {
        return this.solutionValidities;
      }
    };
  }]);
