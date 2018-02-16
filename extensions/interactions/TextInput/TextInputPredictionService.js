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

oppia.factory('TextInputPredictionService', [
  'SVMPredictionService', 'TextInputTokenizer',
  'CountVectorizerService', function(
      SVMPredictionService, TextInputTokenizer,
      CountVectorizerService) {
    return {
      predict: function(classifierData, textInput) {
        var cvVocabulary = classifierData.cv_vocabulary;
        var prediction = -1;
        var svmData = classifierData.SVM;

        // Tokenize the text input.
        var textInputTokens = TextInputTokenizer.generateTokens(textInput);

        if (textInputTokens !== null) {
          var textVector = CountVectorizerService.vectorize(
            textInputTokens, cvVocabulary);
          prediction = SVMPredictionService.predict(svmData, textVector);
        }
        return prediction;
      }
    };
  }]);
