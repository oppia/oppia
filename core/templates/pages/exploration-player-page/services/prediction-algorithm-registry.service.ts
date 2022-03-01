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

import { TextInputPredictionService } from 'interactions/TextInput/text-input-prediction.service';

type AlgorithmIdPredictionServiceMap = (
  Map<string, Map<number, TextInputPredictionService>>);

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
      algorithmId: string, dataSchemaVersion: number):
    TextInputPredictionService | null {
    const predictionServicesByAlgorithmId = (
      this.algorithmIdPredictionServiceMapping.get(algorithmId));
    if (predictionServicesByAlgorithmId) {
      const predictionServicesByDataSchemaVersion = (
        predictionServicesByAlgorithmId).get(dataSchemaVersion);
      if (predictionServicesByDataSchemaVersion) {
        return predictionServicesByDataSchemaVersion;
      }
    }
    return null;
  }

  testOnlySetPredictionService(
      algorithmId: string, dataSchemaVersion: number,
      service: TextInputPredictionService): void {
    if (!this.algorithmIdPredictionServiceMapping.get(algorithmId)) {
      this.algorithmIdPredictionServiceMapping.set(algorithmId, new Map());
    }
    let _algorithmId = (
      this.algorithmIdPredictionServiceMapping.get(algorithmId));
    _algorithmId?.set(dataSchemaVersion, service);
  }
}

angular.module('oppia').factory(
  'PredictionAlgorithmRegistryService',
  downgradeInjectable(PredictionAlgorithmRegistryService));
