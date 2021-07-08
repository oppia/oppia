// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for Exploration creation service.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { LoaderService } from 'services/loader.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { ExplorationCreationBackendApiService, ExplorationCreationResponse } from './exploration-creation-backend-api.service';
import { ExplorationCreationService } from './exploration-creation.service';

class MockWindowRef {
  _window = {
    location: {
      _href: '',
      get href(): string {
        return this._href;
      },
      set href(val) {
        this._href = val;
      }
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

describe('ExplorationCreationService', () => {
  let ecs: ExplorationCreationService;
  let ecbas: ExplorationCreationBackendApiService;
  let loaderService: LoaderService;
  let siteAnalyticsService: SiteAnalyticsService;
  let urlInterpolationService: UrlInterpolationService;
  let csrfTokenService: CsrfTokenService;
  let alertsService: AlertsService;
  let windowRef: MockWindowRef;
  let ngbModal: NgbModal;

  beforeEach(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: WindowRef,
          useValue: windowRef
        }
      ]
    });

    ecs = TestBed.inject(ExplorationCreationService);
    ecbas = TestBed.inject(ExplorationCreationBackendApiService);
    loaderService = TestBed.inject(LoaderService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    csrfTokenService = TestBed.inject(CsrfTokenService);
    alertsService = TestBed.inject(AlertsService);
    ngbModal = TestBed.inject(NgbModal);
  });

  describe('on calling createNewExploration', () => {
    it('should not create a new exploration if another exploration' +
      ' creation is in progress', () => {
      spyOn(ecbas, 'registerNewExplorationAsync');
      ecs.explorationCreationInProgress = true;

      expect(ecs.createNewExploration()).toBe(undefined);
      expect(ecbas.registerNewExplorationAsync).not.toHaveBeenCalled();
    });

    it('should change loadingMessage to Creating exploration', () => {
      spyOn(loaderService, 'showLoadingScreen');
      ecs.explorationCreationInProgress = false;

      ecs.createNewExploration();

      expect(loaderService.showLoadingScreen)
        .toHaveBeenCalledWith('Creating exploration');
    });

    it('should create new exploration', fakeAsync(() => {
      spyOn(siteAnalyticsService, 'registerCreateNewExplorationEvent');
      spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
        '/url/to/exp1'
      );
      spyOn(ecbas, 'registerNewExplorationAsync').and.callFake(() => {
        return new Promise<ExplorationCreationResponse>((
            successCallback: (response: {explorationId: string}) => void,
            errorCallback: (errorMessage: string) => void) => {
          successCallback({
            explorationId: 'exp1'
          });
        });
      });

      expect(ecs.explorationCreationInProgress).toBe(undefined);
      expect(windowRef.nativeWindow.location.href).toBe('');

      ecs.createNewExploration();
      tick(150);

      expect(ecs.explorationCreationInProgress).toBe(true);
      expect(windowRef.nativeWindow.location.href).toBe('/url/to/exp1');
    }));

    it('should handle error if exploration creation fails', fakeAsync(() => {
      spyOn(siteAnalyticsService, 'registerCreateNewExplorationEvent');
      spyOn(urlInterpolationService, 'interpolateUrl');
      spyOn(loaderService, 'hideLoadingScreen');
      spyOn(ecbas, 'registerNewExplorationAsync').and.callFake(() => {
        return new Promise<ExplorationCreationResponse>((
            successCallback: (response: {explorationId: string}) => void,
            errorCallback: (errorMessage: string) => void) => {
          errorCallback('Error');
        });
      });

      expect(ecs.explorationCreationInProgress).toBe(undefined);
      expect(windowRef.nativeWindow.location.href).toBe('');

      ecs.createNewExploration();
      tick(150);

      expect(ecs.explorationCreationInProgress).toBe(false);
      expect(windowRef.nativeWindow.location.href).toBe('');
      expect(siteAnalyticsService.registerCreateNewExplorationEvent)
        .not.toHaveBeenCalled();
      expect(urlInterpolationService.interpolateUrl).not.toHaveBeenCalled();
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    }));
  });

  describe('on calling showUploadExplorationModal', () => {
    it('should show upload exploration modal', fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue(
        <NgbModalRef>{
          result: Promise.resolve({
            yamlFile: ''
          })
        }
      );
      spyOn(csrfTokenService, 'getTokenAsync')
        .and.resolveTo('sample-csrf-token');

      // @ts-ignore in order to ignore JQuery properties that should
      // be declared.
      spyOn($, 'ajax').and.callFake((options) => {
        let d = $.Deferred();
        d.resolve(
          options.dataFilter(')]}\',\n{"explorationId": "expId"}')
        );
        return d.promise();
      });

      ecs.showUploadExplorationModal();
      tick();

      expect(windowRef.nativeWindow.location.href).toBe('/create/expId');
    }));

    it('should show upload exploration modal and display alert if post' +
      ' request fails', fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue(
        <NgbModalRef>{
          result: Promise.resolve({
            yamlFile: ''
          })
        }
      );
      spyOn(csrfTokenService, 'getTokenAsync')
        .and.resolveTo('sample-csrf-token');
      spyOn(alertsService, 'addWarning');
      spyOn(loaderService, 'hideLoadingScreen');

      // @ts-ignore in order to ignore JQuery properties that should
      // be declared.
      spyOn($, 'ajax').and.callFake(() => {
        let d = $.Deferred();
        d.reject({
          responseText: ')]}\',\n{"error": "Failed to upload exploration"}'
        });
        return d.promise();
      });

      ecs.showUploadExplorationModal();
      tick();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to upload exploration');
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    }));
  });
});
