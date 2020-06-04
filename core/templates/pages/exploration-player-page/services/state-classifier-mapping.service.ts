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
 * @fileoverview Services for mapping state names to classifier details.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { Classifier, ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';

interface IBackendStateClassifierMapping {
  [state: string]: {
    'algorithm_id': string;
    'classifier_data': IClassifierData;
    'data_schema_version': number;
  }
}

interface IStateClassifierMapping {
  [state: string]: Classifier;
}

@Injectable({
  providedIn: 'root'
})
export class StateClassifierMappingService {
  constructor(private classifierObjectFactory: ClassifierObjectFactory) {}
  stateClassifierMapping: IStateClassifierMapping = null;

  init(backendStateClassifierMapping: IBackendStateClassifierMapping): void {
    this.stateClassifierMapping = {};
    var algorithmId, classifierData, dataSchemaVersion;
    for (var stateName in backendStateClassifierMapping) {
      if (backendStateClassifierMapping.hasOwnProperty(stateName)) {
        algorithmId = backendStateClassifierMapping[
          stateName].algorithm_id;
        classifierData = backendStateClassifierMapping[
          stateName].classifier_data;
        dataSchemaVersion = backendStateClassifierMapping[
          stateName].data_schema_version;
        this.stateClassifierMapping[stateName] =
          this.classifierObjectFactory.create(
            algorithmId, classifierData, dataSchemaVersion);
      }
    }
  }

  getClassifier(stateName: string): Classifier {
    if (this.stateClassifierMapping &&
          this.stateClassifierMapping.hasOwnProperty(stateName)) {
      return this.stateClassifierMapping[stateName];
    } else {
      return null;
    }
  }
}

angular.module('oppia').factory(
  'StateClassifierMappingService',
  downgradeInjectable(StateClassifierMappingService));
