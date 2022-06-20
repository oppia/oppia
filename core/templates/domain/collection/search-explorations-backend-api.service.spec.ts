// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SearchExplorationsBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { SearchExplorationsBackendApiService } from
  'domain/collection/search-explorations-backend-api.service';
import { ExplorationSearchResult } from 'domain/exploration/exploration-search-result.model';

describe('Exploration search backend API service', () => {
  let SearchExplorationsService: SearchExplorationsBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    SearchExplorationsService = TestBed.get(
      SearchExplorationsBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should call the provided success handler on HTTP success',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let query = escape(btoa('three'));

      SearchExplorationsService.fetchExplorationsAsync('three')
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/exploration/metadata_search?q=' + query);
      req.flush({collection_node_metadata_list: []});

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should search for explorations from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let query = escape(btoa('count'));

      // Search result object returnable from the backend.
      let searchResults = {
        collection_node_metadata_list: [{
          id: '12',
          objective:
          'learn how to count permutations accurately and systematically',
          title: 'Protractor Test'
        }, {
          id: '4',
          objective:
          'learn how to count permutations accurately and systematically',
          title: 'Three Balls'
        }]
      };

      var explorationSearchResultObjects = (
        searchResults.collection_node_metadata_list.map(
          explorationSearchResultBackendDict => ExplorationSearchResult
            .createFromBackendDict(explorationSearchResultBackendDict)));

      SearchExplorationsService.fetchExplorationsAsync('count')
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/exploration/metadata_search?q=' + query);
      req.flush(searchResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        explorationSearchResultObjects);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should call the provided fail handler on HTTP failure',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let query = escape(btoa('oppia'));

      SearchExplorationsService.fetchExplorationsAsync('oppia')
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/exploration/metadata_search?q=' + query);
      req.flush('Error searching exploration', {
        status: 500, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );
});
