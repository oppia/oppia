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
 * @fileoverview Service that contains common functionalities for creating
 * unique identifiers for sidebar items and editor field headers.
 */

oppia.factory('QuestionHashService', [function() {
  // Strip the space, and set to lower case.
  var strip = function(string) {
    return string.trim().toLowerCase().split(' ').join('');
  };
  return {
    // Returns a question hash (question stateName without spaces).
    getQuestionHash: function(question) {
      return strip(question.getStateName());
    },
    // Returns a hash used to identify a question subfield.
    getSubfieldHash: function(questionId, label) {
      return [strip(questionId), strip(label)].join('-');
    },
    // Returns a hash used to identify a sidebar item.
    getSidebarItemHash: function(questionId, label) {
      return 'sidebaritem-' + this.getSubfieldHash(questionId, label);
    },
    // Extracts the questionHash from a subfieldHash.
    getParentQuestionHash: function(subfieldHash) {
      return subfieldHash.split('-')[0];
    }
  };
}]);
