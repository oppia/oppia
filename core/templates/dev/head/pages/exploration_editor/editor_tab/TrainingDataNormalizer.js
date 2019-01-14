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
 * @fileoverview Service for training data that normalizes TextInput and
 * CodeRepl training data for classificaiton purposes.
 */

oppia.factory('TrainingDataNormalizer', [
  'TextInputNormalizer', 'CodeInputNormalizer',
  function(
      TextInputNormalizer, CodeInputNormalizer) {
    return {
      normalize: function(trainingDataAnswers, explorationState) {
        interactionType = explorationState.interaction.id;
        if (interactionType === 'TextInput') 
          return TextInputNormalizer.normalize(trainingDataAnswers);
        else if (interactionType === 'CodeRepl')
          return CodeInputNormalizer.normalize(trainingDataAnswers);
        else
          return trainingDataAnswers;
         }
     };
}]);
