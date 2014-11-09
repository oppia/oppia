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
 * @fileoverview Utilities for the gallery in end-to-end tests with protractor.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var editor = require('./editor.js');

// Here section can be 'status', 'category' or 'language'.
// If section = 'status' then label can be 'Featured', 'Public' or 'Private',
// otherwise it can be any category or language respectively.
// Verifies the previous state of the checkbox, then clicks it.
var _clickCheckbox = function(section, label, isPreviouslyTicked) {
  element(by.css('.protractor-test-gallery-' + section)).all(by.tagName('li')).
      map(function(option) {
    return option.getText().then(function(text) {
      if (text === label) {
        var checkbox = option.element(by.tagName('input'));
        if (isPreviouslyTicked) {
          expect(checkbox.isSelected()).toBeTruthy();
        } else {
          expect(checkbox.isSelected()).toBeFalsy();
        }
        checkbox.click();
        return true;
      }
      return false;
    });
  }).then(function(results) {
    var foundCheckbox = false;
    for (var i = 0; i < results.length; i++) {
      foundCheckbox = foundCheckbox || results[i];
    }
    if (!foundCheckbox) {
      throw Error('Checkbox ' + label + ' not found in section ' + section);
    }
  });
};

var tickCheckbox = function(section, label) {
  _clickCheckbox(section, label, false);
};

var untickCheckbox = function(section, label) {
  _clickCheckbox(section, label, true);
};

// Returns a promise of all explorations with the given name.
var _getExplorationElements = function(name) {
  return element.all(by.css('.oppia-gallery-tile')).filter(
      function(tile, index) {
    return tile.element(by.css('.oppia-gallery-tile-title')).getText().then(
        function(tileTitle) {
      return (tileTitle === name);
    });
  });
};

var expectExplorationToBeVisible = function(name) {
  _getExplorationElements(name).then(function(elems) {
    expect(elems.length).not.toBe(0);
  });
};

var expectExplorationToBeHidden = function(name) {
  _getExplorationElements(name).then(function(elems) {
    expect(elems.length).toBe(0);
  });
};

var playExploration = function(name) {
  _getExplorationElements(name).then(function(elems) {
    elems[0].element(by.css('.oppia-gallery-tile-title')).click();
  });
};

var editExploration = function(name) {
  _getExplorationElements(name).then(function(elems) {
    elems[0].element(by.css('.protractor-test-edit-exploration')).click();
  });
  editor.exitTutorialIfNecessary();
};

var getExplorationObjective = function(name) {
  return _getExplorationElements(name).then(function(elems) {
    return elems[0].element(by.css('.protractor-test-exploration-objective')).
      getText();
  });
};

exports.tickCheckbox = tickCheckbox;
exports.untickCheckbox = untickCheckbox;
exports.expectExplorationToBeVisible = expectExplorationToBeVisible;
exports.expectExplorationToBeHidden = expectExplorationToBeHidden;
exports.playExploration = playExploration;
exports.editExploration = editExploration;
exports.getExplorationObjective = getExplorationObjective;
