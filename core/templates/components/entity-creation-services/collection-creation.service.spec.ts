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
 * @fileoverview Unit test for CollectionCreationService.
 */

import { HttpClientTestingModule, HttpTestingController }
  from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks, tick }
  from '@angular/core/testing';

import { CollectionCreationService } from
  'components/entity-creation-services/collection-creation.service';
import { LoaderService } from 'services/loader.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('Collection Creation service', () => {
  let collectionCreationService: CollectionCreationService;
  let loaderService: LoaderService;
  let analyticsService: SiteAnalyticsService;
  let windowRef: WindowRef;
  let httpTestingController: HttpTestingController;
  let SAMPLE_COLLECTION_ID = 'hyuy4GUlvTqJ';
  let ERROR_STATUS_CODE = 500;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
    });

    collectionCreationService = TestBed.inject(CollectionCreationService);
    loaderService = TestBed.inject(LoaderService);
    analyticsService = TestBed.inject(SiteAnalyticsService);
    windowRef = TestBed.inject(WindowRef);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully create a collection and navigate to collection',
    fakeAsync(() => {
      spyOn(loaderService, 'showLoadingScreen').and.callThrough();
      spyOn(analyticsService, 'registerCreateNewCollectionEvent')
        .and.callThrough();

      spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
        location: {
          href: ''
        },
        gtag: () => {}
      } as unknown as Window);

      collectionCreationService.createNewCollection();

      let req = httpTestingController.expectOne(
        '/collection_editor_handler/create_new');
      expect(req.request.method).toEqual('POST');
      req.flush({collection_id: SAMPLE_COLLECTION_ID});

      flushMicrotasks();
      tick(150);

      expect(loaderService.showLoadingScreen)
        .toHaveBeenCalledWith('Creating collection');
      expect(analyticsService.registerCreateNewCollectionEvent)
        .toHaveBeenCalledWith(SAMPLE_COLLECTION_ID);

      expect(windowRef.nativeWindow.location.href).toEqual(
        '/collection_editor/create/' + SAMPLE_COLLECTION_ID);
    })
  );

  it('should fail to create a collection and hide the loading screen',
    fakeAsync(() => {
      spyOn(loaderService, 'hideLoadingScreen').and.callThrough();

      collectionCreationService.createNewCollection();

      let req = httpTestingController.expectOne(
        '/collection_editor_handler/create_new');
      expect(req.request.method).toEqual('POST');
      req.flush({
        error: 'Error creating a new collection.'
      }, {
        status: ERROR_STATUS_CODE,
        statusText: 'Error creating a new collection.'
      });

      flushMicrotasks();

      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    })
  );

  it('should not be able to be used while in progress',
    fakeAsync(() => {
      spyOn(loaderService, 'showLoadingScreen').and.callThrough();
      spyOn(analyticsService, 'registerCreateNewCollectionEvent')
        .and.callThrough();

      spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
        location: {
          href: ''
        },
        gtag: () => {}
      } as unknown as Window);

      collectionCreationService.createNewCollection();
      collectionCreationService.createNewCollection();

      let req = httpTestingController.expectOne(
        '/collection_editor_handler/create_new');
      expect(req.request.method).toEqual('POST');
      req.flush({collection_id: SAMPLE_COLLECTION_ID});

      flushMicrotasks();
      tick(150);

      expect(loaderService.showLoadingScreen)
        .toHaveBeenCalledTimes(1);
      expect(analyticsService.registerCreateNewCollectionEvent)
        .toHaveBeenCalledTimes(1);

      expect(windowRef.nativeWindow.location.href).toEqual(
        '/collection_editor/create/' + SAMPLE_COLLECTION_ID);
    })
  );
});
