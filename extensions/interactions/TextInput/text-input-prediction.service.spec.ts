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
// text-input-prediction.service.ts is upgraded to Angular 8.
import { CountVectorizerService } from 'classifiers/count-vectorizer.service';
import { TextInputPredictionService } from
  'interactions/TextInput/text-input-prediction.service';
import { TextClassifierFrozenModel } from 'classifiers/proto/text_classifier';
import { TextInputTokenizer } from 'classifiers/text-input.tokenizer';
import { SVMPredictionService } from 'classifiers/svm-prediction.service';
// ^^^ This block is to be removed.

describe('Text Input Prediction Service', () => {
  beforeEach(angular.mock.module('oppia'));

  describe('Test text prediction service', () => {
    let predictionService: TextInputPredictionService;
    let classifierFrozenModel: TextClassifierFrozenModel;

    beforeEach(() => {
      predictionService = new TextInputPredictionService(
        new CountVectorizerService(),
        new SVMPredictionService(),
        new TextInputTokenizer());
    });
    it('should predict the same as oppia-ml', () => {
      const classifierData =
          window.__fixtures__['core/tests/data/text_input_classifier_data'];
      const trainingData =
          window.__fixtures__['core/tests/data/text_classifier_results'];
      let predictedAnswerGroup = null;
      classifierFrozenModel = new TextClassifierFrozenModel();
      // The model_json attribute in TextClassifierFrozenModel class can't be
      // changed to camelcase since the class definition is automatically
      // compiled with the help of protoc.
      classifierFrozenModel.model_json = JSON.stringify(classifierData);

      for (let i = 0; i < trainingData.length; i++) {
        for (let j = 0; j < trainingData[i].answers.length; j++) {
          predictedAnswerGroup = predictionService.predict(
            classifierFrozenModel.serialize(), trainingData[i].answers[j]);

          // If predicted Answer Group is -1 then there is not enough
          // confidence to make a prediction.
          if (predictedAnswerGroup !== -1) {
            expect(predictedAnswerGroup).toEqual(
              trainingData[i].answer_group_index);
          }
        }
      }
    });

    it('should not have accuracy less than 85', () => {
      // These answers are taken from the text_input_training_data.json
      // in Oppia-ml. Never test classifiers using training data unless it
      // is only the functionality that you want to test (like in this case).
      const classifierData =
          window.__fixtures__['core/tests/data/text_input_classifier_data'];
      const trainingData =
          window.__fixtures__['core/tests/data/text_input_training_data'];
      let correctPredictions = 0, totalAnswers = 0;
      classifierFrozenModel = new TextClassifierFrozenModel();
      // The model_json attribute in TextClassifierFrozenModel class can't be
      // changed to camelcase since the class definition is automatically
      // compiled with the help of protoc.
      classifierFrozenModel.model_json = JSON.stringify(classifierData);

      // To keep things simple, we will calculate accuracy score
      // and not F1 score.
      let predictedAnswerGroup = null;
      for (let i = 0; i < trainingData.length; i++) {
        for (let j = 0; j < trainingData[i].answers.length; j++) {
          predictedAnswerGroup = predictionService.predict(
            classifierFrozenModel.serialize(), trainingData[i].answers[j]);
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
