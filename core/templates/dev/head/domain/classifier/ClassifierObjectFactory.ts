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

var oppia = require('AppInit.ts').module;

oppia.factory('ClassifierObjectFactory', [function() {
  var Classifier = function(algorithmId, classifierData, dataSchemaVersion) {
    this.algorithmId = algorithmId;
    this.classifierData = classifierData;
    this.dataSchemaVersion = dataSchemaVersion;
  };

  // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  Classifier['create'] = function(
  /* eslint-enable dot-notation */
      algorithmId, classifierData, dataSchemaVersion) {
    return new Classifier(algorithmId, classifierData, dataSchemaVersion);
  };

  return Classifier;
}]);
