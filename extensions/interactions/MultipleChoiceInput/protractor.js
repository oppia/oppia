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
 * @fileoverview End-to-end testing utilities for the Multiple Choice
 * interaction.
 */

var forms = require(process.cwd() + '/core/tests/protractor_utils/forms.js');

// The members of richTextInstructionsArray are functions, one for each option,
// which will each be passed a 'handler' that they can use to edit the
// rich-text area of the option, for example by
//   handler.appendUnderlineText('emphasised');
var customizeInteraction = function(elem, richTextInstructionsArray) {
  forms.ListEditor(elem).setLength(richTextInstructionsArray.length);
  for (var i = 0; i < richTextInstructionsArray.length; i++) {
    var richTextEditor = forms.ListEditor(elem).editItem(i, 'RichText');
    richTextEditor.clear();
    richTextInstructionsArray[i](richTextEditor);
  }
};

// These members of richTextInstructionsArray each describe how to check one of
// the options.
var expectInteractionDetailsToMatch = function(
    elem, richTextInstructionsArray) {
  elem.all(by.css('.protractor-test-multiple-choice-option-container'))
    .then(function(optionElements) {
      expect(optionElements.length).toEqual(richTextInstructionsArray.length);
      var promises = [];
      for (var i = 0; i < optionElements.length; i++) {
        promises.push(optionElements[i].element(by.css(
          '.protractor-test-multiple-choice-option')).getText());
      }
      var rteInstructionArrayCopy = [...richTextInstructionsArray];
      rteInstructionArrayCopy.sort();
      protractor.promise.all(promises).then(function(results) {
        results.sort();
        expect(rteInstructionArrayCopy).toEqual(results);
      });
    });
};

// 'elem' is the HTML element containing the form to submit the answer to.
// 'answer' {String} is the text on the multiple-choice item to select.
var submitAnswer = function(elem, answer) {
  elem.element(by.tagName('oppia-interactive-multiple-choice-input')).
    element(by.buttonText(answer)).click();
};

var answerObjectType = 'NonnegativeInt';

var testSuite = [{
  interactionArguments: [[function(editor) {
    editor.appendBoldText('right');
  }, function(editor) {
    editor.appendItalicText('wrong1');
  }, function(editor) {
    editor.appendItalicText('wrong2');
  }, function(editor) {
    editor.appendItalicText('wrong3');
  }]],
  ruleArguments: ['Equals', ['right']],
  expectedInteractionDetails: [['right', 'wrong1', 'wrong2', 'wrong3']],
  wrongAnswers: ['wrong1', 'wrong2', 'wrong3'],
  correctAnswers: ['right']
}];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
