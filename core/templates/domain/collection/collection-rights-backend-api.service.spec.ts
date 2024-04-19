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
 * @fileoverview Unit tests for CollectionRightsBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {CollectionRightsBackendApiService} from './collection-rights-backend-api.service';
import {CsrfTokenService} from 'services/csrf-token.service';
import {
  CollectionRights,
  CollectionRightsBackendDict,
} from 'domain/collection/collection-rights.model';

describe('Collection rights backend API service', function () {
  let collectionRightsBackendApiService: CollectionRightsBackendApiService;
  let httpTestingController: HttpTestingController;
  let sampleDataResults: CollectionRightsBackendDict;
  let csrfService: CsrfTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    httpTestingController = TestBed.get(HttpTestingController);
    collectionRightsBackendApiService = TestBed.get(
      CollectionRightsBackendApiService
    );
    csrfService = TestBed.get(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(async () => {
      return new Promise(resolve => {
        resolve('sample-csrf-token');
      });
    });
  });

  beforeEach(() => {
    sampleDataResults = {
      collection_id: '',
      can_edit: true,
      can_unpublish: false,
      is_private: true,
      owner_names: ['A'],
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('when .fetchCollectionRightsAsync is called', () => {
    it('should fetch collection rights', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      collectionRightsBackendApiService
        .fetchCollectionRightsAsync('0')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/collection_editor_handler/rights/0'
      );

      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        CollectionRights.create(sampleDataResults)
      );
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should not fetch collection rights when request failed', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      collectionRightsBackendApiService
        .fetchCollectionRightsAsync('1')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/collection_editor_handler/rights/1'
      );

      expect(req.request.method).toEqual('GET');
      req.flush(
        {
          error: 'Error fetching collection rights.',
        },
        {
          status: 404,
          statusText: 'Error fetching collection rights.',
        }
      );

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error fetching collection rights.'
      );
    }));
  });

  describe('when .setCollectionPublicAsync is called', () => {
    it('should successfully set a collection to be public', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      // TODO(bhenning): Figure out how to test the actual payload sent with the
      // PUT request. The typical expect() syntax with a passed-in object
      // payload does not seem to be working correctly.
      collectionRightsBackendApiService
        .setCollectionPublicAsync('0', 1)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/collection_editor_handler/publish/0'
      );

      expect(req.request.method).toEqual('PUT');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should call the provided fail handler on HTTP failure', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      collectionRightsBackendApiService
        .setCollectionPublicAsync('0', 1)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/collection_editor_handler/publish/0'
      );

      expect(req.request.method).toEqual('PUT');
      req.flush(
        {
          error: 'Error loading collection 0.',
        },
        {
          status: 500,
          statusText: 'Error loading collection 0.',
        }
      );

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading collection 0.');
    }));
  });

  describe('when .setCollectionPrivateAsync is called', () => {
    it('should successfully set a collection to be public', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      // TODO(bhenning): Figure out how to test the actual payload sent with the
      // PUT request. The typical expect() syntax with a passed-in object
      // payload does not seem to be working correctly.
      collectionRightsBackendApiService
        .setCollectionPrivateAsync('0', 1)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/collection_editor_handler/unpublish/0'
      );

      expect(req.request.method).toEqual('PUT');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should call the provided fail handler on HTTP failure', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      collectionRightsBackendApiService
        .setCollectionPrivateAsync('0', 1)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/collection_editor_handler/unpublish/0'
      );

      expect(req.request.method).toEqual('PUT');
      req.flush(
        {
          error: 'Error loading collection 0.',
        },
        {
          status: 500,
          statusText: 'Error loading collection 0.',
        }
      );

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading collection 0.');
    }));
  });

  describe('when .loadCollectionRightsAsync is called', () => {
    it('should report a cached collection rights after caching it', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      // The collection should not currently be cached.
      expect(collectionRightsBackendApiService.isCached('0')).toBe(false);

      // Cache a collection.
      let sampleCollectionRights = CollectionRights.create(sampleDataResults);
      collectionRightsBackendApiService.cacheCollectionRights(
        '0',
        sampleCollectionRights
      );

      // It should now be cached.
      expect(collectionRightsBackendApiService.isCached('0')).toBe(true);

      // A new collection should not have been fetched from the backend. Also,
      // the returned collection should match the expected collection object.
      collectionRightsBackendApiService
        .loadCollectionRightsAsync('0')
        .then(successHandler, failHandler);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(sampleCollectionRights);
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it("should not report a cached collection rights if it's not cached", fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      expect(collectionRightsBackendApiService.isCached('0')).toBe(false);

      collectionRightsBackendApiService
        .loadCollectionRightsAsync('0')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/collection_editor_handler/rights/0'
      );

      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        CollectionRights.create(sampleDataResults)
      );
      expect(failHandler).not.toHaveBeenCalled();
    }));
  });
});
