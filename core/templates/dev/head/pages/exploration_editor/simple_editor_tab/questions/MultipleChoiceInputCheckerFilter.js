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
 * @fileoverview Filter that checks whether the interaction data for a
 * MultipleChoiceInput interaction is consistent with the simple editor.
 */

oppia.filter('MultipleChoiceInputChecker', [function() {
  // Returns true if the interaction data is compatible with the simple editor,
  // and false otherwise. Note that these checks assume that basic
  // compatibility with the backend data structures is already satisfied (e.g.
  // in terms of types), but they may add additional constraints imposed by the
  // UI of the simple editor.
  return function(customizationArgs, answerGroups) {
    // Invariants to check:
    // - Each answer group has exactly one rule_spec, and that rule_spec is for
    //   an "Equals" rule. The argument for each of these rules matches a
    //   choice in customizationArgs.
    // - Each answer group corresponds to a different choice.
    var numChoices = customizationArgs.choices.value.length;
    var coveredChoices = [];
    for (var i = 0; i < answerGroups.length; i++) {
      var ruleSpecs = answerGroups[i].rule_specs;
      if (ruleSpecs.length !== 1 ||
          ruleSpecs[0].rule_type !== 'Equals' ||
          ruleSpecs[0].inputs.x >= numChoices) {
        return false;
      }
      if (coveredChoices.indexOf(ruleSpecs[0].inputs.x) !== -1) {
        return false;
      }
      coveredChoices.push(ruleSpecs[0].inputs.x);
    }
    return true;
  };
}]);
