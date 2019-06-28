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
 * @fileoverview Domain objects for the buttons creators may click to attempt to
 * resolve a particular improvement suggestion.
 */

oppia.factory('ImprovementActionButtonObjectFactory', [function() {
  /**
   * @constructor
   * @param {string} text - The text displayed on the button.
   * @param {callback} actionFunc - Function to run when the button is clicked.
   * @param {string} [cssClass=btn-default] - The CSS class to render the button
   *    with.
   */
  var ImprovementActionButton = function(text, actionFunc, cssClass) {
    this._text = text;
    this._actionFunc = actionFunc;
    this._cssClass = cssClass || 'btn-default';
  };

  /** @returns {string} - The text of the action (text rendered in button). */
  ImprovementActionButton.prototype.getText = function() {
    return this._text;
  };

  /** Performs the associated action and return its result. */
  ImprovementActionButton.prototype.execute = function() {
    return this._actionFunc();
  };

  /** Returns the CSS class of the button. */
  ImprovementActionButton.prototype.getCssClass = function() {
    return this._cssClass;
  };

  return {
    /**
     * @returns {ImprovementActionButton}
     * @param {string} text - The text displayed on the button.
     * @param {callback} actionFunc - Function to run when the button is
     *    clicked.
     * @param {string} [cssClass=btn-default] - The CSS class to render the
     *    button with.
     */
    createNew: function(text, actionFunc, cssClass) {
      return new ImprovementActionButton(text, actionFunc, cssClass);
    },
  };
}]);
