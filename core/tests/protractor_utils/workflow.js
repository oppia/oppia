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
 * @fileoverview Utilities for exploration creation, publication ect. when
 * carrrying out end-to-end testing with protractor.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

// Creates an exploration and opens its editor.
var createExploration = function(name, category) {
  browser.get('/gallery');
  element(by.css('.btn-lg')).click();
  element(by.model('newExplorationTitle')).sendKeys(name);
  objects.editDropdown(element(by.tagName('select2-dropdown'))).
    sendText(category);
  element(by.css('.select2-container')).click();
  element(by.css('.select2-input')).sendKeys(category + '\n');
  element(by.buttonText('Save')).click();
};

// Moves from exploration editor view to reader view; there must be no unsaved
// changes.
// NOTE: we do not use the button because that will open in a new window.
var moveToReader = function() {
  browser.getCurrentUrl().then(function(url) {
    expect(url.slice(0, 29)).toBe('http://localhost:4445/create/');
    var explorationID = url.slice(29, 41);
    browser.get('/explore/' + explorationID);
  });
};

exports.createExploration = createExploration;
exports.moveToReader = moveToReader;