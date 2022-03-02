// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Model Class for creating new frontend instances of Prediction
 *     result domain objects.
 */

export class PredictionResult {
  /**
   * Stores the prediction result for an answer as returned by the
   * various prediction services used in Oppia for Machine Learning based
   * predictions.
   *
   * @param {integer} label - the class label predicted by prediction service.
   *   Label represents the index  of the predicted answer group.
   * @param {float} confidence - The confidence that prediction service has in
   *   its prediction label. The value is probability (between 0 and 1) that
   *   answer belongs to predicted answer group.
   */
  predictionLabel: number;
  predictionConfidence: number;
  constructor(label: number, confidence: number) {
    this.predictionLabel = label;
    this.predictionConfidence = confidence;
  }

  getLabel(): number {
    return this.predictionLabel;
  }

  getConfidence(): number {
    return this.predictionConfidence;
  }
}
