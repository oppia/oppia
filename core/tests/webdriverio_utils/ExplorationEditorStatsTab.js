// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * Webdriverio tests.
 */

var action = require('./action');

var ExplorationEditorStatsTab = function () {
  /**
   * Interactive elements
   */
  var numPassersby = $('.e2e-test-num-passersby');
  var issueElementStr = '.e2e-test-issue';
  var issueTitle = $('.e2e-test-issue-title');
  var resolveBtn = $('.e2e-test-issue-resolve');

  /**
   * Workflows
   */
  var _getNumPassersby = async function () {
    var numPasserByText = await action.getText(
      'Number Passer By',
      numPassersby
    );
    return numPasserByText;
  };

  var _getIssueText = async function (issueIndex) {
    var issueElement = _getIssueElement(issueIndex);
    var issueElementText = await action.getText('Issue Element', issueElement);
    return issueElementText;
  };

  var _getIssueTitle = async function () {
    var issueTitleText = await action.getText(
      'Issue Title Element',
      issueTitle
    );
    return issueTitleText;
  };

  var _getIssueElement = function (issueIndex) {
    return $(`${issueElementStr}${issueIndex.toString()}`);
  };

  this.expectNumPassersbyToBe = async function (numPassersby) {
    expect(await _getNumPassersby()).toMatch(numPassersby);
  };

  this.clickIssue = async function (issueIndex, expectedIssueText) {
    expect(await _getIssueText(issueIndex)).toMatch(expectedIssueText);
    var issueElement = _getIssueElement(issueIndex);
    await action.click('Issue Element', issueElement);
  };

  this.expectIssueTitleToBe = async function (issueTitle) {
    expect(await _getIssueTitle()).toMatch(issueTitle);
  };

  this.markResolved = async function () {
    await action.click('Resolve Button', resolveBtn);
  };
};

exports.ExplorationEditorStatsTab = ExplorationEditorStatsTab;
