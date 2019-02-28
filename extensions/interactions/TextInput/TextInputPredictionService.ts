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
 * TextInput interaction prediction functions.
 *
 * IMPORTANT NOTE: The prediction function uses the classifier data
 * of trained model (text classifier model) for inference. These functions
 * must be changed if there are any changes in corresponding classifier training
 * function on Oppia-ml.
 */

// Minimum confidence required for a predicted answer group to be shown to user.
// Generally a threshold of 0.7-0.8 is assumed to be a good one in practice,
// however value need not be in those bounds.
oppia.constant('TEXT_INPUT_PREDICTION_SERVICE_THRESHOLD', 0.7);

oppia.factory('TextInputPredictionService', [
  'CountVectorizerService', 'SVMPredictionService',
  'TextInputTokenizer', 'TEXT_INPUT_PREDICTION_SERVICE_THRESHOLD', function(
      CountVectorizerService, SVMPredictionService,
      TextInputTokenizer, TEXT_INPUT_PREDICTION_SERVICE_THRESHOLD) {
    return {
      predict: function(classifierData, textInput) {
        var cvVocabulary = classifierData.cv_vocabulary;
        var svmData = classifierData.SVM;

        // Tokenize the text input.
        textInput = textInput.toLowerCase();
        var textInputTokens = TextInputTokenizer.generateTokens(textInput);

        var textVector = CountVectorizerService.vectorize(
          textInputTokens, cvVocabulary);
        var predictionResult = SVMPredictionService.predict(
          svmData, textVector);
        if (predictionResult.predictionConfidence >
            TEXT_INPUT_PREDICTION_SERVICE_THRESHOLD) {
          return predictionResult.predictionLabel;
        }
        return -1;
      }
    };
  }]);
