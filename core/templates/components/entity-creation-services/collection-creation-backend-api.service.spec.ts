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
 * @fileoverview Unit test for CollectionCreationBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {CollectionCreationBackendService} from 'components/entity-creation-services/collection-creation-backend-api.service';

describe('Collection Creation backend service', () => {
  let collectionCreationBackendService: CollectionCreationBackendService;
  let httpTestingController: HttpTestingController;
  let SAMPLE_COLLECTION_ID = 'hyuy4GUlvTqJ';
  let ERROR_STATUS_CODE = 500;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    collectionCreationBackendService = TestBed.get(
      CollectionCreationBackendService
    );
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully create a new collection and obtain the collection ID', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    collectionCreationBackendService
      .createCollectionAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/collection_editor_handler/create_new'
    );
    expect(req.request.method).toEqual('POST');
    req.flush({collection_id: SAMPLE_COLLECTION_ID});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to create a new collection and call the fail handler', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    collectionCreationBackendService
      .createCollectionAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/collection_editor_handler/create_new'
    );
    expect(req.request.method).toEqual('POST');
    req.flush(
      {
        error: 'Error creating a new collection.',
      },
      {
        status: ERROR_STATUS_CODE,
        statusText: 'Error creating a new collection.',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error creating a new collection.'
    );
  }));
});
