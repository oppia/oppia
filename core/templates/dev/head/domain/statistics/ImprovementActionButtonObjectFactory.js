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
 * @fileoverview Domain objects for the actionable items creators may take when
 * trying to resolve a particular improvement suggestion.
 */

oppia.factory('ImprovementActionButtonObjectFactory', [function() {
  /**
   * @constructor
   * @param {string} name - the name of the action. Should correspond to a I18N
   *    name.
   * @param {callback} action - function to run when the action is requested to
   *    be performed.
   */
  var ImprovementActionButton = function(name, action) {
    this._name = name;
    this._action = action;
  };

  /** @returns {string} - the I18N-compatible name of the action */
  ImprovementActionButton.prototype.getName = function() {
    return this._name;
  };

  /** Performs the associated action and return its result as a promise */
  ImprovementActionButton.prototype.performAction = function() {
    return Promise.resolve(this._action());
  };

  return {
    /**
     * @returns {ImprovementActionButton}
     * @param {string} name - the name of the action. Should correspond to a
     *    I18N name.
     * @param {callback} action - function to run when the action is requested
     *    to be performed.
     */
    createNew: function(name, action) {
      return new ImprovementActionButton(name, action);
    },
  };
}]);
