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

oppia.factory('SetInputRulesService', [function() {
  return {
    Equals: function(answer, inputs) {
      return answer.length === inputs.x.length && inputs.x.every(function(val) {
        return answer.indexOf(val) >= 0;
      });
    },
    IsSubsetOf: function(answer, inputs) {
      return answer.length < inputs.x.length && answer.every(function(val) {
        return inputs.x.indexOf(val) >= 0;
      });
    },
    IsSupersetOf: function(answer, inputs) {
      return answer.length > inputs.x.length && inputs.x.every(function(val) {
        return answer.indexOf(val) >= 0;
      });
    },
    HasElementsIn: function(answer, inputs) {
      return inputs.x.some(function(val) {
        return answer.indexOf(val) >= 0;
      });
    },
    HasElementsNotIn: function(answer, inputs) {
      return answer.some(function(val) {
        return inputs.x.indexOf(val) === -1;
      });
    },
    OmitsElementsIn: function(answer, inputs) {
      return inputs.x.some(function(val) {
        return answer.indexOf(val) === -1;
      });
    },
    IsDisjointFrom: function(answer, inputs) {
      return inputs.x.every(function(val) {
        return answer.indexOf(val) === -1;
      });
    }
  };
}]);
