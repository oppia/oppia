// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the exploration editor's stats tab, for use in
 * Protractor tests.
 */

var ExplorationEditorStatsTab = function() {
  /**
     * Interactive elements
     */
  var numPassersby = element(by.css('.protractor-test-num-passersby'));

  /**
     * Workflows
     */
  var _getNumPassersby = function() {
    return numPassersby.getText();
  };

  this.expectNumPassersbyToBe = function(numPassersby) {
    expect(_getNumPassersby()).toMatch(numPassersby);
  };
};

exports.ExplorationEditorStatsTab = ExplorationEditorStatsTab;
