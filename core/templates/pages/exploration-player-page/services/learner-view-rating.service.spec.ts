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
 * @fileoverview Tests for Learner View Rating Service.
 */

import { async, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import { LearnerViewRatingService } from './learner-view-rating.service';
import { LearnerViewRatingBackendApiService } from './learner-view-rating-backend-api.service';

describe('Learner View Rating Service', () => {
  let learnerViewRatingService: LearnerViewRatingService;
  let learnerViewRatingBackendApiService: LearnerViewRatingBackendApiService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ]
    });
  }));

  beforeEach(() => {
    learnerViewRatingService = TestBed.inject(LearnerViewRatingService);
    learnerViewRatingBackendApiService = TestBed.inject(
      LearnerViewRatingBackendApiService);
  });

  it('should send request to backend for fetching user rating info' +
    ' when initialized', fakeAsync(() => {
    let userRatingSpy = spyOn(
      learnerViewRatingBackendApiService, 'getUserRatingAsync')
      .and.resolveTo({
        user_rating: 2
      });
    let successCb = jasmine.createSpy('success');

    learnerViewRatingService.init(successCb);
    tick();

    expect(userRatingSpy).toHaveBeenCalled();
  }));

  it('should send request to backend for submiting user rating info' +
    ' when calling \'submitUserRating\'', fakeAsync(() => {
    let userRatingSpy = spyOn(
      learnerViewRatingBackendApiService, 'submitUserRatingAsync')
      .and.resolveTo();

    learnerViewRatingService.submitUserRating(2);
    tick();

    expect(userRatingSpy).toHaveBeenCalled();
  }));

  it('should test getters', () => {
    let userRating = 4;
    learnerViewRatingService.userRating = userRating;

    expect(learnerViewRatingService.getUserRating()).toEqual(userRating);
    expect(learnerViewRatingService.onRatingUpdated).toBeDefined();
  });
});
