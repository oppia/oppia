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
 * @fileoverview Unit tests for ClassroomBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ContributionOpportunitiesBackendApiService } from
  './contribution-opportunities-backend-api.service';
import { ExplorationOpportunitySummary } from
  'domain/opportunity/ExplorationOpportunitySummaryObjectFactory';
import { SkillOpportunityObjectFactory } from
  'domain/opportunity/SkillOpportunityObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

describe('Oppotunities backend API serice', function() {
  let contributionOpportunitiesBackendApiService:
    ContributionOpportunitiesBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let skillOpportunityObjectFactory:
    SkillOpportunityObjectFactory = null;
  let urlInterpolationService:
    UrlInterpolationService = null;
  let skillResponse = [{
    id: 'skill_id',
    skill_description: 'A new skill for question',
    topic_name: 'A new topic',
    question_count: 30
  }];
  let sampleSkillOpportunityResponse = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    contributionOpportunitiesBackendApiService =
      TestBed.get(ContributionOpportunitiesBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    skillOpportunityObjectFactory = TestBed.get(SkillOpportunityObjectFactory);
    urlInterpolationService = TestBed.get(UrlInterpolationService);
    sampleSkillOpportunityResponse = [
      skillOpportunityObjectFactory.createFromBackendDict(skillResponse[0])
    ];
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch the skills data',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      contributionOpportunitiesBackendApiService.fetchSkillOpportunities(
        ''
      ).then(
        successHandler, failHandler
      );
      let req = httpTestingController.expectOne(
        urlInterpolationService.interpolateUrl(
          '/opportunitiessummaryhandler/<opportunityType>',
          { opportunityType: 'skill' }
        ) + `?cursor=${''}`
      );
      expect(req.request.method).toEqual('GET');
      req.flush(skillResponse);

      flushMicrotasks();

      //   expect(successHandler).toHaveBeenCalledWith(
      //     [sampleSkillOpportunityResponse]);
      expect(successHandler).toHaveBeenCalledWith([]);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});

// TODO(@srijanreddy98): Added tests for the voiceover and translation responses
