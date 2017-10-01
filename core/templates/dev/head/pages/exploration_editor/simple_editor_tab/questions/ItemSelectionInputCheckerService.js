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
 * @fileoverview Service that checks whether the interaction data for a
 * ItemSelectionInput interaction is consistent with the simple editor.
 */

oppia.factory('ItemSelectionInputCheckerService', [
  function() {
    return {
      // Returns true if the interaction data is compatible with the simple
      // editor, and false otherwise. Note that these checks assume that basic
      // compatibility with the backend data structures is already satisfied
      // (e.g. in terms of types), but they may add additional constraints
      // imposed by the UI of the simple editor.
      isValid: function(customizationArgs, answerGroups) {
        // Invariants to check:
        // - Each answer group has exactly one rule (for an "Equals" rule). The
        //   argument for each of these rules should match a choice in
        //   customizationArgs.
        // - Each answer group corresponds to a different set of choices.
        // - Each answer group should have choices within customizationArgs.
        var numChoices = customizationArgs.choices.value.length;
        var choices = customizationArgs.choices.value;
        var coveredSetsOfChoices = [];
        for (var i = 0; i < answerGroups.length; i++) {
          var rules = answerGroups[i].rules;
          if (rules.length !== 1 ||
              rules[0].type !== 'Equals' || 
              rules[0].inputs.x.length > numChoices) {
            return false;
          }

          // Check to make sure that the coverage is unique.
          var sortedChoices = Array.prototype.slice.call(
            rules[0].inputs.x).sort();
          var matchFound = coveredSetsOfChoices.some(function(setOfChoices) {
            return angular.equals(
              Array.prototype.slice.call(setOfChoices).sort(), sortedChoices);
          });
          if (matchFound) {
            return false;
          }
          coveredSetsOfChoices.push(rules[0].inputs.x);

          // Check to ensure that each answer group has choices within
          // customizationArgs.
          for (var j = 0; j < rules[0].inputs.x.length; j++) {
            if (choices.indexOf(rules[0].inputs.x[j]) === -1) {
              return false;
            }
          }
        }
        return true;
      }
    };
  }
]);
