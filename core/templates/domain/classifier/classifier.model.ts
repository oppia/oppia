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
 * @fileoverview Model class for creating new frontend instances of Classifier
 *     domain objects.
 */

export interface ClassifierBackendDict {
  'algorithm_id': string;
  'classifier_data': ClassifierData;
  'data_schema_version': number;
}

export class Classifier {
  algorithmId: string;
  classifierData: ClassifierData;
  dataSchemaVersion: number;

  constructor(
      algorithmId: string, classifierData: ClassifierData,
      dataSchemaVersion: number) {
    this.algorithmId = algorithmId;
    this.classifierData = classifierData;
    this.dataSchemaVersion = dataSchemaVersion;
  }

  static createFromBackendDict(
      backendDict: ClassifierBackendDict): Classifier {
    return new Classifier(
      backendDict.algorithm_id,
      backendDict.classifier_data,
      backendDict.data_schema_version);
  }
}
