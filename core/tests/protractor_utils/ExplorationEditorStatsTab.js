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
  var issueElementStr = '.protractor-test-issue';
  var issueTitle = element(by.css('.protractor-test-issue-title'));
  var resolveBtn = element(by.css('.protractor-test-issue-resolve'));

  /**
     * Workflows
     */
  var _getNumPassersby = function() {
    return numPassersby.getText();
  };

  var _getIssueText = function(issueIndex) {
    return _getIssueElement(issueIndex).getText();
  };

  var _getIssueTitle = function() {
    return issueTitle.getText();
  };

  var _getIssueElement = function(issueIndex) {
    return element(by.css(issueElementStr + issueIndex.toString()));
  };

  this.expectNumPassersbyToBe = function(numPassersby) {
    expect(_getNumPassersby()).toMatch(numPassersby);
  };

  this.clickIssue = function(issueIndex, expectedIssueText) {
    expect(_getIssueText(issueIndex)).toMatch(expectedIssueText);
    _getIssueElement(issueIndex).click();
  };

  this.expectIssueTitleToBe = function(issueTitle) {
    expect(_getIssueTitle()).toMatch(issueTitle);
  };

  this.markResolved = function() {
    resolveBtn.click();
  };
};

exports.ExplorationEditorStatsTab = ExplorationEditorStatsTab;
