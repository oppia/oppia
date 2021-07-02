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
 * @fileoverview Service for mapping algorithmId to PredictionAlgorithmService.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { TextInputPredictionService } from
  'interactions/TextInput/text-input-prediction.service';

interface PredictionService {
  predict(classifierData, answer): number;
}

type AlgorithmIdPredictionServiceMap = (
  Map<string, Map<number, PredictionService>>);

@Injectable({providedIn: 'root'})
export class PredictionAlgorithmRegistryService {
  private algorithmIdPredictionServiceMapping: AlgorithmIdPredictionServiceMap;

  constructor(
      private textInputPredictionService: TextInputPredictionService) {
    this.algorithmIdPredictionServiceMapping = new Map(Object.entries({
      TextClassifier: new Map([
        [1, this.textInputPredictionService]
      ])
    }));
  }

  getPredictionService(
      algorithmId: string, dataSchemaVersion: number): PredictionService {
    if (this.algorithmIdPredictionServiceMapping.has(algorithmId)) {
      const predictionServicesByDataSchemaVersion = (
        this.algorithmIdPredictionServiceMapping.get(algorithmId));
      if (predictionServicesByDataSchemaVersion.has(dataSchemaVersion)) {
        return predictionServicesByDataSchemaVersion.get(dataSchemaVersion);
      }
    }
    return null;
  }

  testOnlySetPredictionService(
      algorithmId: string, dataSchemaVersion: number,
      service: PredictionService): void {
    if (!this.algorithmIdPredictionServiceMapping.has(algorithmId)) {
      this.algorithmIdPredictionServiceMapping.set(algorithmId, new Map());
    }
    this.algorithmIdPredictionServiceMapping.get(algorithmId)
      .set(dataSchemaVersion, service);
  }
}

angular.module('oppia').factory(
  'PredictionAlgorithmRegistryService',
  downgradeInjectable(PredictionAlgorithmRegistryService));
