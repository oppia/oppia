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
import { ExplorationOpportunitySummaryObjectFactory } from
  'domain/opportunity/ExplorationOpportunitySummaryObjectFactory';
import { SkillOpportunityObjectFactory } from
  'domain/opportunity/SkillOpportunityObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

fdescribe('Oppotunities backend API serice', function() {
  let contributionOpportunitiesBackendApiService:
    ContributionOpportunitiesBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let explorationOpportunitySummaryObjectFactory:
    ExplorationOpportunitySummaryObjectFactory = null;
  let skillOpportunityObjectFactory:
    SkillOpportunityObjectFactory = null;
  let urlInterpolationService:
    UrlInterpolationService = null;
  const skillResponse = {
    opportunities: [{
      id: 'skill_id',
      skill_description: 'A new skill for question',
      topic_name: 'A new topic',
      question_count: 30
    }],
    next_cursor: '6',
    more: ''
  };
  const sampleExplorationSumary = {
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
    more: ''
  };
  let sampleSkillOpportunityResponse = null;
  let sampleTranslationOpportunityResponse = null;
  let sampleVoiceoverOpportunityResponse = null;

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
    sampleSkillOpportunityResponse = [
      skillOpportunityObjectFactory.createFromBackendDict(
        skillResponse.opportunities[0])
    ];
    sampleTranslationOpportunityResponse = [
      explorationOpportunitySummaryObjectFactory.createFromBackendDict(
        sampleExplorationSumary.opportunities[0]
      )
    ];
    sampleVoiceoverOpportunityResponse = [
      explorationOpportunitySummaryObjectFactory.createFromBackendDict(
        sampleExplorationSumary.opportunities[0]
      )
    ];
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  fit('should successfully fetch the skills data',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      contributionOpportunitiesBackendApiService.fetchSkillOpportunities(
        ''
      ).then(
        successHandler, failHandler
      );
      const req = httpTestingController.expectOne(
        urlInterpolationService.interpolateUrl(
          '/opportunitiessummaryhandler/<opportunityType>',
          { opportunityType: 'skill' }
        ) + `?cursor=${''}`
      );
      expect(req.request.method).toEqual('GET');
      req.flush(skillResponse);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        sampleSkillOpportunityResponse);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
  fit('should successfully fetch the translation data',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      contributionOpportunitiesBackendApiService.fetchTranslationOpportunities(
        'hi', '',
      ).then(
        successHandler, failHandler
      );
      const req = httpTestingController.expectOne(
        urlInterpolationService.interpolateUrl(
          '/opportunitiessummaryhandler/<opportunityType>',
          { opportunityType: 'translation' }
        ) + `?language_code=${'hi'}&cursor=${''}`
      );
      expect(req.request.method).toEqual('GET');
      req.flush(sampleExplorationSumary);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        sampleTranslationOpportunityResponse);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  fit('should successfully fetch the voiceover data',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      contributionOpportunitiesBackendApiService.fetchVoiceoverOpportunities(
        'hi', '',
      ).then(
        successHandler, failHandler
      );
      const req = httpTestingController.expectOne(
        urlInterpolationService.interpolateUrl(
          '/opportunitiessummaryhandler/<opportunityType>',
          { opportunityType: 'voiceover' }
        ) + `?language_code=${'hi'}&cursor=${''}`
      );
      expect(req.request.method).toEqual('GET');
      req.flush(sampleExplorationSumary);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        sampleVoiceoverOpportunityResponse);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
