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
 * @fileoverview Tests that the resource service is working as expected.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { PromoBarBackendApiService } from
  'services/promo-bar-backend-api.service';

describe('Promo bar backend api service', () => {
  let promoBarBackendApiService:
    PromoBarBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let promoBarData = {
    promoBarEnabled: true,
    promoBarMessage: 'test message'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PromoBarBackendApiService]
    });
    promoBarBackendApiService = TestBed.get(
      PromoBarBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch data from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      promoBarBackendApiService.getPromoBarData()
        .then(successHandler, failHandler);

      var req = httpTestingController.expectOne('/promo_bar_handler');
      expect(req.request.method).toEqual('GET');
      req.flush(promoBarData);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
