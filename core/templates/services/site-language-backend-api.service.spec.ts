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
 * @fileoverview Unit tests for Site Language Backend Api Service.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { SiteLanguageBackendApiService } from './site-language-backend-api.service';

describe('Site Language Backend Api Service', () => {
  let siteLanguageBackendApiService: SiteLanguageBackendApiService;
  let httpTestingController: HttpTestingController;
  let siteLanguageUrl = '/save_site_language';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ]
    });
  }));

  beforeEach(() => {
    siteLanguageBackendApiService = TestBed.inject(
      SiteLanguageBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should submit site langauge', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    siteLanguageBackendApiService.submitSiteLanguageAsync('en')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(siteLanguageUrl);
    expect(req.request.method).toEqual('PUT');
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
