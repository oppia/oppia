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
 * carrrying out end-to-end testing with protractor.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var forms = require('./forms.js');
var general = require('./general.js')

var login = function(email, isSuperAdmin) {
  // Use of element is not possible because the login page is non-angular.
  // The full url is also necessary.
  var driver = protractor.getInstance().driver;
  driver.get(general.SERVER_URL_PREFIX + general.LOGIN_URL_SUFFIX);

  driver.findElement(protractor.By.name('email')).clear();
  driver.findElement(protractor.By.name('email')).sendKeys(email);
  if (isSuperAdmin) {
    driver.findElement(protractor.By.name('admin')).click();
  }
  driver.findElement(protractor.By.id('submit-login')).click();
};

var logout = function() {
  var driver = protractor.getInstance().driver;
  driver.get(general.SERVER_URL_PREFIX + general.LOGIN_URL_SUFFIX);
  driver.findElement(protractor.By.id('submit-logout')).click();
};

var _appendToConfigList = function(listName, textToAppend) {
  browser.get(general.ADMIN_URL_SUFFIX);
  element.all(
      by.repeater('(configPropertyId, configPropertyData) in configProperties')
    ).map(function(configProperty) {
    configProperty.element(by.tagName('em')).getText().then(function(title) {
      if (title.match(listName)) {
        var newEntry = forms.editList(configProperty).appendEntry();
        forms.editUnicode(newEntry, true).setText(textToAppend);
        element(by.buttonText('Save')).click();
        browser.driver.switchTo().alert().accept();
        // Time is needed for the saving to complete.
        protractor.getInstance().waitForAngular();
      }
    });
  });
};

// This will fail if the user already has a username.
var registerAsEditor = function(username) {
  browser.get('/gallery');
  element(by.css('.protractor-test-create-exploration')).click();
  element(by.model('username')).sendKeys(username);
  element(by.model('agreedToTerms')).click();
  element(by.buttonText('Submit and start contributing')).click();
};

var createUser = function(email, username) {
  login(email);
  registerAsEditor(username);
  logout();
};

var createAndLoginUser = function(email, username) {
  login(email);
  registerAsEditor(username);
};

var createModerator = function(email, username) {
  login(email, true);
  registerAsEditor(username);
  _appendToConfigList('Email addresses of moderators', email);
  logout();
};

var createAdmin = function(email, username) {
  login(email, true);
  registerAsEditor(username);
  _appendToConfigList('Email addresses of admins', email);
  logout();
};

exports.login = login;
exports.logout = logout;
exports.createUser = createUser;
exports.createAndLoginUser = createAndLoginUser;
exports.createModerator = createModerator;
exports.createAdmin = createAdmin;

