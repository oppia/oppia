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
  var numPassersby = element(by.css('.e2e-test-num-passersby'));
  var issueElementStr = '.e2e-test-issue';
  var issueTitle = element(by.css('.e2e-test-issue-title'));
  var resolveBtn = element(by.css('.e2e-test-issue-resolve'));

  /**
     * Workflows
     */
  var _getNumPassersby = async function() {
    return await numPassersby.getText();
  };

  var _getIssueText = async function(issueIndex) {
    return await _getIssueElement(issueIndex).getText();
  };

  var _getIssueTitle = async function() {
    return await issueTitle.getText();
  };

  var _getIssueElement = function(issueIndex) {
    return element(by.css(issueElementStr + issueIndex.toString()));
  };

  this.expectNumPassersbyToBe = async function(numPassersby) {
    expect(await _getNumPassersby()).toMatch(numPassersby);
  };

  this.clickIssue = async function(issueIndex, expectedIssueText) {
    expect(await _getIssueText(issueIndex)).toMatch(expectedIssueText);
    await _getIssueElement(issueIndex).click();
  };

  this.expectIssueTitleToBe = async function(issueTitle) {
    expect(await _getIssueTitle()).toMatch(issueTitle);
  };

  this.markResolved = async function() {
    await resolveBtn.click();
  };
};

exports.ExplorationEditorStatsTab = ExplorationEditorStatsTab;
