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
 * @fileoverview End-to-end tests for user preferences.
 */

var PreferencesPage = require('../webdriverio_utils/PreferencesPage.js');
var general = require('../webdriverio_utils/general.js');
var users = require('../webdriverio_utils/users.js');
var waitFor = require('../webdriverio_utils/waitFor.js');

describe('Preferences', function() {
  var preferencesPage = null;

  beforeEach(function() {
    preferencesPage = new PreferencesPage.PreferencesPage();
  });

  it('should let a user upload a profile photo', async function() {
    await users.createUser('eve@preferences.com', 'evePreferences');
    await users.login('eve@preferences.com');
    await preferencesPage.get();
    var defaultProfilePhotoSource = (
      await preferencesPage.getProfilePhotoSource());
    await preferencesPage.submitProfilePhoto('../data/img.png', false);
    var newProfilePhotoSource = await preferencesPage.getProfilePhotoSource();
    expect(defaultProfilePhotoSource).not.toEqual(newProfilePhotoSource);
  });

  it('should show an error if uploaded photo is too large', async function() {
    await users.createUser('lou@preferences.com', 'louPreferences');
    await users.login('lou@preferences.com');
    await preferencesPage.get();
    await waitFor.pageToFullyLoad();
    await preferencesPage.uploadProfilePhoto(
      '../data/dummy_large_image.jpg', false);
    await preferencesPage.expectUploadError();
  });

  it('should change editor role email checkbox value', async function() {
    await users.createUser('alice@preferences.com', 'alicePreferences');
    await users.login('alice@preferences.com');
    await preferencesPage.get();
    await waitFor.pageToFullyLoad();
    expect(await preferencesPage.isEditorRoleEmailsCheckboxSelected()).toBe(
      true);
    await preferencesPage.toggleEditorRoleEmailsCheckbox();
    expect(await preferencesPage.isEditorRoleEmailsCheckboxSelected()).toBe(
      false);
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    expect(await preferencesPage.isEditorRoleEmailsCheckboxSelected()).toBe(
      false);
  });

  it('should change feedback message email checkbox value', async function() {
    await users.createUser('bob@preferences.com', 'bobPreferences');
    await users.login('bob@preferences.com');
    await preferencesPage.get();
    await waitFor.pageToFullyLoad();
    expect(await preferencesPage.isFeedbackEmailsCheckboxSelected()).toBe(true);
    await preferencesPage.toggleFeedbackEmailsCheckbox();
    expect(await preferencesPage.isFeedbackEmailsCheckboxSelected()).toBe(
      false);
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    expect(await preferencesPage.isFeedbackEmailsCheckboxSelected()).toBe(
      false);
  });

  it('should set and edit bio in user profile', async function() {
    await users.createUser('lisa@preferences.com', 'lisaPreferences');
    await users.login('lisa@preferences.com');
    await preferencesPage.get();
    await preferencesPage.setUserBio('I am Lisa');
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await preferencesPage.expectUserBioToBe('I am Lisa');

    await preferencesPage.setUserBio('Junior student');
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await preferencesPage.expectUserBioToBe('Junior student');

    await preferencesPage.editUserBio(' from USA');
    await preferencesPage.editUserBio(' studying CS!');
    await browser.refresh();
    await waitFor.pageToFullyLoad();
    await preferencesPage.expectUserBioToBe(
      'Junior student from USA studying CS!');
  });

  it('should change prefered audio language of the learner', async function() {
    await users.createUser('paul@preferences.com', 'paulPreferences');
    await users.login('paul@preferences.com');
    await preferencesPage.get();
    expect(preferencesPage.preferredAudioLanguageSelector).toBeUndefined();
    await preferencesPage.selectPreferredAudioLanguage('हिन्दी (Hindi)');
    await preferencesPage.expectPreferredAudioLanguageToBe('हिन्दी (Hindi)');
    await browser.refresh();
    await waitFor.pageToFullyLoad();

    await preferencesPage.expectPreferredAudioLanguageToBe('हिन्दी (Hindi)');
    await preferencesPage.selectPreferredAudioLanguage('magyar (Hungarian)');
    await preferencesPage.expectPreferredAudioLanguageToBe(
      'magyar (Hungarian)');
    await browser.refresh();
    await waitFor.pageToFullyLoad();

    await preferencesPage.expectPreferredAudioLanguageToBe(
      'magyar (Hungarian)');
  });

  it('should change prefered site language of the learner', async function() {
    await users.createUser('john@preferences.com', 'johnPreferences');
    await users.login('john@preferences.com');
    await preferencesPage.get();
    expect(preferencesPage.systemLanguageSelector).toBeUndefined();
    await preferencesPage.selectSystemLanguage('Español');
    await preferencesPage.expectPreferredSiteLanguageToBe('Español');
    await browser.refresh();
    await waitFor.pageToFullyLoad();

    await preferencesPage.expectPreferredSiteLanguageToBe('Español');
    await preferencesPage.selectSystemLanguage('English');
    await preferencesPage.expectPreferredSiteLanguageToBe('English');
    await browser.refresh();
    await waitFor.pageToFullyLoad();

    await preferencesPage.expectPreferredSiteLanguageToBe('English');
  });

  it('should load the correct dashboard according to selection',
    async function() {
      await users.createUser('lorem@preferences.com', 'loremPreferences');
      await users.login('lorem@preferences.com');
      await preferencesPage.get();
      await preferencesPage.selectCreatorDashboard();
      await general.goToHomePage();
      await waitFor.urlToBe('http://localhost:8181/creator-dashboard');

      await preferencesPage.get();
      await preferencesPage.selectContributorDashboard();
      await general.goToHomePage();
      await waitFor.urlToBe('http://localhost:8181/contributor-dashboard');

      await preferencesPage.get();
      await preferencesPage.selectLearnerDashboard();
      await general.goToHomePage();
      await waitFor.urlToBe('http://localhost:8181/learner-dashboard');
    });

  it('should navigate to account deletion page',
    async function() {
      await users.createUser('delete@page.com', 'deletePage');
      await users.login('delete@page.com');
      await preferencesPage.get();
      await preferencesPage.clickDeleteAccountButton();
      await waitFor.urlToBe('http://localhost:8181/delete-account');
    });

  it('should export account data',
    async function() {
      await users.createUser('export@preferences.com', 'exportPreferences');
      await users.login('export@preferences.com');
      await preferencesPage.get();
      await preferencesPage.clickExportAccountButton();
      await waitFor.fileToBeDownloaded('oppia_takeout_data.zip');
    }
  );

  afterEach(async function() {
    await general.checkForConsoleErrors([]);
    await users.logout();
  });
});
