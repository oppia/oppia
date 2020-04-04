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
 * @fileoverview Unit tests for ContributionOpportunitiesBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ContributionOpportunitiesBackendApiService } from
  // eslint-disable-next-line max-len
  'pages/community-dashboard-page/services/contribution-opportunities-backend-api.service';
import { ExplorationOpportunitySummaryObjectFactory } from
  'domain/opportunity/ExplorationOpportunitySummaryObjectFactory';
import { SkillOpportunityObjectFactory } from
  'domain/opportunity/SkillOpportunityObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

describe('Contribution Opportunities backend API service', function() {
  let contributionOpportunitiesBackendApiService:
    ContributionOpportunitiesBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let explorationOpportunitySummaryObjectFactory:
    ExplorationOpportunitySummaryObjectFactory = null;
  let skillOpportunityObjectFactory:
    SkillOpportunityObjectFactory = null;
  let urlInterpolationService:
    UrlInterpolationService = null;
  const skillOpportunityResponse = {
    opportunities: [{
      id: 'skill_id',
      skill_description: 'A new skill for question',
      topic_name: 'A new topic',
      question_count: 30
    }],
    next_cursor: '6',
    more: true
  };
  const skillOpportunity = {
    opportunities: [{
      id: 'exp_id',
      topic_name: 'Topic',
      story_title: 'A new story',
      chapter_title: 'Introduction',
      content_count: 100,
      translation_counts: {
        hi: 15
      }
    }],
    next_cursor: '6',
    more: true
  };
  let sampleSkillOpportunitiesResponse = null;
  let sampleTranslationOpportunitiesResponse = null;
  let sampleVoiceoverOpportunitiesResponse = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    contributionOpportunitiesBackendApiService =
      TestBed.get(ContributionOpportunitiesBackendApiService);
    explorationOpportunitySummaryObjectFactory =
      TestBed.get(ExplorationOpportunitySummaryObjectFactory);
    httpTestingController = TestBed.get(HttpTestingController);
    skillOpportunityObjectFactory = TestBed.get(SkillOpportunityObjectFactory);
    urlInterpolationService = TestBed.get(UrlInterpolationService);
    sampleSkillOpportunitiesResponse = [
      skillOpportunityObjectFactory.createFromBackendDict(
        skillOpportunityResponse.opportunities[0])
    ];
    sampleTranslationOpportunitiesResponse = [
      explorationOpportunitySummaryObjectFactory.createFromBackendDict(
        skillOpportunity.opportunities[0]
      )
    ];
    sampleVoiceoverOpportunitiesResponse = [
      explorationOpportunitySummaryObjectFactory.createFromBackendDict(
        skillOpportunity.opportunities[0]
      )
    ];
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch the skill opportunities data',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      contributionOpportunitiesBackendApiService.fetchSkillOpportunities(
        '').then(
        successHandler, failHandler
      );
      const req = httpTestingController.expectOne(
        urlInterpolationService.interpolateUrl(
          '/opportunitiessummaryhandler/<opportunityType>',
          { opportunityType: 'skill' }
        ) + '?cursor='
      );
      expect(req.request.method).toEqual('GET');
      req.flush(skillOpportunityResponse);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        sampleSkillOpportunitiesResponse);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should successfully fetch the translation opportunities data',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      contributionOpportunitiesBackendApiService.fetchTranslationOpportunities(
        'hi', '',).then(
        successHandler, failHandler
      );
      const req = httpTestingController.expectOne(
        urlInterpolationService.interpolateUrl(
          '/opportunitiessummaryhandler/<opportunityType>',
          { opportunityType: 'translation' }
        ) + '?language_code=hi&cursor='
      );
      expect(req.request.method).toEqual('GET');
      req.flush(skillOpportunity);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        sampleTranslationOpportunitiesResponse);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should successfully fetch the voiceover opportunities data',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      contributionOpportunitiesBackendApiService.fetchVoiceoverOpportunities(
        'hi', '',).then(
        successHandler, failHandler
      );
      const req = httpTestingController.expectOne(
        urlInterpolationService.interpolateUrl(
          '/opportunitiessummaryhandler/<opportunityType>',
          { opportunityType: 'voiceover' }
        ) + '?language_code=hi&cursor='
      );
      expect(req.request.method).toEqual('GET');
      req.flush(skillOpportunity);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        sampleVoiceoverOpportunitiesResponse);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
