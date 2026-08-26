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
 * @fileoverview Unit tests for LibraryPageBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {LibraryPageBackendApiService} from './library-page-backend-api.service';

describe('Library page backend api service', () => {
  let lpbas: LibraryPageBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    lpbas = TestBed.inject(LibraryPageBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch library index data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    const resp = {
      activity_summary_dicts_by_category: [],
      preferred_language_codes: ['en', 'es'],
    };

    lpbas.fetchLibraryIndexDataAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/libraryindexhandler');
    expect(req.request.method).toEqual('GET');
    req.flush(resp);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(resp);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fetch creator dashboard data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    const resp = {
      explorations_list: [],
      collections_list: [],
    };

    lpbas.fetchCreatorDashboardDataAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/creatordashboardhandler/data');
    expect(req.request.method).toEqual('GET');
    req.flush(resp);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(resp);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fetch library group data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    const resp = {
      activity_list: [],
      header_i18n_id: 'I18N_TEST_ID',
      preferred_language_codes: ['en', 'es'],
    };

    lpbas.fetchLibraryGroupDataAsync('g1').then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/librarygrouphandler?group_name=g1'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(resp);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(resp);
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
