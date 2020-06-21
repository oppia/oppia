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
import { Location } from '@angular/common';

import { AlertsService } from 'services/alerts.service';
import { CollectionCreationService } from
  'components/entity-creation-services/collection-creation.service';
import { LoaderService } from 'services/loader.service.ts';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('Collection Creation service', () => {
  let collectionCreationService: CollectionCreationService = null;
  let loaderService: LoaderService = null;
  let analyticsService: SiteAnalyticsService = null;
  let windowRef: WindowRef = null;
  let httpTestingController: HttpTestingController;
  let SAMPLE_COLLECTION_ID = 'hyuy4GUlvTqJ';
  let ERROR_STATUS_CODE = 500;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
    });

    collectionCreationService = TestBed.get(CollectionCreationService);
    loaderService = TestBed.get(LoaderService);
    analyticsService = TestBed.get(SiteAnalyticsService);
    windowRef = TestBed.get(WindowRef);
    httpTestingController = TestBed.get(HttpTestingController);
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
        }
      });

      collectionCreationService.createNewCollection();

      let req = httpTestingController.expectOne(
        '/collection_editor_handler/create_new');
      expect(req.request.method).toEqual('POST');
      req.flush({collectionId: SAMPLE_COLLECTION_ID});

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
      req.flush('Error creating a new collection.', {
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
        }
      });

      collectionCreationService.createNewCollection();
      collectionCreationService.createNewCollection();

      let req = httpTestingController.expectOne(
        '/collection_editor_handler/create_new');
      expect(req.request.method).toEqual('POST');
      req.flush({collectionId: SAMPLE_COLLECTION_ID});

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
