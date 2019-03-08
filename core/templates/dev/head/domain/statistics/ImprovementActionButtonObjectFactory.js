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
 * @fileoverview Domain objects for the actions creators may take when trying to
 * resolve a particular improvement suggestion.
 */

oppia.factory('ImprovementActionButtonObjectFactory', [function() {
  /**
   * @constructor
   * @param {string} name - the name of the action.
   * @param {callback} actionFunc - function to run when the action is requested
   *    to be performed.
   */
  var ImprovementActionButton = function(name, actionFunc) {
    this._name = name;
    this._actionFunc = actionFunc;
  };

  /** @returns {string} - the name of the action (text rendered in button). */
  ImprovementActionButton.prototype.getName = function() {
    return this._name;
  };

  /** Performs the associated action and return its result as a promise */
  ImprovementActionButton.prototype.execute = function() {
    return Promise.resolve(this._actionFunc());
  };

  return {
    /**
     * @returns {ImprovementActionButton}
     * @param {string} name - the name of the action.
     * @param {callback} actionFunc - function to run when the action is
     *    requested to be performed.
     */
    createNew: function(name, actionFunc) {
      return new ImprovementActionButton(name, actionFunc);
    },
  };
}]);
