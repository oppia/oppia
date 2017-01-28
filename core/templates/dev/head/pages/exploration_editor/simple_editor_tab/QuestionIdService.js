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

oppia.factory('QuestionIdService', [function() {
  // Strip the space, and set to lower case.
  var strip = function(string) {
    return string.trim().toLowerCase().split(' ').join('');
  };
  var SIDEBAR_ID_DELIMETER = ':';
  return {
    SIDEBAR_PREFIX: 'sidebaritem' + SIDEBAR_ID_DELIMETER,
    // Returns an Id used to identify a question subfield.
    getSubfieldId: function(questionId, label) {
      return [questionId, strip(label)].join(SIDEBAR_ID_DELIMETER);
    },
    // Returns an Id used to identify a sidebar item.
    getSidebarItemId: function(questionId, label) {
      return this.SIDEBAR_PREFIX + this.getSubfieldId(questionId, label);
    },
    // Extracts the questionId from a subfieldId.
    getParentQuestionId: function(subfieldId) {
      return subfieldId.split(SIDEBAR_ID_DELIMETER)[0];
    }
  };
}]);
