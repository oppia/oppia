// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Rules service for the interaction.
 */

// Rules Service for DragAndDropSortInput interaction.
oppia.factory('DragAndDropSortInputRulesService', [function() {
  var checkEquality = function(answer, inputs) {
    for (var i = 0; i < answer.length; i++) {
      if (answer[i].length === inputs.x[i].length) {
        for (var j = 0; j < answer[i].length; j++) {
          if (inputs.x[i].indexOf(answer[i][j]) === -1) {
            return false;
          }
        }
      } else {
        return false;
      }
    }
    return true;
  };
  var checkEqualityWithIncorrectPositions = function(answer, inputs) {
    var noOfMismatches = 0;
    for (var i = 0; i < math.min(inputs.x.length, answer.length); i++) {
      for (var j = 0; j < math.max(answer[i].length, inputs.x[i].length); j++) {
        if (inputs.x[i].length > answer[i].length) {
          if (answer[i].indexOf(inputs.x[i][j]) === -1) {
            noOfMismatches += 1;
          }
        } else {
          if (inputs.x[i].indexOf(answer[i][j]) === -1) {
            noOfMismatches += 1;
          }
        }
      }
    }
    return noOfMismatches === 1;
  };
  return {
    IsEqualToOrdering: function(answer, inputs) {
      return answer.length === inputs.x.length && checkEquality(answer, inputs);
    },
    IsEqualToOrderingWithOneItemAtIncorrectPosition: function(answer, inputs) {
      return checkEqualityWithIncorrectPositions(answer, inputs);
    },
    HasElementXAtPositionY: function(answer, inputs) {
      for (var i = 0; i < answer.length; i++) {
        var index = answer[i].indexOf(inputs.x);
        if (index !== -1) {
          return ((i + 1) === inputs.y);
        }
      }
    },
    HasElementXBeforeElementY: function(answer, inputs) {
      var indX = -1;
      var indY = -1;
      for (var i = 0; i < answer.length; i++) {
        var index = answer[i].indexOf(inputs.x);
        if (index !== -1) {
          indX = i;
        }
        index = answer[i].indexOf(inputs.y);
        if (index !== -1) {
          indY = i;
        }
      }
      return indX < indY;
    }
  };
}]);
