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

oppia.factory('StateClassifierMappingService', [
  'ClassifierObjectFactory', function(ClassifierObjectFactory) {
    var stateClassifierMapping = null;

    return {
      init: function(backendStateClassifierMapping) {
        stateClassifierMapping = {};
        var algorithmId, classifierData, dataSchemaVersion;
        for (var stateName in backendStateClassifierMapping) {
          if (backendStateClassifierMapping.hasOwnProperty(stateName)) {
            algorithmId = backendStateClassifierMapping[
              stateName].algorithm_id;
            classifierData = backendStateClassifierMapping[
              stateName].classifier_data;
            dataSchemaVersion = backendStateClassifierMapping[
              stateName].data_schema_version;
            stateClassifierMapping[stateName] = ClassifierObjectFactory.create(
              algorithmId, classifierData, dataSchemaVersion);
          }
        }
      },

      getClassifier: function(stateName) {
        if (stateClassifierMapping &&
             stateClassifierMapping.hasOwnProperty(stateName)) {
          return stateClassifierMapping[stateName];
        } else {
          return null;
        }
      }
    };
  }
]);
