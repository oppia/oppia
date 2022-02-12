// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to retrieve information of review tests from the
 * backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ReviewTestDomainConstants } from
  'domain/review_test/review-test-domain.constants';
import { ReviewTestBackendDict, ReviewTest } from
  'domain/review_test/review-test.model';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewTestBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService
  ) {}

  async _fetchReviewTestDataAsync(storyUrlFragment: string):
    Promise<ReviewTest> {
    return this.http.get<ReviewTestBackendDict>(
      this.urlInterpolationService.interpolateUrl(
        ReviewTestDomainConstants.REVIEW_TEST_DATA_URL,
        {
          topic_url_fragment: (
            this.urlService.getTopicUrlFragmentFromLearnerUrl()),
          classroom_url_fragment: (
            this.urlService.getClassroomUrlFragmentFromLearnerUrl()),
          story_url_fragment: storyUrlFragment
        }
      )
    ).toPromise().then(backendResponse => {
      return ReviewTest.createFromBackendDict(
        backendResponse);
    }, errorResponse => {
      throw new Error(errorResponse.error.error);
    });
  }

  async fetchReviewTestDataAsync(storyUrlFragment: string):
    Promise<ReviewTest> {
    return this._fetchReviewTestDataAsync(storyUrlFragment);
  }
}

angular.module('oppia').factory(
  'ReviewTestBackendApiService',
  downgradeInjectable(ReviewTestBackendApiService));
