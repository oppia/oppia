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
 * @fileoverview Unit tests for ExplorationRecommendationsBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {ExplorationRecommendationsBackendApiService} from 'domain/recommendations/exploration-recommendations-backend-api.service';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';

describe('Exploration recommendations backend api service', () => {
  let httpTestingController: HttpTestingController;
  let erbas: ExplorationRecommendationsBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    httpTestingController = TestBed.get(HttpTestingController);
    erbas = TestBed.get(ExplorationRecommendationsBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should correctly fetch recommended explorations', fakeAsync(() => {
    let backendResponse = {
      summaries: [
        {
          last_updated_msec: 1591296737470.528,
          community_owned: false,
          objective: 'Test Objective',
          id: '44LKoKLlIbGe',
          num_views: 0,
          thumbnail_icon_url: '/subjects/Algebra.svg',
          human_readable_contributors_summary: {},
          language_code: 'en',
          thumbnail_bg_color: '#cc4b00',
          created_on_msec: 1591296635736.666,
          ratings: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
          status: 'public',
          tags: [],
          activity_type: 'exploration',
          category: 'Algebra',
          title: 'Test Title',
        },
      ],
    };

    let expectedObject = backendResponse.summaries.map(
      LearnerExplorationSummary.createFromBackendDict
    );

    erbas
      .getRecommendedSummaryDictsAsync(
        ['0'],
        'false',
        'collectionId',
        'storyId',
        'nodeId',
        'expId'
      )
      .then(expSummaries => {
        expect(expSummaries).toEqual(expectedObject);
      });

    let req = httpTestingController.expectOne(req =>
      /.*?explorehandler\/recommendations?.*/g.test(req.url)
    );
    expect(req.request.method).toEqual('GET');
    req.flush(backendResponse);

    flushMicrotasks();
  }));
});
