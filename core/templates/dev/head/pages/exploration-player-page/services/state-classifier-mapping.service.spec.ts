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
 * @fileoverview Unit tests for the State classifier mapping service.
 */

import { TestBed } from '@angular/core/testing';

import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';

describe('State classifier mapping service', () => {
  describe('Test correct retrieval of classifier details', () => {
    let mappingService: StateClassifierMappingService;
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [StateClassifierMappingService]
      });

      mappingService = TestBed.get(StateClassifierMappingService);

      mappingService.init({
        stateName1: {
          algorithm_id: 'TestClassifier',
          classifier_data: {},
          data_schema_version: 1
        }
      });
    });

    it('should return correct classifier details.', () => {
      var stateName = 'stateName1';
      var retrievedClassifier = mappingService.getClassifier(stateName);

      expect(retrievedClassifier.algorithmId).toEqual('TestClassifier');
      expect(retrievedClassifier.classifierData).toEqual({});
      expect(retrievedClassifier.dataSchemaVersion).toEqual(1);
    });
  });
});
