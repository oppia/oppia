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
 * @fileoverview Page object for the creator dashboard, for use in WebdriverIO
 * tests.
 */

var waitFor = require('./waitFor.js');
var action = require('./action.js');

var CreatorDashboardPage = function() {
  var CREATOR_DASHBOARD_URL = '/creator-dashboard';

  this.get = async function() {
    await browser.url(CREATOR_DASHBOARD_URL);
    await waitFor.pageToFullyLoad();
  };

  this.clickCreateCollectionButton = async function() {
    var activityCreationModal = await $('.protractor-test-creation-modal');
    await waitFor.visibilityOf(
      activityCreationModal, 'Activity Creation modal is not visible');
    var createCollectionButton = await $('.protractor-test-create-collection');
    await action.click('Create Collection Button', createCollectionButton);
    await waitFor.pageToFullyLoad();
    var collectionEditorContainer = await $(
      '.protractor-test-collection-editor-cards-container');
    await waitFor.visibilityOf(collectionEditorContainer);
  };

  this.clickCreateActivityButton = async function() {
    var createActivityButton = await $('.protractor-test-create-activity');
    await action.click('Create Activity Button', createActivityButton);
    await waitFor.pageToFullyLoad();
  };
};

exports.CreatorDashboardPage = CreatorDashboardPage;
