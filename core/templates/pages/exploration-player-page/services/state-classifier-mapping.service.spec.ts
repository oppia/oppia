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
import { TestBed, waitForAsync } from '@angular/core/testing';

import { AppService } from 'services/app.service';
import { Classifier } from 'domain/classifier/classifier.model';
import { ClassifierDataBackendApiService } from 'services/classifier-data-backend-api.service';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
import { TextClassifierFrozenModel } from 'classifiers/proto/text_classifier';

describe('State classifier mapping service', () => {
  describe('Test that classifier data is fetched properly when ML is enabled',
    () => {
      let mappingService: StateClassifierMappingService;
      let appService: AppService;
      let classifierFrozenModel = new TextClassifierFrozenModel();
      let classifierDataBackendApiService: ClassifierDataBackendApiService;
      const expId = '0';
      const expVersion = 0;
      const stateName = 'stateName1';

      // The model_json attribute in TextClassifierFrozenModel class can't be
      // changed to camelcase since the class definition is automatically
      // compiled with the help of protoc.
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
        appService = TestBed.get(AppService);
        classifierDataBackendApiService = TestBed.inject(
          ClassifierDataBackendApiService);
        spyOn(appService, 'isMachineLearningClassificationEnabled')
          .and.returnValue(true);
      });

      it('should fetch classifier data correctly', waitForAsync(async() => {
        spyOn(
          classifierDataBackendApiService,
          'getClassifierDataAsync').and.callFake(() => {
          return new Promise((resolve, reject) => {
            resolve(classifierData);
          });
        });
        mappingService.init(expId, expVersion);
        await mappingService.initializeClassifierDataForState(stateName);
        expect(mappingService.hasClassifierData(stateName)).toBe(true);
      }));

      it('should handle failure of fetching classifier data', waitForAsync(
        async() => {
          spyOn(
            classifierDataBackendApiService,
            'getClassifierDataAsync').and.callFake(() => {
            return new Promise((resolve, reject) => {
              reject('No classifier data found for exploration');
            });
          });
          mappingService.init(expId, expVersion);
          await mappingService.initializeClassifierDataForState(stateName);
          expect(mappingService.hasClassifierData(stateName)).toBe(false);
        }));

      it('should return classifier data when it exists.', () => {
        mappingService.init(expId, expVersion);

        mappingService.testOnlySetClassifierData(stateName, classifierData);
        let retrievedClassifier = (
          mappingService.getClassifier(stateName) as Classifier);

        expect(retrievedClassifier.algorithmId).toEqual('TestClassifier');
        expect(retrievedClassifier.classifierData).toEqual(
          classifierFrozenModel.serialize());
        expect(retrievedClassifier.algorithmVersion).toEqual(1);
      });

      it('should return undefined when classifier data does not exist.', () => {
        mappingService.init(expId, expVersion);
        var stateNameNonexistent = 'stateName2';
        var nonExistentClassifier = mappingService.getClassifier(
          stateNameNonexistent);
        expect(nonExistentClassifier).toBeNull();
      });

      it('should return true when it has classifier data.', () => {
        mappingService.init(expId, expVersion);
        mappingService.testOnlySetClassifierData(stateName, classifierData);
        expect(mappingService.hasClassifierData(stateName)).toBe(true);
      });

      it('should return false when it does not have classifier data .', () => {
        mappingService.init(expId, expVersion);
        var stateNameNonexistent = 'stateName2';
        expect(mappingService.hasClassifierData(
          stateNameNonexistent)).toBe(false);
      });

      it('should not return correct classifier details when init is not ' +
        'called', () => {
        mappingService.stateClassifierMapping = {};
        var retrievedClassifier = mappingService.getClassifier(stateName);
        expect(retrievedClassifier).toBeNull();
      });
    });

  describe('Test that classifier data is not fetched when ML is disabled',
    () => {
      let mappingService: StateClassifierMappingService;
      let appService: AppService;
      const expId = '0';
      const stateName = 'stateName1';
      const expVersion = 0;

      beforeEach(() => {
        TestBed.configureTestingModule({
          imports: [HttpClientTestingModule],
          providers: [StateClassifierMappingService]
        });

        mappingService = TestBed.get(StateClassifierMappingService);
        appService = TestBed.get(AppService);
        spyOn(appService, 'isMachineLearningClassificationEnabled')
          .and.returnValue(false);
      });

      it('should not return classifier data.', () => {
        mappingService.init(expId, expVersion);
        expect(mappingService.hasClassifierData(stateName)).toBe(false);
        expect(mappingService.getClassifier(stateName)).toBeNull();
      });
    });
});
