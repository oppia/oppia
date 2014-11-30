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

/* Each interactive widget's protractor file must implement the following:
 * customizeInteraction: a function that receives an element containing the
 *   widget editor followed by some number of arguments used to customize the
 *   widget in question (e.g options for the MultipleChoiceInput).
 * expectInteractionDetailsToMatch: a function that receives arguments
 *   describing the way the widget is expected to look, and is run in the
 *   player to verify the widget actually looks this way.
 * submitAnswer: a function that is sent a single 'answer' argument and should
 *   then use it to answer the widget in this way, for example by selecting an
 *   option in MultipleChoiceInput.
 * submissionHandler: the name of the type of object returned by the widget.
 * testSuite: an array of dictionaries each containing:
 * - interactionArguments: an array of arguments that will be splatted and sent
 *   (together with the editor element) to the widget's customizeInteraction()
 *   function.
 * - ruleArguments: an array of arguments, the first of which should be the
 *   name of the rule to be used and the rest parameters for that rule.
 * - expectInteractionDetails: an array of arguments that will be splatted and
 *   sent to expectInteractionDetailsToMatch when the widget is being run in
 *   the player.
 * - wrongAnswers: an array of arguments that will be submitted in sequence via
 *   the widget's submitAnswer() function; it will be verified that all these
 *   answers fail to satisfy the given rule.
 * - correctAnswers: likewise, but these should satisfy the rule.
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

exports.INTERACTIVE_WIDGETS = INTERACTIVE_WIDGETS;
exports.NONINTERACTIVE_WIDGETS = NONINTERACTIVE_WIDGETS;
exports.getInteractive = getInteractive;
exports.getNoninteractive = getNoninteractive;
