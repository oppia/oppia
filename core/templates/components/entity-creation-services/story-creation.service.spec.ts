// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Modal and functionality for the create story button.
 */

require(
  'pages/topic-editor-page/modal-templates/' +
  'create-new-story-modal.controller.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/topic-editor-page/services/topic-editor-state.service.ts');
require('services/alerts.service.ts');

import { HttpClientTestingModule, HttpTestingController }
  from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks }
  from '@angular/core/testing';

import { AlertsService } from 'services/alerts.service';
import { LoaderService } from 'services/loader.service';
import { importAllAngularServices } from 'tests/unit-test-utils';

describe('Collection Creation service', () => {
  let AlertsService: AlertsService = null;
  let loaderService: LoaderService = null;
  let window: Window = null;
  var $uibModal = null;
  let httpTestingController: HttpTestingController;
  let SAMPLE_COLLECTION_ID = 'hyuy4GUlvTwE';
  let ERROR_STATUS_CODE = 500;

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    AlertsService = $injector.get(
      'AlertsService');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    $uibModal = $injector.get('$uibModal');
  }));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
    });

    AlertsService = TestBed.get(AlertsService);
    loaderService = TestBed.get(LoaderService);
    window = TestBed.get(Window);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully create a story and navigate to creation',
    fakeAsync(() => {
      spyOn(loaderService, 'showLoadingScreen').and.callThrough();

      spyOnProperty(window, 'window').and.returnValue({
        location: {
          href: ''
        }
      });


      let req = httpTestingController.expectOne(
        'CreateNewStoryModalController');
      expect(req.request.method).toEqual('POST');
      req.flush({collection_id: SAMPLE_COLLECTION_ID});

      flushMicrotasks();

      expect(loaderService.showLoadingScreen)
        .toHaveBeenCalledWith('Creating story');

      expect(window.window.location.href).toEqual(
        'pages/topic-editor-page/modal-templates/' + SAMPLE_COLLECTION_ID);
    })
  );

  it('should fail to create a story and hide the loading screen',
    fakeAsync(() => {
      spyOn(loaderService, 'hideLoadingScreen').and.callThrough();

      let req = httpTestingController.expectOne(
        '/CreateNewStoryModalController');
      expect(req.request.method).toEqual('POST');
      req.flush({
        error: 'Story fields cannot be empty'
      }, {
        status: ERROR_STATUS_CODE,
        statusText: 'Story fields cannot be empty'
      });

      flushMicrotasks();

      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    })
  );

  it('should not be able to be used while in progress',
    fakeAsync(() => {
      spyOn(loaderService, 'showLoadingScreen').and.callThrough();

      spyOnProperty(window, 'window').and.returnValue({
        location: {
          href: ''
        }
      });


      let req = httpTestingController.expectOne(
        '/CreateNewStoryModalController');
      expect(req.request.method).toEqual('POST');
      req.flush({collection_id: SAMPLE_COLLECTION_ID});

      flushMicrotasks();

      expect(loaderService.showLoadingScreen)
        .toHaveBeenCalledTimes(1);

      expect(window.window.location.href).toEqual(
        '/CreateNewStoryModalController' + SAMPLE_COLLECTION_ID);
    })
  );
});
