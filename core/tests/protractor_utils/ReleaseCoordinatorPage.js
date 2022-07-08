// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the release coordinator page, for use in
 * Protractor tests.
 */

var action = require('./action.js');
var waitFor = require('./waitFor.js');

var ReleaseCoordinatorPage = function() {
  var oneOffJobRows = element.all(by.css('.e2e-test-one-off-jobs-rows'));
  var unfinishedOneOffJobRows = element.all(by.css(
    '.e2e-test-unfinished-one-off-jobs-rows'));
  var unfinishedOffJobIDClassName = (
    '.e2e-test-unfinished-one-off-jobs-id');
  var oneOfJobsStartBtnLocator = by.css(
    '.e2e-test-one-off-jobs-start-btn');
  var oneOffJobsStopBtnLocator = by.css(
    '.e2e-test-one-off-jobs-stop-btn');
  var unfinishedOneOffJobsIdElements = element.all(
    by.css('.e2e-test-unfinished-one-off-jobs-id'));
  var unfinishedJobsCardElement = element(
    by.css('.e2e-test-unfinished-jobs-card'));

  this.get = async function() {
    await browser.get('/release-coordinator');
    await waitFor.pageToFullyLoad();
  };

  this.startOneOffJob = async function(jobName) {
    await this._startOneOffJob(jobName, 0);
  };

  this._startOneOffJob = async function(jobName, i) {
    await waitFor.visibilityOf(
      oneOffJobRows.first(),
      'Starting one off jobs taking too long to appear.');
    await waitFor.visibilityOf(
      oneOffJobRows.get(i), 'Could not get One Off Jobs');
    var text = await oneOffJobRows.get(i).getText();
    if (text.toLowerCase().startsWith(jobName.toLowerCase())) {
      var oneOffJobRowsButton = oneOffJobRows.get(i).element(
        oneOfJobsStartBtnLocator);
      await action.click('One Off Job Rows Button', oneOffJobRowsButton);
    } else {
      await this._startOneOffJob(jobName, ++i);
    }
  };

  this.stopOneOffJob = async function(jobName) {
    await this._stopOneOffJob(jobName, 0);
  };

  this._stopOneOffJob = async function(jobName, i) {
    await waitFor.visibilityOf(
      unfinishedOneOffJobRows.get(i),
      'Could not get Unfinished Off Job');
    var text = await unfinishedOneOffJobRows.get(i).getText();
    if (text.toLowerCase().startsWith(jobName.toLowerCase())) {
      var unfinishedOffJobRowsButton = unfinishedOneOffJobRows.get(i).element(
        oneOffJobsStopBtnLocator);
      await action.click(
        'UnfinishedOffJobRowsButton', unfinishedOffJobRowsButton);
      await browser.refresh();
      await waitFor.pageToFullyLoad();
    } else {
      await this._stopOneOffJob(jobName, ++i);
    }
  };

  this.expectNumberOfRunningOneOffJobs = async function(count) {
    var len = await unfinishedOneOffJobsIdElements.count();
    expect(len).toEqual(count);
  };

  this.expectJobToBeRunning = async function(jobName) {
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await waitFor.visibilityOf(
      unfinishedJobsCardElement, 'Unfinished Jobs taking too long to appear');
    let regex = new RegExp(`^${jobName.toLowerCase()}.*`, 'i');
    let unfinishedJob = element(
      by.cssContainingText(unfinishedOffJobIDClassName, regex));
    var unfinishedJobName = await unfinishedJob.getText();
    expect(unfinishedJobName.toLowerCase().startsWith(
      jobName.toLowerCase())).toEqual(true);
  };
};

exports.ReleaseCoordinatorPage = ReleaseCoordinatorPage;
