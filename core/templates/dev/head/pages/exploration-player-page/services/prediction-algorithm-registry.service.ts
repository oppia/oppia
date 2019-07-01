// Copyright 2015 The Oppia Authors. All Rights Reserved.
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

var oppia = require('AppInit.ts').module;

oppia.factory('PredictionAlgorithmRegistryService', [
  '$injector', function($injector) {
    /**
     * This mapping needs to be updated whenever a new prediction service needs
     * to be added for classification. The mapping is from algorithmId to a
     * list of objects. The mapping should be of the type:
     * {
     *   algorithmId: {
     *     dataSchemaVersion: predictionService
     *   }
     * }
     */
    var algorithmIdPredictionServiceMapping = {
      CodeClassifier: {
        v1: 'CodeReplPredictionService'
      },
      TextClassifier: {
        v1: 'TextInputPredictionService'
      }

    };

    return {
      getPredictionService: function(algorithmId, dataSchemaVersion) {
        if (algorithmIdPredictionServiceMapping.hasOwnProperty(algorithmId)) {
          // We convert dataSchemaVersion to a string below since JS objects
          // can't have integer properties.
          var serviceName = (
            algorithmIdPredictionServiceMapping[algorithmId][
              'v' + dataSchemaVersion.toString()]);
          return $injector.get(serviceName);
        } else {
          return null;
        }
      },
      // The below function is required for running tests with sample
      // prediction services.
      setMapping: function(newAlgorithmIdPredictionServiceMapping) {
        algorithmIdPredictionServiceMapping = (
          newAlgorithmIdPredictionServiceMapping);
      }
    };
  }]);
