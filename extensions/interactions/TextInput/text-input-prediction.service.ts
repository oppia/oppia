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
 * @fileoverview TextInput interaction prediction functions.
 *
 * IMPORTANT NOTE: The prediction function uses the classifier data
 * of trained model (text classifier model) for inference. These functions
 * must be changed if there are any changes in corresponding classifier training
 * function on Oppia-ml.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { CountVectorizerService } from 'classifiers/count-vectorizer.service';
import { InteractionsExtensionsConstants } from 'interactions/interactions-extension.constants';
import { SVMPredictionService } from 'classifiers/svm-prediction.service';
import { TextClassifierFrozenModel } from 'classifiers/proto/text_classifier';
import { TextInputTokenizer } from 'classifiers/text-input.tokenizer';
import { InteractionAnswer } from 'interactions/answer-defs';
import { PredictionResult } from 'domain/classifier/prediction-result.model';

@Injectable({
  providedIn: 'root'
})
export class TextInputPredictionService {
  private TEXT_INPUT_PREDICTION_SERVICE_THRESHOLD = (
    InteractionsExtensionsConstants.TEXT_INPUT_PREDICTION_SERVICE_THRESHOLD);

  constructor(
    private countVectorizerService: CountVectorizerService,
    private svmPredictionService: SVMPredictionService,
    private textInputTokenizer: TextInputTokenizer) {
  }

  predict(classifierBuffer: ArrayBuffer, textInput: InteractionAnswer): number {
    // The model_json attribute in TextClassifierFrozenModel class can't be
    // changed to camelcase since the class definition is automatically compiled
    // with the help of protoc.
    const classifierData = JSON.parse(TextClassifierFrozenModel.deserialize(
      new Uint8Array(classifierBuffer)).model_json) as TextInputClassifierData;
    const cvVocabulary = classifierData.cv_vocabulary;
    const svmData = classifierData.SVM;

    // Tokenize the text input.
    let textVector: number[];
    let textInputTokens;
    let predictionResult: PredictionResult;
    if (typeof textInput === 'string') {
      textInput = textInput.toLowerCase();
      textInputTokens = this.textInputTokenizer.generateTokens(textInput);
      if (textInputTokens) {
        textVector = this.countVectorizerService.vectorize(
          textInputTokens, cvVocabulary);
        predictionResult = this.svmPredictionService.predict(
          svmData, textVector);
        if (
          predictionResult.predictionConfidence >
          this.TEXT_INPUT_PREDICTION_SERVICE_THRESHOLD
        ) {
          return predictionResult.predictionLabel;
        }
      }
    }
    return -1;
  }
}

angular.module('oppia').factory(
  'TextInputPredictionService', downgradeInjectable(
    TextInputPredictionService));
