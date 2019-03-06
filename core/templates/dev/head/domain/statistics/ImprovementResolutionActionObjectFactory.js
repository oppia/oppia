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
 * @fileoverview Unit tests for the PlaythroughImprovementCardObjectFactory.
 */

oppia.factory('ImprovementResolutionActionObjectFactory', [function() {
  var ImprovementResolutionAction = function(name, action) {
    this._name = name;
    this._action = action;
  };

  ImprovementResolutionAction.prototype.getName = function() {
    return this._name;
  };

  ImprovementResolutionAction.prototype.performAction = function() {
    this._action();
  };

  return {
    createNew: function(name, action) {
      return new ImprovementResolutionAction(name, action);
    },
  };
}]);
