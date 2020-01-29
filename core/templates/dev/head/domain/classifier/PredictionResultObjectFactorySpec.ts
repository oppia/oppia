// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the PredictionResultObjectFactory.
 */
import { PredictionResultObjectFactory } from
  'domain/classifier/PredictionResultObjectFactory';

describe('Prediction Result Object Factory', () => {
  let prof;

  beforeEach(() => {
    prof = new PredictionResultObjectFactory();
  });

  it('should create a new result object', () => {
    const label = 1;
    const confidence = 1;
    const predictionResultObject = prof.createNew(label, confidence);

    expect(predictionResultObject.getLabel()).toBe(label);
    expect(predictionResultObject.getConfidence()).toBe(confidence);
  });
});
