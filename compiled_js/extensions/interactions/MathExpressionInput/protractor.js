"use strict";
// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @fileoverview End-to-end testing utilities for Math Input Expression
 * interaction
 */
var protractor_1 = require("protractor");
var objects = require('../../objects/protractor.js');
var mathExpressionInputTag = function (parentElement) {
    return parentElement.element(protractor_1.by.tagName('oppia-interactive-math-expression-input'));
};
var customizeInteraction = function (elem) {
    // There is no customization option.
};
var expectInteractionDetailsToMatch = function (elem) {
    expect(mathExpressionInputTag(elem).isPresent()).toBe(true);
};
var submitAnswer = function (elem, answer) {
    mathExpressionInputTag(elem).click();
    var mathInputElem = protractor_1.element(protractor_1.by.css('.guppy_active'));
    var submitAnswerButon = protractor_1.element(protractor_1.by.css('.protractor-test-submit-answer-button'));
    // Input box is always empty.
    mathInputElem.isPresent().then(function (present) {
        if (present) {
            mathInputElem.sendKeys(answer);
            submitAnswerButon.click();
        }
    });
};
var answerObjectType = 'UnicodeString';
var testSuite = [{
        interactionArguments: [],
        ruleArguments: ['IsMathematicallyEquivalentTo', '{x}^{3}'],
        expectedInteractionDetails: [],
        wrongAnswers: ['x', '3x', '2x^3'],
        correctAnswers: ['x^3', 'xxx']
    }];
exports.customizeInteraction = customizeInteraction;
exports.expectInteractionDetailsToMatch = expectInteractionDetailsToMatch;
exports.submitAnswer = submitAnswer;
exports.answerObjectType = answerObjectType;
exports.testSuite = testSuite;
