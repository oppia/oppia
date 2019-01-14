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
 * @fileoverview Service for training data that normalizes TextInput
 * training data.
 */

oppia.factory('TextInputNormalizer', function() {
  return {
    normalize: function(trainingData) {
      var normalizedTrainingData = [];
      for(var i = 0; i<trainingData.length; i++) {
        answerGroupAnswers = [];
        for(var j = 0; j< trainingData[i].answers.length; j++) {
          answer = trainingData[i].answers[j]
          answer = answer.replace('\'m', ' am');
          answer = answer.replace('\'ll', ' will');
          answer = answer.replace('\'ve', ' have');
          answerGroupAnswers.push(answer.toLowerCase());
        }
        normalizedTrainingData.push({
          answerGroupIndex: i,
          answers: answerGroupAnswers
         });
       }
      return normalizedTrainingData;
    }
  };
});
