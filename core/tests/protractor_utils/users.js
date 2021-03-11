// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utilities for user creation, login and privileging when
 * carrying out end-to-end testing with protractor.
 */

var FirebaseAdmin = require('firebase-admin');
var HashWasm = require('hash-wasm');
var general = require('./general.js');
var waitFor = require('./waitFor.js');
var action = require('./action.js');
var AdminPage = require('./AdminPage.js');
var adminPage = new AdminPage.AdminPage();

var _createFirebaseAccount = async function(email, isSuperAdmin = false) {
  var user = await FirebaseAdmin.auth().createUser({
    email: email,
    emailVerified: true,
    password: await HashWasm.md5(email),
  });
  if (isSuperAdmin) {
    await FirebaseAdmin.auth().setCustomUserClaims(
      user.uid, {role: 'super_admin'});
  }
};

var login = async function(email, manualNavigation = true) {
  // Use of element and action is not possible because the login page
  // is non-angular.
  // The full url is also necessary.
  var driver = browser.driver;
  // The manualNavigation argument is used to determine whether to navigate to
  // the login URL using driver.get() or not. If false, the calling method
  // should handle navigation to the login page.
  if (manualNavigation) {
    await driver.get(general.SERVER_URL_PREFIX + general.LOGIN_URL_SUFFIX);
  }

  await waitFor.alertToBePresent();
  const alert = await browser.switchTo().alert();
  await alert.sendKeys(email);
  await alert.accept();

  await waitFor.pageToFullyLoad();
};

var logout = async function() {
  await browser.driver.get(general.SERVER_URL_PREFIX + '/');

  await general.openProfileDropdown();
  await action.click(
    'logout link from dropdown', $('.protractor-test-logout-link'));
  await waitFor.pageToFullyLoad();
};

// The user needs to log in immediately before this method is called. Note
// that this will fail if the user already has a username.
var _completeSignup = async function(username, manualNavigation = true) {
  // The manualNavigation argument is used to determine whether to navigate to
  // the sign-up URL using browser.get() or not. If false, the calling method
  // should handle navigation to the sign-up page.
  if (manualNavigation) {
    // This is required since there is a redirect which can be considered
    // as a client side navigation and the tests fail since Angular is
    // not found due to the navigation interfering with protractor's
    // bootstrapping.
    await browser.waitForAngularEnabled(false);
    await browser.get('/signup?return_url=http%3A%2F%2Flocalhost%3A9001%2F');
    await browser.waitForAngularEnabled(true);
  }
  await waitFor.pageToFullyLoad();
  var usernameInput = element(by.css('.protractor-test-username-input'));
  var agreeToTermsCheckbox = element(
    by.css('.protractor-test-agree-to-terms-checkbox'));
  var registerUser = element(by.css('.protractor-test-register-user'));
  await action.sendKeys('Username input', usernameInput, username);
  await action.click('agreeToTerms Checkbox', agreeToTermsCheckbox);
  await action.click('Register User button', registerUser);
  await waitFor.pageToFullyLoad();
};

var completeLoginFlowFromStoryViewerPage = async function(email, username) {
  await _createFirebaseAccount(email);
  await login(email, false);
  await _completeSignup(username, false);
};

var createUser = async function(email, username) {
  await createAndLoginUser(email, username);
  await logout();
};

var createAndLoginUser = async function(email, username) {
  await _createFirebaseAccount(email);
  await login(email);
  await _completeSignup(username);
};

var createModerator = async function(email, username) {
  await _createFirebaseAccount(email, true);
  await login(email);
  await _completeSignup(username);
  await adminPage.get();
  await adminPage.updateRole(username, 'moderator');
  await logout();
};

var createAdmin = async function(email, username) {
  await createAndLoginAdminUser(email, username);
  await logout();
};

var createAndLoginAdminUser = async function(email, username) {
  await _createFirebaseAccount(email, true);
  await login(email);
  await _completeSignup(username);
  await adminPage.get();
  await adminPage.updateRole(username, 'admin');
};

var createAdminMobile = async function(email, username) {
  await createAndLoginAdminUserMobile(email, username);
  await logout();
};

var createAndLoginAdminUserMobile = async function(email, username) {
  await _createFirebaseAccount(email, true);
  await login(email);
  await _completeSignup(username);
};

var isAdmin = async function() {
  return await element(by.css('.protractor-test-admin-text')).isPresent();
};

exports.isAdmin = isAdmin;
exports.login = login;
exports.logout = logout;
exports.completeLoginFlowFromStoryViewerPage = (
  completeLoginFlowFromStoryViewerPage);
exports.createUser = createUser;
exports.createAndLoginUser = createAndLoginUser;
exports.createModerator = createModerator;
exports.createAdmin = createAdmin;
exports.createAndLoginAdminUser = createAndLoginAdminUser;
exports.createAdminMobile = createAdminMobile;
exports.createAndLoginAdminUserMobile = createAndLoginAdminUserMobile;
