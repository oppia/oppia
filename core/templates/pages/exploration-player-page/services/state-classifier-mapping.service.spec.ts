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
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Classifier } from 'domain/classifier/classifier.model';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
import { TextClassifierFrozenModel } from 'classifiers/proto/text_classifier';

describe('State classifier mapping service', () => {
  describe('Test correct retrieval of classifier details', () => {
    let mappingService: StateClassifierMappingService;
    let classifierFrozenModel = new TextClassifierFrozenModel();
    classifierFrozenModel.model_json = JSON.stringify({
      KNN: {
        occurrence: 0,
        K: 0,
        T: 0,
        top: 0,
        fingerprint_data: {
          0: {
            'class': 0,
            fingerprint: [[0]]
          }
        },
        token_to_id: {
          a: 0
        }
      },
      SVM: {
        classes: [0],
        kernel_params: {
          kernel: 'string',
          coef0: 0,
          degree: 0,
          gamma: 0
        },
        intercept: [0],
        n_support: [0],
        probA: [0],
        support_vectors: [[0]],
        probB: [0],
        dual_coef: [[0]]
      },
      cv_vocabulary: {
        a: 0
      }
    });

    let classifierData = new Classifier(
      'TestClassifier', classifierFrozenModel.serialize(), 1);

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [StateClassifierMappingService]
      });

      mappingService = TestBed.get(StateClassifierMappingService);
    });

    it('should return classifier data when it exists.', () => {
      mappingService.init('0', 0);
      var stateName = 'stateName1';

      mappingService.testOnlySetClassifierData(stateName, classifierData);
      var retrievedClassifier = mappingService.getClassifier(stateName);

      expect(retrievedClassifier.algorithmId).toEqual('TestClassifier');
      expect(retrievedClassifier.classifierData).toEqual(
        classifierFrozenModel.serialize());
      expect(retrievedClassifier.algorithmVersion).toEqual(1);
    });

    it('should return undefined when classifier data does not exist.', () => {
      mappingService.init('0', 0);
      var stateNameNonexistent = 'stateName2';
      var nonExistentClassifier = mappingService.getClassifier(
        stateNameNonexistent);
      expect(nonExistentClassifier).toBe(undefined);
    });

    it('should return true when it has classifier data.', () => {
      mappingService.init('0', 0);
      var stateName = 'stateName1';
      mappingService.testOnlySetClassifierData(stateName, classifierData);
      expect(mappingService.hasClassifierData(stateName)).toBe(true);
    });

    it('should return false when it does not have classifier data .', () => {
      mappingService.init('0', 0);
      var stateNameNonexistent = 'stateName2';
      expect(mappingService.hasClassifierData(
        stateNameNonexistent)).toBe(false);
    });

    it('should not return correct classifier details when init is not ' +
      'called', () => {
      var stateName = 'stateName1';
      var retrievedClassifier = mappingService.getClassifier(stateName);
      expect(retrievedClassifier).toBe(undefined);
    });
  });
});
