// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the preferences page, for use in Protractor
 * tests.
 */

 var PreferencesPage = function() {
 	var USER_PREFERENCES_URL = '/preferences';
 	var editorRoleBox = element(by.model('canReceiveEditorRoleEmail'));
 	var feedbackMessageBox = element(by.model('canReceiveFeedbackMessageEmail'));
 	var subscribers = element.all(by.css('.protractor-test-subscription-name');

 	var getBox = function(name) {
 		if(name=='feedback') {
 			return feedbackMessageBox;
 		}
 		else if(name=='editor') {
 			return editorRoleBox;
 		}
 			

 	};
 	this.get = function() {
    return browser.get(USER_PREFERENCES_URL);
 	};

 	this.getValue = function(name) {
 		return getBox(name).isSelected();
 	};

 	this.clickBox = function(name) {
 		getBox(name).click();
 	};

 	this.expectFirstSubscriberToBe = function(name) {
 		expect(subscribers.first().getText().toMatch(name));
 	};

 	this.expectLastSubscriberToBe = function(name) {
 		expect(subscribers.last().getText().toMatch(name));
 	};

 	this.expectSubscriberCountToEqual = function(value) {
 		expect(subscribers.count()).toEqual(value);
 	};
 };

 export.PreferencesPage = PreferencesPage;
