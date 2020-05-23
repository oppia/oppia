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

import { CodeReplPredictionService } from
  'interactions/CodeRepl/code-repl-prediction.service';
import { TextInputPredictionService } from
  'interactions/TextInput/text-input-prediction.service';

interface IPredictionService {
  predict(classifierData, answer): number;
}

type AlgorithmIdPredictionServiceMap = (
  Map<string, Map<number, IPredictionService>>);

@Injectable({providedIn: 'root'})
export class PredictionAlgorithmRegistryService {
  private algorithmIdPredictionServiceMapping: AlgorithmIdPredictionServiceMap;

  constructor(
      private codeReplPredictionService: CodeReplPredictionService,
      private textInputPredictionService: TextInputPredictionService) {
    this.algorithmIdPredictionServiceMapping = new Map(Object.entries({
      CodeClassifier: new Map([
        [1, this.codeReplPredictionService]
      ]),
      TextClassifier: new Map([
        [1, this.textInputPredictionService]
      ])
    }));
  }

  getPredictionService(
      algorithmId: string, dataSchemaVersion: number): IPredictionService {
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
      service: IPredictionService): void {
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
