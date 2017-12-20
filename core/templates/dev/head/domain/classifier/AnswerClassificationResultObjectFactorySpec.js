// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the AnswerClassificationResultObjectFactory.
 */
 
describe('Answer Classification Object Factory', function() {
	var AnswerClassificationResultFactory;

	beforeEach(module('oppia'));

	beforeEach(inject(function($injector) {
    AnswerClassificationResultFactory = $injector.get('AnswerClassificationResultFactory');
    }));

    it('should create a new result', function() {
    var answerClassificationResult = (
     AnswerClassificationResultFactory.createNew(
        0, 0, 0, 'classificationCategorization'));

    expect(answerClassificationResult.outcome).toEqual(0);
    expect(answerClassificationResult.answerGroupIndex).toEqual(0);
    expect(answerClassificationResult.ruleIndex).toEqual(0);
    expect(answerClassificationResult.classificationCategorization).toEqual(
      'classificationCategorization');
    });
});
 