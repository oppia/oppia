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
 * @fileoverview Unit tests code repl prediction service.
 */

describe('CodeRepl prediction service', function() {
  beforeEach(module('oppia'));

  describe('CodeRepl prediction service test', function() {
    var service, tokenizer;
    beforeEach(inject(function($injector) {
      service = $injector.get('CodeReplPredictionService');
      tokenizer = $injector.get('PythonProgramTokenizer');
    }));

    it('should calculate correct jaccard index', function() {
      var multisetA = [1, 2];
      var multisetB = [3, 4];
      var expectedValue = 0.0
      var value = service.calcJaccardIndex(multisetA, multisetB);
      expect(value).toEqual(expectedValue);

      var multisetA = [1, 2];
      var multisetB = [2, 3];
      var expectedValue = 1.0 / 3;
      var value = service.calcJaccardIndex(multisetA, multisetB);
      expect(value).toEqual(expectedValue);

      var multisetA = [1, 2, 2, 4];
      var multisetB = [2, 3, 4];
      var expectedValue = 2.0 / 5;
      var value = service.calcJaccardIndex(multisetA, multisetB);
      expect(value).toEqual(expectedValue);

      var multisetA = [1, 2, 3];
      var multisetB = [3, 3, 5];
      var expectedValue = 1.0 / 5;
      var value = service.calcJaccardIndex(multisetA, multisetB);
      expect(value).toEqual(expectedValue);
    });

    it('should normalize python program tokens correctly.', function() {
      var program = (
        '# This is a comment.\nvariable = 15\nif variable > 5:' +
        '\n    print "Hello"\nprint " World"');

      var programTokens = tokenizer.generateTokens(program.split('\n'));
      var tokenToId = {
        '=': 0, 15: 1, 'if': 2, '>': 3, 5: 4, print: 5, ':': 6
      }

      var expectedTokens = [
        'V', '=', '15', 'if', 'V', '>', '5', ':', 'print', 'UNK',
        'print', 'UNK'];

      var normalizedTokens = service.getTokenizedProgram(
        programTokens, tokenToId);

      expect(normalizedTokens).toEqual(expectedTokens);
    });

    it('should produce program tokens for count vector correctly.', function() {
      var program = (
        '# This is a comment.\nvariable = 15\nif variable > 5:' +
        '\n    print "Hello"\nprint " World"');

      var programTokens = tokenizer.generateTokens(program.split('\n'));
      var expectedTokens = [
        'V', '=', '15', 'if', 'V', '>', '5', ':', 'print', '"Hello"',
        'print', '" World"'];

      var CVTokens = service.getTokenizedProgramForCV(programTokens);

      expect(CVTokens).toEqual(expectedTokens);
    });

    it('should predict correct answer group for the answers', function() {
      jasmine.getJSONFixtures().fixturesPath = 'base/core/tests/data';
      var classifierData = getJSONFixture('code_classifier_data.json');

      // Test algorithm agains first test set. This test set contains
      // example which can be successfully classified by KNN classifier.
      var testData = getJSONFixture('code_classifier_test_set_1.json');
      var predictedAnswerGroup = null;

      for (var i = 0; i < testData.length; i++) {
        for (var j = 0; j < testData[i].answers.length; j++) {
          predictedAnswerGroup = service.predict(
            classifierData, testData[i].answers[j]);
          expect(predictedAnswerGroup).toEqual(
            testData[i].answer_group_index.toString());
        }
      }

      // Test algorithm against second test set. This test set contains
      // example which will cause code classifier fail on KNN prediction
      // and force it to use SVM for prediction.
      testData = getJSONFixture('code_classifier_test_set_2.json');
      for (var i = 0; i < testData.length; i++) {
        for (var j = 0; j < testData[i].answers.length; j++) {
          predictedAnswerGroup = service.predict(
            classifierData, testData[i].answers[j]);
          expect(predictedAnswerGroup).toEqual(
            testData[i].answer_group_index.toString());
        }
      }
    })
  });
});
