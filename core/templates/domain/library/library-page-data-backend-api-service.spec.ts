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

import { HttpClientTestingModule, HttpTestingController } from
 '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { LibraryBackendApiService } from 'domain/library/library-page-data-backend-api.service';

describe('Library Page backend API service', () => {
  let libraryBackendApiService:
    LibraryBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let sampleIndexData = {
    activity_summary_dicts_by_category: [{
      activity_summary_dicts: [{
        activity_type: 'exploration',
        id: 'exp1',
        title: 'Exploration Summary'
      }, {
        activity_type: 'collection',
        id: 'col1',
        title: 'Collection Summary'
      }, {
        activity_type: 'invalid',
        id: '3',
        title: 'Invalid Summary'
      }, {
        activity_type: 'exploration',
        id: 'exp4',
        title: 'Exploration Summary'
      }]
    }]
  }
  let ERROR_STATUS_CODE = 500;
  let sampleCreatorData = {
    explorations_list: [
      {
        human_readable_contributors_summary: {
          username: {
            num_commits: 3
          }
        },
        category: 'Algebra',
        community_owned: false,
        tags: [],
        title: 'Testing Exploration',
        created_on_msec: 1593786508029.501,
        num_total_threads: 0,
        num_views: 1,
        last_updated_msec: 1593786607552.753,
        status: 'public',
        num_open_threads: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        language_code: 'en',
        objective: 'To test exploration recommendations',
        id: 'hi27Jix1QGbT',
        thumbnail_bg_color: '#cd672b',
        activity_type: 'exploration',
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        }
      }
    ],
    collections_list: [{
      last_updated: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      thumbnail_icon_url: '/subjects/Algebra.svg',
      language_code: 'en',
      thumbnail_bg_color: '#cd672b',
      created_on: 1591296635736.666,
      status: 'public',
      category: 'Algebra',
      title: 'Test Title',
      node_count: 0
    }],
  };
  let sampleGroupData = {
    activity_list: [],
    header_i18n_id: '',
    preferred_language_codes: ['en']
  }
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LibraryBackendApiService]
    });
    libraryBackendApiService = TestBed.inject(
      LibraryBackendApiService);

    httpTestingController = TestBed.inject(
      HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });


  it('should successfully fetch an creator dashboard data from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      libraryBackendApiService.fetchCreatorDashboardDataAsync()
        .then(successHandler, failHandler);

      var req = httpTestingController.expectOne('/creatordashboardhandler/data');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleCreatorData);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use rejection handler if creator dashboard data backend request failed',
  fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    libraryBackendApiService.fetchCreatorDashboardDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/creatordashboardhandler/data');
    expect(req.request.method).toEqual('GET');
    req.flush('Error loading dashboard data.', {
      status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
    })
  );

  it('should successfully fetch an library index data from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      libraryBackendApiService.fetchLibraryIndexDataAsync()
        .then(successHandler, failHandler);

      var req = httpTestingController.expectOne('/libraryindexhandler');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleIndexData);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use rejection handler if creator dashboard data backend request failed',
  fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    libraryBackendApiService.fetchLibraryIndexDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/libraryindexhandler');
    expect(req.request.method).toEqual('GET');
    req.flush('Error loading dashboard data.', {
      status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
    })
  );


  it('should successfully fetch an library group data from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      let groupName = 'top-rated'
      libraryBackendApiService.fetchLibraryGroupDataAsync(groupName)
        .then(successHandler, failHandler);

      var req = httpTestingController.expectOne('/librarygrouphandler?group_name=top-rated');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleGroupData);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use rejection handler if creator dashboard data backend request failed',
  fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let groupName = 'top-rated'
    libraryBackendApiService.fetchLibraryGroupDataAsync(groupName)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/librarygrouphandler?group_name=top-rated');
    expect(req.request.method).toEqual('GET');
    req.flush('Error loading data.', {
      status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
    })
  );
})