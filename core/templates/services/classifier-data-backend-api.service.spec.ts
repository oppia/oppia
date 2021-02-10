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
 * @fileoverview Unit tests for ClassifierDataBackendApiService
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { deflateSync } from 'zlib';

import { ClassifierDataBackendApiService } from
  'services/classifier-data-backend-api.service';

const Constants = require('constants.ts');

describe('Classifier Data Backend API Service', () => {
  describe('on dev mode', () => {
    let classifierDataBackendApiService: ClassifierDataBackendApiService;
    let httpTestingController: HttpTestingController;

    const classifierMetaDataRequestUrl = '/ml/trainedclassifierhandler';
    const classifierDataRequestUrl = (
      '/_ah/gcs/' + Constants.DEFAULT_GCS_RESOURCE_BUCKET_NAME +
      '/exploration/0/assets/classifier.pb.xz');
    const classifierBuffer = deflateSync(Buffer.alloc(10));

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
      });
      classifierDataBackendApiService = TestBed.get(
        ClassifierDataBackendApiService);
      httpTestingController = TestBed.get(HttpTestingController);
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    it('should successfully fetch and classifier data', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      classifierDataBackendApiService.getClassifierData('0', 1, 'state').then(
        successHandler, failHandler);

      const metaDataReq = httpTestingController.expectOne(
        req => req.url === classifierMetaDataRequestUrl);

      expect(metaDataReq.request.method).toEqual('GET');
      expect(metaDataReq.request.params.get('exploration_id')).toEqual('0');
      expect(metaDataReq.request.params.get(
        'exploration_version')).toEqual('1');
      expect(metaDataReq.request.params.get('state_name')).toEqual('state');
      metaDataReq.flush({
        'algorithm_id': 'TextClassifier',
        'algorithm_version': 0,
        'gcs_filename': 'classifier.pb.xz'
      });
      flushMicrotasks();

      const classifierDataReq = httpTestingController.expectOne(
        classifierDataRequestUrl);
      expect(classifierDataReq.request.method).toEqual('GET');
      classifierDataReq.flush(
        classifierBuffer.buffer.slice(
          classifierBuffer.byteOffset,
          classifierBuffer.byteOffset + classifierBuffer.byteLength));
      flushMicrotasks();
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should handle rejection when fetching meta data fails',
       fakeAsync(() => {
        const successHandler = jasmine.createSpy('success');
        const failHandler = jasmine.createSpy('fail');

        classifierDataBackendApiService.getClassifierData('0', 1, 'state').then(
          successHandler, failHandler);
        const req = httpTestingController.expectOne(
          req => req.url === classifierMetaDataRequestUrl);
        expect(req.request.method).toEqual('GET');
        req.flush('', {status: 400, statusText: 'Failed'});
        flushMicrotasks();
        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalled();
      }));

    it('should handle rejection when fetching classifier data fails',
       fakeAsync(() => {
        const successHandler = jasmine.createSpy('success');
        const failHandler = jasmine.createSpy('fail');

        classifierDataBackendApiService.getClassifierData('0', 1, 'state').then(
          successHandler, failHandler);

        const metaDataReq = httpTestingController.expectOne(
          req => req.url === classifierMetaDataRequestUrl);
        metaDataReq.flush({
          'algorithm_id': 'TextClassifier',
          'algorithm_version': 0,
          'gcs_filename': 'classifier.pb.xz'
        });
        flushMicrotasks();

        const classifierDataReq = httpTestingController.expectOne(
          classifierDataRequestUrl);
        expect(classifierDataReq.request.method).toEqual('GET');
        classifierDataReq.flush(
          classifierBuffer.buffer.slice(
            classifierBuffer.byteOffset,
            classifierBuffer.byteOffset + classifierBuffer.byteLength),
          {status: 400, statusText: 'Failed'});
        flushMicrotasks();
        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalled();
      }));
  });

  describe('without dev mode settings', () => {
    let oldGcsResourceBucketName: string = null;
    let oldDevMode: boolean = null;
    beforeAll(() => {
      oldGcsResourceBucketName = Constants.GCS_RESOURCE_BUCKET_NAME;
      Constants.GCS_RESOURCE_BUCKET_NAME = '';
      oldDevMode = Constants.DEV_MODE;
      Constants.DEV_MODE = false;
    });

    afterAll(() => {
      Constants.GCS_RESOURCE_BUCKET_NAME = oldGcsResourceBucketName;
      Constants.DEV_MODE = oldDevMode;
    });

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [ClassifierDataBackendApiService]
      });
    });

    it('should throw an error when is not on dev mode and Google Cloud' +
        ' Service bucket name is not set', fakeAsync(() => {
      expect(() => {
        TestBed.get(ClassifierDataBackendApiService);
      }).toThrowError('GCS_RESOURCE_BUCKET_NAME is not set in prod.');
    }));
  });
});
