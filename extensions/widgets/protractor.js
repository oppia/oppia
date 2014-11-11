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
 * @fileoverview Clearing-house for widget utilities for protractor tests.
 *
 * @author Jacob Davis (jacobdavis11@gmail.com)
 */

var INTERACTIVE_WIDGETS = {
  Continue: require(
    './interactive/Continue/protractor.js'),
  MultipleChoiceInput: require(
    './interactive/MultipleChoiceInput/protractor.js'),
  NumericInput: require(
    './interactive/NumericInput/protractor.js'),
  TextInput: require(
    './interactive/TextInput/protractor.js')
};

var NONINTERACTIVE_WIDGETS = {
  Collapsible: require(
    './noninteractive/Collapsible/protractor.js'),
  Image: require(
    './noninteractive/Image/protractor.js'),
  Link: require(
    './noninteractive/Link/protractor.js'),
  Math: require(
    './noninteractive/Math/protractor.js'),
  Tabs: require(
    './noninteractive/Tabs/protractor.js'),
  Video: require(
    './noninteractive/Video/protractor.js')
};

var getInteractive = function(widgetName) {
  if (INTERACTIVE_WIDGETS.hasOwnProperty(widgetName)) {
    return INTERACTIVE_WIDGETS[widgetName];
  } else {
    throw Error('Unknown interactive widget: ' + widgetName);
  }
};

var getNoninteractive = function(widgetName) {
  if (NONINTERACTIVE_WIDGETS.hasOwnProperty(widgetName)) {
    return NONINTERACTIVE_WIDGETS[widgetName];
  } else {
    throw Error('Unknown non-interactive widget: ' + widgetName);
  }
};

exports.getInteractive = getInteractive;
exports.getNoninteractive = getNoninteractive;
