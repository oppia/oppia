// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Page object for the exploration player, for use in WebdriverIO
 * tests.
 */

var action = require('./action.js');
var forms = require('./forms.js');
var waitFor = require('./waitFor.js');
var interactions = require('../../../extensions/interactions/protractor.js');
var action = require('./action.js');

var ExplorationPlayerPage = function() {
  // This verifies the question just asked, including formatting and
  // rich-text components. To do so the richTextInstructions function will be
  // sent a handler (as given in forms.RichTextChecker) to which calls such as
  //   handler.readItalicText('slanted');
  // can then be sent.
  this.expectContentToMatch = async function(richTextInstructions) {
    var conversationContent = $$('.protractor-test-conversation-content');
    await waitFor.visibilityOf(
      conversationContent[0], 'Conversation not visible');
    await waitFor.visibilityOf(
      conversationContent[0], 'Conversation not fully present');
    await forms.expectRichText(
      conversationContent.last()
    ).toMatch(richTextInstructions);
  };

  this.expectExplorationNameToBe = async function(name) {
    var explorationHeader = $('.protractor-test-exploration-header');
    await waitFor.visibilityOf(
      explorationHeader, 'Exploration Header taking too long to appear.');
    await waitFor.textToBePresentInElement(
      explorationHeader, name, 'No Header Text');
    expect(
      await explorationHeader.getText()
    ).toBe(name);
  };
};

exports.ExplorationPlayerPage = ExplorationPlayerPage;
