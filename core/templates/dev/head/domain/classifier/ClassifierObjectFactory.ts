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
 * @fileoverview Factory for creating new frontend instances of Classifier
 *     domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export class Classifier {
  algorithmId: string;
  classifierData: any;
  dataSchemaVersion: number;

  constructor(
      algorithmId: string, classifierData: any, dataSchemaVersion: number) {
    this.algorithmId = algorithmId;
    this.classifierData = classifierData;
    this.dataSchemaVersion = dataSchemaVersion;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ClassifierObjectFactory {
  create(algorithmId: string, classifierData: any, dataSchemaVersion: number) {
    return new Classifier(algorithmId, classifierData, dataSchemaVersion);
  }
}

var oppia = require('AppInit.ts').module;

oppia.factory(
  'ClassifierObjectFactory',
  downgradeInjectable(ClassifierObjectFactory));
