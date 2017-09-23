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
 * @fileoverview Service that checks whether the interaction data for a
 * Numeric interaction is consistent with the simple editor.
 */

 oppia.factory('NumericInputCheckerService', [function() {
   return {
     // Returns true if the interaction data is compatible with the simple
     // editor, and false otherwise. Note that these checks assume that basic
     // compatibility with the backend data structures is already satisfied
     // (e.g. in terms of types), but they may add additional constraints
     // imposed by the UI of the simple editor.
     isValid: function(customizationArgs, answerGroups) {
       // Invariant to check:
       // - Answer group rule type is 'Equals'.
       if(answerGroups[0]) {
         var rules = answerGroups[0].rules;
         if(rules.length !== 1) {
           return false;
         }
         if(rules[0].type !== 'Equals') {
           return false;
         }
       }
       return true;
     }
   };
 }]);
