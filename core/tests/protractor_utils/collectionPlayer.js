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
 * @fileoverview Utilities for manipulating the collection player when
 * carrrying out end-to-end testing with protractor.
 */

var general = require('./general.js');
var player = require('./player.js');

// Visit the demo collection.
var goToDemoCollection = function() {
  browser.get('/collection/0');
};

// Verify that the "SIGN IN" button appears correctly in guest's view.
var verifySignInButton = function() {
  var text = element(by.css('.protractor-test-sign-in-button')).getText();
  expect(text).toBe('SIGN IN');
};

// Play the first exploration in the demo collection.
//   Assumes we are starting from the demo collection page.
var playDemoExplorationOne = function() {
  // Start the first exploration (from the demo collection page).
  var explButton = element.all(by.css(
    '.protractor-test-collection-expl-node')).get(0);
  explButton.click();

  player.submitAnswer(
    'MultipleChoiceInput', 'It\'s translated from a different language.');
  browser.waitForAngular();
  player.clickThroughToNextCard();
  
  player.submitAnswer('TextInput', 'Finnish');
  browser.waitForAngular();
  general.waitForSystem(5000);
  player.clickThroughToNextCard();

  // The below may give "element not clickable" error.
  player.submitAnswer('NumericInput', 121);
  browser.waitForAngular();
  player.clickThroughToNextCard();
  // Function needs to be finished
}  

// Play the third exploration in the demo collection.
//   Assumes we are starting from the demo collection page.
var playDemoExplorationThree = function() {
  // Start the third exploration (from the demo collection page).
  var explButton = element.all(by.css(
    '.protractor-test-collection-expl-node')).get(2);
  explButton.click();

  player.submitAnswer('NumericInput', 6);
    
  answer = 'If there are n choices for a given position,' +
    'then there are n-1 choices for the next, etc...';
  player.submitAnswer('TextInput', answer);
  player.clickThroughToNextCard();

  player.submitAnswer('NumericInput', 24);
  player.clickThroughToNextCard();
};

// Verify that the suggested exploration is the expected one.
var verifySuggestedExplorationAsGuest = function() {
  explTitle = element.all(by.css(
    '.protractor-test-exp-summary-tile-title')).first().getText();
  expect(explTitle).toBe('Demonstrating string classifier');
}

// Verify that there are expNumUncompletedNodes uncompleted explorations shown
//   in the collection player.
var verifyNumUncompletedExplorations = function(expNumUncompletedNodes) {
  uncompletedNodes = element.all(by.css(
    '.protractor-test-uncompleted-expl-thumbnail'));
  actualNumUncompleted = uncompletedNodes.count();
  expect(actualNumUncompleted).toEqual(expNumUncompletedNodes);
}

// Verify that the profile dropdown button is visible, i.e. we are logged-in.
var verifyProfileDropdown = function() {
  expect(element.all(by.css(
    '.protractor-test-profile-dropdown')).count()).toEqual(1);
}

exports.goToDemoCollection = goToDemoCollection;
exports.verifySignInButton = verifySignInButton;
exports.playDemoExplorationOne = playDemoExplorationOne;
exports.playDemoExplorationThree = playDemoExplorationThree;
exports.verifySuggestedExplorationAsGuest = verifySuggestedExplorationAsGuest;
exports.verifyNumUncompletedExplorations = verifyNumUncompletedExplorations;
exports.verifyProfileDropdown = verifyProfileDropdown;
