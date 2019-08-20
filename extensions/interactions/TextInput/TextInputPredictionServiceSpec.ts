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
 * @fileoverview Unit tests text input prediction service.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// TextInputPredictionService.ts is upgraded to Angular 8.
import { CountVectorizerService } from 'classifiers/CountVectorizerService';
import { PredictionResultObjectFactory } from
  'domain/classifier/PredictionResultObjectFactory';
import { SVMPredictionService } from 'classifiers/SVMPredictionService';
// ^^^ This block is to be removed.

describe('Text Input Prediction Service', function() {
  var $rootScope = null;
  var $scope = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('CountVectorizerService', new CountVectorizerService());
    $provide.value(
      'PredictionResultObjectFactory', new PredictionResultObjectFactory());
    $provide.value(
      'SVMPredictionService', new SVMPredictionService(
        new PredictionResultObjectFactory()));
  }));

  describe('Test text prediction service', function() {
    var predictionService;
    beforeEach(angular.mock.inject(function($injector) {
      predictionService = $injector.get('TextInputPredictionService');
      $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
    }));
    it('should predict the same as oppia-ml', function() {
      var classifierData =
        window.__fixtures__['core/tests/data/text_input_classifier_data'];
      var trainingData =
        window.__fixtures__['core/tests/data/text_classifier_results'];
      var correctPredictions = 0, totalAnswers = 0;
      var predictedAnswerGroup = null;

      for (var i = 0; i < trainingData.length; i++) {
        for (var j = 0; j < trainingData[i].answers.length; j++) {
          predictedAnswerGroup = predictionService.predict(
            classifierData, trainingData[i].answers[j]);

          // If predicted Answer Group is -1 then there is not enough
          // confidence to make a prediction.
          if (predictedAnswerGroup !== -1) {
            expect(predictedAnswerGroup).toEqual(
              trainingData[i].answer_group_index);
          }
        }
      }
    });

    it('should not have accuracy less than 85', function() {
      // These answers are taken from the text_input_training_data.json
      // in Oppia-ml. Never test classifiers using training data unless it
      // is only the functionality that you want to test (like in this case).
      var classifierData =
        window.__fixtures__['core/tests/data/text_input_classifier_data'];
      var trainingData =
        window.__fixtures__['core/tests/data/text_input_training_data'];
      var correctPredictions = 0, totalAnswers = 0;

      // To keep things simple, we will calculate accuracy score
      // and not F1 score.
      var predictedAnswerGroup = null;
      for (var i = 0; i < trainingData.length; i++) {
        for (var j = 0; j < trainingData[i].answers.length; j++) {
          predictedAnswerGroup = predictionService.predict(
            classifierData, trainingData[i].answers[j]);
          if (predictedAnswerGroup === trainingData[i].answer_group_index) {
            correctPredictions++;
          }
          totalAnswers++;
        }
      }
      expect((correctPredictions * 100) / totalAnswers).not.toBeLessThan(85.0);
    });
  });
});
