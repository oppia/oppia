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
 * @fileoverview Unit tests for the prediction algorithm registry service.
 */

import { TestBed } from '@angular/core/testing';

import { CodeReplPredictionService } from
  'interactions/CodeRepl/code-repl-prediction.service';
import { PredictionAlgorithmRegistryService } from
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/services/prediction-algorithm-registry.service';
import { TextInputPredictionService } from
  'interactions/TextInput/text-input-prediction.service';

describe('Prediction Algorithm Registry Service', () => {
  beforeEach(() => {
    this.registryService = TestBed.get(PredictionAlgorithmRegistryService);

    this.codeReplPredictionService = TestBed.get(CodeReplPredictionService);
    this.textInputPredictionService = TestBed.get(TextInputPredictionService);
  });

  it('should return service for CodeClassifier at schema version 1.', () => {
    expect(this.registryService.getPredictionService('CodeClassifier', 1))
      .toBe(this.codeReplPredictionService);
  });

  it('should return null for CodeClassifier at schema version 999.', () => {
    expect(this.registryService.getPredictionService('CodeClassifier', 999))
      .toBeNull();
  });

  it('should return service for TextClassifier at schema version 1.', () => {
    expect(this.registryService.getPredictionService('TextClassifier', 1))
      .toBe(this.textInputPredictionService);
  });

  it('should return null for TextClassifier at schema version 999.', () => {
    expect(this.registryService.getPredictionService('TextClassifier', 999))
      .toBeNull();
  });

  it('shoud return null for NullClassifier which does not exist.', () => {
    expect(this.registryService.getPredictionService('NullClassifier', 1))
      .toBeNull();
  });

  describe('when trying to mock prediction services in tests', () => {
    beforeEach(() => {
      class MockPredictionService {
        predict(classifierData, answer): number {
          return 1;
        }
      }
      this.mockPredictionService = new MockPredictionService();
    });

    it('should overwrite corresponding service if one exists.', () => {
      expect(this.registryService.getPredictionService('TextClassifier', 1))
        .toBe(this.textInputPredictionService);

      this.registryService.testOnlySetPredictionService(
        'TextClassifier', 1, this.mockPredictionService);

      expect(this.registryService.getPredictionService('TextClassifier', 1))
        .toBe(this.mockPredictionService);
    });

    it('should create new algorithm id entry when it does not exist.', () => {
      expect(this.registryService.getPredictionService('NullClassifier', 1))
        .toBeNull();

      this.registryService.testOnlySetPredictionService(
        'NullClassifier', 1, this.mockPredictionService);

      expect(this.registryService.getPredictionService('NullClassifier', 1))
        .toBe(this.mockPredictionService);
    });

    it(
      'should create new data schema version entry when it does not exist.',
      () => {
        expect(this.registryService.getPredictionService('TextClassifier', 999))
          .toBeNull();

        this.registryService.testOnlySetPredictionService(
          'TextClassifier', 999, this.mockPredictionService);

        expect(this.registryService.getPredictionService('TextClassifier', 999))
          .toBe(this.mockPredictionService);
      });
  });
});
