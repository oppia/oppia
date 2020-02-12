// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview End-to-end testing utilities for the Item Selection
 * interaction.
 */

var forms = require('../../../core/tests/protractor_utils/forms.js');
var objects = require('../../objects/protractor.js');

// The members of richTextInstructionsArray are functions, one for each option,
// which will each be passed a 'handler' that they can use to edit the
// rich-text area of the option, for example by
//   handler.appendUnderlineText('emphasised');
var customizeInteraction = function(elem, richTextInstructionsArray, maxSelectionAllowed) {
  // need to set # of max selections
  forms.ListEditor(elem).setLength(richTextInstructionsArray.length);
  for (var i = 0; i < richTextInstructionsArray.length; i++) {
    var richTextEditor = forms.ListEditor(elem).editItem(i, 'RichText');
    richTextEditor.clear();
    richTextInstructionsArray[i](richTextEditor);
  }

  objects.IntEditor(
    elem.all(by.tagName('schema-based-int-editor')).last()
  ).setValue(maxSelectionAllowed);
};

// These members of richTextInstructionsArray each describe how to check one of
// the options.
var expectInteractionDetailsToMatch = function(
    elem, richTextInstructionsArray) {
  elem.all(by.repeater('choice in $ctrl.choices track by $index'))
    .then(function(optionElements) {
      expect(optionElements.length).toEqual(richTextInstructionsArray.length);
      for (var i = 0; i < optionElements.length; i++) {
        forms.expectRichText(optionElements[i].element(by.css(
          '.protractor-test-item-selection-option'
        ))).toMatch(richTextInstructionsArray[i]);
      }
    });
};

// 'elem' is the HTML element containing the form to submit the answer to.
// 'answer' Set([{String}]) is the text on the multiple-choice item to select.
// answer = an array of strings, iterate over each of the items in the array and click on each item
var submitAnswer = function(elem, answer) {
  var answerArray = Array.from(answer);
  for (var i = 0; i < answer.length; i++) {
    // tagName = name of tag, e.g. <a>, <p> etc. 
    // file named oppia-interactive-item-selection-input is defining that tag (kinda like creating a class)
    elem.element(by.tagName('oppia-interactive-item-selection-input')).
      element(by.buttonText(answer)).click();
  }
};

var answerObjectType = 'SetOfHtmlString'; // type of object returned by interaction

var testSuite = [{
  interactionArguments: [[function(editor) {
    editor.appendBoldText('answer1');
  }, function(editor) {
    editor.appendItalicText('answer2');
  }, function(editor) {
    editor.appendItalicText('answer3');
  }], 3],
  ruleArguments: ['Equals', ['<p>answer1</p>', '<p>answer2</p>']],
  expectedInteractionDetails: [[function(checker) {
    checker.readBoldText('answer1');
  }, function(checker) {
    checker.readItalicText('answer2');
  }, function(checker) {
    checker.readItalicText('answer3');
  }]],
  wrongAnswers: [['<p>answer1</p>'], ['<p>answer2</p>'], ['<p>answer1</p>', '<p>answer3</p>']],
  correctAnswers: [['<p>answer1</p>', '<p>answer2</p>']]
}, { 
  interactionArguments: [[function(editor) {
    editor.appendBoldText('answer1');
  }, function(editor) {
    editor.appendItalicText('answer2');
  }, function(editor) {
    editor.appendItalicText('answer3');
  }], 3],
  ruleArguments: ['ContainsAtLeastOneOf', ['<p>answer1</p>', '<p>answer2</p>']],
  expectedInteractionDetails: [[function(checker) {
    checker.readBoldText('answer1');
  }, function(checker) {
    checker.readItalicText('answer2');
  }, function(checker) {
    checker.readItalicText('answer3');
  }]],
  wrongAnswers: [['<p>answer3</p>']],
  correctAnswers: [['<p>answer1</p>'], ['<p>answer2</p>'], ['<p>answer1</p>', '<p>answer2</p>']]
}, { 
  interactionArguments: [[function(editor) {
    editor.appendBoldText('answer1');
  }, function(editor) {
    editor.appendItalicText('answer2');
  }, function(editor) {
    editor.appendItalicText('answer3');
  }], 3],
  ruleArguments: ['IsProperSubsetOf', ['<p>answer1</p>', '<p>answer2</p>']],
  expectedInteractionDetails: [[function(checker) {
    checker.readBoldText('answer1');
  }, function(checker) {
    checker.readItalicText('answer2');
  }, function(checker) {
    checker.readItalicText('answer3');
  }]],
  wrongAnswers: [['<p>answer3</p>'], ['<p>answer1</p>', '<p>answer2</p>']],
  correctAnswers: [['<p>answer1</p>'], ['<p>answer2</p>']]
}, { 
  interactionArguments: [[function(editor) {
    editor.appendBoldText('answer1');
  }, function(editor) {
    editor.appendItalicText('answer2');
  }, function(editor) {
    editor.appendItalicText('answer3');
  }], 3],
  ruleArguments: ['DoesNotContainAtLeastOneOf', ['<p>answer1</p>', '<p>answer2</p>']],
  expectedInteractionDetails: [[function(checker) {
    checker.readBoldText('answer1');
  }, function(checker) {
    checker.readItalicText('answer2');
  }, function(checker) {
    checker.readItalicText('answer3');
  }]],
  wrongAnswers: [['<p>answer1</p>', '<p>answer2</p>']],
  correctAnswers: [['<p>answer1</p>'], ['<p>answer2</p>'], ['<p>answer3</p>']]
}];

exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
