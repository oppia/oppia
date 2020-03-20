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

import { TestBed } from '@angular/core/testing';

import { CodeReplPredictionService } from
  'interactions/CodeRepl/code-repl-prediction.service';
import { CountVectorizerService } from 'classifiers/count-vectorizer.service';
import { LoggerService } from 'services/contextual/logger.service';
import { PythonProgramTokenizer } from 'classifiers/python-program.tokenizer';
import { SVMPredictionService } from 'classifiers/svm-prediction.service';
import { WinnowingPreprocessingService } from
  'classifiers/winnowing-preprocessing.service';

describe('CodeRepl prediction service', () => {
  describe('CodeRepl prediction service test', () => {
    let service: CodeReplPredictionService, tokenizer: PythonProgramTokenizer;
    beforeEach(angular.mock.inject(() => {
      TestBed.configureTestingModule({
        providers: [
          CodeReplPredictionService, CountVectorizerService,
          LoggerService, PythonProgramTokenizer, SVMPredictionService,
          WinnowingPreprocessingService
        ]
      });
      tokenizer = TestBed.get(PythonProgramTokenizer);
      service = TestBed.get(CodeReplPredictionService);
    }));

    it('should calculate correct jaccard index', () => {
      let multisetA = [1, 2];
      let multisetB = [3, 4];
      let expectedValue = 0.0;
      let value = service.calcJaccardIndex(multisetA, multisetB);
      expect(value).toEqual(expectedValue);

      multisetA = [1, 2];
      multisetB = [2, 3];
      expectedValue = 1.0 / 3;
      value = service.calcJaccardIndex(multisetA, multisetB);
      expect(value).toEqual(expectedValue);

      multisetA = [1, 2, 2, 4];
      multisetB = [2, 3, 4];
      expectedValue = 2.0 / 5;
      value = service.calcJaccardIndex(multisetA, multisetB);
      expect(value).toEqual(expectedValue);

      multisetA = [1, 2, 3];
      multisetB = [3, 3, 5];
      expectedValue = 1.0 / 5;
      value = service.calcJaccardIndex(multisetA, multisetB);
      expect(value).toEqual(expectedValue);
    });

    it('should normalize python program tokens correctly.', () => {
      const program = (
        '# This is a comment.\nvariable = 15\nif variable > 5:' +
        '\n    print "Hello"\nprint " World"');

      const programTokens = tokenizer.generateTokens(program.split('\n'));
      const tokenToId = {
        '=': 0, 15: 1, 'if': 2, '>': 3, 5: 4, print: 5, ':': 6
      };

      const expectedTokens = [
        'V', '=', '15', 'if', 'V', '>', '5', ':', 'print', 'UNK',
        'print', 'UNK'];

      const normalizedTokens = service.getTokenizedProgram(
        programTokens, tokenToId);

      expect(normalizedTokens).toEqual(expectedTokens);
    });

    it('should produce program tokens for count vector correctly.', () => {
      const program = (
        '# This is a comment.\nvariable = 15\nif variable > 5:' +
        '\n    print "Hello"\nprint " World"');

      const programTokens = tokenizer.generateTokens(program.split('\n'));
      const expectedTokens = [
        'V', '=', '15', 'if', 'V', '>', '5', ':', 'print', '"Hello"',
        'print', '" World"'];

      const CVTokens = service.getTokenizedProgramForCV(programTokens);

      expect(CVTokens).toEqual(expectedTokens);
    });

    it('should predict correct answer group for the answers', () => {
      const classifierData = window.__fixtures__[
        'core/tests/data/code_classifier_data'];

      // Test algorithm agains first test set. This test set contains
      // example which can be successfully classified by KNN classifier.
      let testData = window.__fixtures__[
        'core/tests/data/code_classifier_test_knn'];
      let predictedAnswerGroup = null;
      for (var i = 0; i < testData.length; i++) {
        for (var j = 0; j < testData[i].answers.length; j++) {
          predictedAnswerGroup = service.predict(
            classifierData, testData[i].answers[j]);
          expect(predictedAnswerGroup).toEqual(
            testData[i].answer_group_index);
        }
      }

      // Test algorithm against first test set. This test set contains
      // examples for which KNN fails but SVM succeeds.
      testData = window.__fixtures__[
        'core/tests/data/code_classifier_test_svm'];
      predictedAnswerGroup = null;
      for (let i = 0; i < testData.length; i++) {
        for (let j = 0; j < testData[i].answers.length; j++) {
          predictedAnswerGroup = service.predict(
            classifierData, testData[i].answers[j]);
          // Ignore the prediction if predicted answer group is -1 since
          // -1 is returned when the prediction probability is less than the
          // threshold in which case default answer is shown to the learner.
          if (predictedAnswerGroup !== -1) {
            expect(predictedAnswerGroup).toEqual(
              testData[i].answer_group_index);
          }
        }
      }
    });

    it('should not have accuracy less than 85', () => {
      const classifierData = window.__fixtures__[
        'core/tests/data/code_classifier_data'];
      const trainingData = window.__fixtures__[
        'core/tests/data/code_classifier_accuracy_test'];
      let correctPredictions = 0, totalAnswers = 0;

      // To keep things simple, we will calculate accuracy score
      // and not F1 score.
      let predictedAnswerGroup = null;
      for (let i = 0; i < trainingData.length; i++) {
        for (let j = 0; j < trainingData[i].answers.length; j++) {
          predictedAnswerGroup = service.predict(
            classifierData, trainingData[i].answers[j]);
          // Ignore the prediction if predicted answer group is -1 since
          // -1 is returned when the prediction probability is less than the
          // threshold.
          if (predictedAnswerGroup !== -1) {
            if (predictedAnswerGroup === trainingData[i].answer_group_index) {
              correctPredictions++;
            }
            totalAnswers++;
          }
        }
      }
      expect((correctPredictions * 100) / totalAnswers).not.toBeLessThan(85.0);
    });
  });
});
