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
 * @fileoverview Page object for user creation, login and privileging, for
   use in Protractor tests.
 */

var forms = require('./forms.js');
var general = require('./general.js');
var AdminPage = require('../protractor_utils/AdminPage.js');

var adminPage = new AdminPage.AdminPage();

var UsersPage = function(){
	var SERVER_URL_PREFIX = 'http://localhost:9001';
	var LOGIN_URL_SUFFIX = '/_ah/login';
    var userInput = element(by.css('.protractor-test-username-input'))
    var registerButton = element(by.css('.protractor-test-register-user'))
    var AgreeToTermBox = element(by.css('.protractor-test-agree-to-terms-checkbox'))

	var findElementByName = function(driver,name){
      return driver.findElement(protractor.By.name(name))
	}

	var findElementById = function(driver,id){
      return driver.findElement(protractor.By.id(id))
	}

	this.login = function(email, isSuperAdmin) {
      // Use of element is not possible because the login page is non-angular.
      // The full url is also necessary.
      var driver = browser.driver;
  	  driver.get(SERVER_URL_PREFIX + LOGIN_URL_SUFFIX);

  	  findElementByName(driver,'email').clear();
  	  findElementByName(driver,'email').sendKeys(email);
  	  if (isSuperAdmin) {
    	findElementByName(driver,'admin').click();
  	  }
  	  findElementById(driver,'submit-login').click();
	};

	this.logout = function() {
      var driver = browser.driver;
      driver.get(SERVER_URL_PREFIX + LOGIN_URL_SUFFIX);
      findElementById(driver,'submit-logout').click();
    };

    // The user needs to log in immediately before this method is called. Note
	// that this will fail if the user already has a username.
	this._completeSignup = function(username) {
	  browser.get('/signup?return_url=http%3A%2F%2Flocalhost%3A9001%2F');
	  userInput.sendKeys(username);
	  AgreeToTermBox.click();
	  registerButton.click();
	};

	this.createUser = function(email, username) {
	  this.login(email);
	  this._completeSignup(username);
	  general.waitForSystem();
	  this.logout();
	};

	this.createAndLoginUser = function(email, username) {
	  this.login(email);
	  this._completeSignup(username);
	};

	this.createModerator = function(email, username) {
	  this.login(email, true);
	  this._completeSignup(username);
	  adminPage.updateRole(username, 'moderator');
	  this.logout();
	};

	this.createAdmin = function(email, username) {
	  this.createAndLoginAdminUser(email, username);
	  this.logout();
	};

	this.createAndLoginAdminUser = function(email, username) {
	  this.login(email, true);
	  this._completeSignup(username);
	  adminPage.updateRole(username, 'admin');
	};
};

exports.UsersPage = UsersPage;
