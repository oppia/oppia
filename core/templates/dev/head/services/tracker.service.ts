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
 * @fileoverview Service for tracking the sequence of learner actions.
 */

angular.module('oppia').factory('TrackerService', [
  function() {
    var _sequenceOfActions = [];

    return {
      reset: function() {
        _sequenceOfActions = [];
      },
      addAction: function(action) {
        _sequenceOfActions.push(action);
      },
      getSequenceOfActions: function() {
        return _sequenceOfActions;
      }
    };
  }]);
