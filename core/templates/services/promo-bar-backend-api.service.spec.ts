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
 * @fileoverview Unit tests for PromoBarBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {PromoBar} from 'domain/promo_bar/promo-bar.model';
import {PromoBarBackendApiService} from 'services/promo-bar-backend-api.service';
import {ServicesConstants} from './services.constants';

describe('Promo bar backend api service', () => {
  const initialValue = ServicesConstants.ENABLE_PROMO_BAR;
  let promoBarBackendApiService: PromoBarBackendApiService;
  let httpTestingController: HttpTestingController;
  let promoBar = {
    promoBarEnabled: true,
    promoBarMessage: 'test message',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PromoBarBackendApiService],
    });
    promoBarBackendApiService = TestBed.get(PromoBarBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch data from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    promoBarBackendApiService
      .getPromoBarDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/promo_bar_handler');
    expect(req.request.method).toEqual('GET');
    req.flush(promoBar);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if data backend request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    promoBarBackendApiService
      .getPromoBarDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/promo_bar_handler');
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Error loading data.',
      },
      {
        status: 500,
        statusText: 'Invalid Request',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should make request to update promo bar platform param data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    promoBarBackendApiService
      .updatePromoBarDataAsync(true, 'New message')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/promo_bar_handler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      promo_bar_enabled: true,
      promo_bar_message: 'New message',
    });
    req.flush({status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should make request to update promo bar platform param data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    promoBarBackendApiService
      .updatePromoBarDataAsync(true, 'New message')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/promo_bar_handler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      promo_bar_enabled: true,
      promo_bar_message: 'New message',
    });
    req.flush(
      {
        error: "You don't have rights to updated promo bar config data.",
      },
      {
        status: 401,
        statusText: 'Invalid Request',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should not fetch data from the backend when promo bar is not enabled', fakeAsync(() => {
    // This throws "Cannot assign to 'ENABLE_PROMO_BAR' because it
    // is a read-only property.". We need to suppress this error because
    // we need to change the value of 'ENABLE_PROMO_BAR' for testing
    // purposes.
    // @ts-expect-error
    ServicesConstants.ENABLE_PROMO_BAR = false;

    let successHandler = jasmine.createSpy('success').and.callFake(data => {
      expect(data).toEqual(PromoBar.createEmpty());
    });
    let failHandler = jasmine.createSpy('fail');

    promoBarBackendApiService
      .getPromoBarDataAsync()
      .then(successHandler, failHandler);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();

    // This throws "Cannot assign to 'ENABLE_PROMO_BAR' because it
    // is a read-only property.". We need to suppress this error because
    // we need to change the value of 'ENABLE_PROMO_BAR' for testing
    // purposes.
    // @ts-expect-error
    ServicesConstants.ENABLE_PROMO_BAR = initialValue;
  }));
});
