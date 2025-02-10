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
 * @fileoverview Tests that search service is working as expected.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';

import {
  SearchBackendApiService,
  SearchResponseBackendDict,
} from 'services/search-backend-api.service';

describe('Search Backend Api Service', () => {
  let searchBackendApiService: SearchBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    searchBackendApiService = TestBed.inject(SearchBackendApiService);
  });

  describe('fetchExplorationSearchResultAsync', () => {
    const sampleSearchResponse = {
      search_cursor: 'notempty',
      activity_list: [],
    };

    it('should return exploration search results', fakeAsync(() => {
      searchBackendApiService
        .fetchExplorationSearchResultAsync('')
        .then((response: SearchResponseBackendDict) => {
          expect(response.activity_list).toEqual([]);
          expect(response.search_cursor).toBe('notempty');
        });
      const req = httpTestingController.expectOne('/searchhandler/data');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleSearchResponse);
      flushMicrotasks();
    }));
  });
});
