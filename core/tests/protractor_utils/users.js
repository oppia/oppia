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

var general = require('./general.js');
var waitFor = require('./waitFor.js');

var AdminPage = require('../protractor_utils/AdminPage.js');
var adminPage = new AdminPage.AdminPage();

var login = async function(email, isSuperAdmin = false) {
  // Use of element is not possible because the login page is non-angular.
  // The full url is also necessary.
  var driver = browser.driver;
  await driver.get(general.SERVER_URL_PREFIX + general.LOGIN_URL_SUFFIX);

  await (await driver.findElement(protractor.By.name('email'))).clear();
  await (await driver.findElement(protractor.By.name('email'))).sendKeys(email);
  if (isSuperAdmin) {
    await (await driver.findElement(protractor.By.name('admin'))).click();
  }
  await (await driver.findElement(protractor.By.id('submit-login'))).click();
};

var logout = async function() {
  var driver = browser.driver;
  await driver.get(general.SERVER_URL_PREFIX + general.LOGIN_URL_SUFFIX);
  await (await driver.findElement(protractor.By.id('submit-logout'))).click();
};

// The user needs to log in immediately before this method is called. Note
// that this will fail if the user already has a username.
var _completeSignup = async function(username) {
  // This is required since there is a redirect which can be considered
  // as a client side navigation and the tests fail since Angular is
  // not found due to the navigation interfering with protractor's
  // bootstrapping.
  await browser.waitForAngularEnabled(false);
  await browser.get('/signup?return_url=http%3A%2F%2Flocalhost%3A9001%2F');
  await browser.waitForAngularEnabled(true);
  var usernameInput = element(by.css('.protractor-test-username-input'));
  var agreeToTermsCheckbox = element(
    by.css('.protractor-test-agree-to-terms-checkbox'));
  var registerUser = element(by.css('.protractor-test-register-user'));
  await waitFor.visibilityOf(
    usernameInput, 'No username input field was displayed');
  await usernameInput.sendKeys(username);
  await agreeToTermsCheckbox.click();
  await registerUser.click();
  await waitFor.pageToFullyLoad();
};

var createUser = async function(email, username) {
  await createAndLoginUser(email, username);
  await logout();
};

var createAndLoginUser = async function(email, username) {
  await login(email);
  await _completeSignup(username);
};

var createModerator = async function(email, username) {
  await login(email, true);
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
  await login(email, true);
  await _completeSignup(username);
  await adminPage.get();
  await adminPage.updateRole(username, 'admin');
};

var createAdminMobile = async function(email, username) {
  await createAndLoginAdminUserMobile(email, username);
  await logout();
};

var createAndLoginAdminUserMobile = async function(email, username) {
  await login(email, true);
  await _completeSignup(username);
};

var isAdmin = async function() {
  return await element(by.css('.protractor-test-admin-text')).isPresent();
};

exports.isAdmin = isAdmin;
exports.login = login;
exports.logout = logout;
exports.createUser = createUser;
exports.createAndLoginUser = createAndLoginUser;
exports.createModerator = createModerator;
exports.createAdmin = createAdmin;
exports.createAndLoginAdminUser = createAndLoginAdminUser;
exports.createAdminMobile = createAdminMobile;
exports.createAndLoginAdminUserMobile = createAndLoginAdminUserMobile;
