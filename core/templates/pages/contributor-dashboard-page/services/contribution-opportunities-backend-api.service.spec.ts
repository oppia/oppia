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
  'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import { SkillOpportunity } from
  'domain/opportunity/skill-opportunity.model';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { FeaturedTranslationLanguage } from 'domain/opportunity/featured-translation-language.model';
import { ExplorationOpportunitySummary } from 'domain/opportunity/exploration-opportunity-summary.model';

describe('Contribution Opportunities backend API service', function() {
  let contributionOpportunitiesBackendApiService:
    ContributionOpportunitiesBackendApiService;
  let httpTestingController: HttpTestingController;
  let urlInterpolationService: UrlInterpolationService;
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
  const translationOpportunities = [{
    id: 'exp_id',
    topic_name: 'Topic',
    story_title: 'A new story',
    chapter_title: 'Introduction',
    content_count: 100,
    translation_counts: {
      hi: 15
    },
    translation_in_review_counts: {
      hi: 15
    }
  }];
  const translationOpportunityResponse = {
    opportunities: translationOpportunities,
    next_cursor: '6',
    more: true
  };
  let sampleSkillOpportunitiesResponse: SkillOpportunity[];
  let sampleTranslationOpportunitiesResponse: ExplorationOpportunitySummary[];
  let sampleVoiceoverOpportunitiesResponse: ExplorationOpportunitySummary[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    contributionOpportunitiesBackendApiService =
      TestBed.get(ContributionOpportunitiesBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    urlInterpolationService = TestBed.get(UrlInterpolationService);
    sampleSkillOpportunitiesResponse = [
      SkillOpportunity.createFromBackendDict(
        skillOpportunityResponse.opportunities[0])
    ];
    sampleTranslationOpportunitiesResponse = [
      ExplorationOpportunitySummary.createFromBackendDict(
        translationOpportunityResponse.opportunities[0]
      )
    ];
    sampleVoiceoverOpportunitiesResponse = [
      ExplorationOpportunitySummary.createFromBackendDict(
        translationOpportunityResponse.opportunities[0]
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

      contributionOpportunitiesBackendApiService.fetchSkillOpportunitiesAsync(
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

      expect(successHandler).toHaveBeenCalledWith({
        opportunities: sampleSkillOpportunitiesResponse,
        nextCursor: skillOpportunityResponse.next_cursor,
        more: skillOpportunityResponse.more
      });
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should fail to fetch the skill opportunities data ' +
    'given invalid cursor ' +
    'when calling \'fetchSkillOpportunitiesAsync\'', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    contributionOpportunitiesBackendApiService.fetchSkillOpportunitiesAsync(
      'invalidCursor').then(successHandler, failHandler);
    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        '/opportunitiessummaryhandler/<opportunityType>',
        { opportunityType: 'skill' }
      ) + '?cursor=invalidCursor'
    );

    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Failed to fetch skill opportunities data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      new Error('Failed to fetch skill opportunities data.'));
  }));

  it('should successfully fetch the translation opportunities data',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      contributionOpportunitiesBackendApiService
        .fetchTranslationOpportunitiesAsync('hi', 'All', '').then(
          successHandler, failHandler
        );
      const req = httpTestingController.expectOne(
        urlInterpolationService.interpolateUrl(
          '/opportunitiessummaryhandler/<opportunityType>',
          { opportunityType: 'translation' }
        ) + '?language_code=hi&topic_name=&cursor='
      );
      expect(req.request.method).toEqual('GET');
      req.flush(translationOpportunityResponse);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        opportunities: sampleTranslationOpportunitiesResponse,
        nextCursor: translationOpportunityResponse.next_cursor,
        more: translationOpportunityResponse.more
      });
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should fail to fetch the translation opportunities data ' +
    'given invalid language code ' +
    'when calling \'fetchTranslationOpportunitiesAsync\'', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    contributionOpportunitiesBackendApiService
      .fetchTranslationOpportunitiesAsync(
        'invlaidCode', 'Topic', 'invalidCursor').then(
        successHandler, failHandler
      );
    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        '/opportunitiessummaryhandler/<opportunityType>',
        { opportunityType: 'translation' }
      ) + '?language_code=invlaidCode&topic_name=Topic&cursor=invalidCursor'
    );

    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Failed to fetch translation opportunities data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      new Error('Failed to fetch translation opportunities data.'));
  }));

  it('should successfully fetch the voiceover opportunities data',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      contributionOpportunitiesBackendApiService
        .fetchVoiceoverOpportunitiesAsync('hi', '',).then(
          successHandler, failHandler
        );
      const req = httpTestingController.expectOne(
        urlInterpolationService.interpolateUrl(
          '/opportunitiessummaryhandler/<opportunityType>',
          { opportunityType: 'voiceover' }
        ) + '?language_code=hi&cursor='
      );
      expect(req.request.method).toEqual('GET');
      req.flush(translationOpportunityResponse);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        opportunities: sampleVoiceoverOpportunitiesResponse,
        nextCursor: translationOpportunityResponse.next_cursor,
        more: translationOpportunityResponse.more
      });
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should fail to fetch the voiceover opportunities data ' +
    'given invalid language code ' +
    'when calling \'fetchVoiceoverOpportunitiesAsync\'', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    contributionOpportunitiesBackendApiService
      .fetchVoiceoverOpportunitiesAsync('invalidCode', 'invalidCursor',).then(
        successHandler, failHandler
      );
    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        '/opportunitiessummaryhandler/<opportunityType>',
        { opportunityType: 'voiceover' }
      ) + '?language_code=invalidCode&cursor=invalidCursor'
    );

    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Failed to fetch voiceover opportunities data.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      new Error('Failed to fetch voiceover opportunities data.'));
  }));

  it('should successfully fetch reviewable translation opportunities',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      contributionOpportunitiesBackendApiService
        .fetchReviewableTranslationOpportunitiesAsync('All').then(
          successHandler, failHandler
        );
      const req = httpTestingController.expectOne(
        urlInterpolationService.interpolateUrl(
          '/getreviewableopportunitieshandler',
          {}
        ) + '?topic_name=All'
      );
      expect(req.request.method).toEqual('GET');
      req.flush({opportunities: translationOpportunities});

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        opportunities: sampleTranslationOpportunitiesResponse
      });
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should fail to fetch reviewable translation opportunities ' +
    'given invalid topic name when calling ' +
    'fetchReviewableTranslationOpportunitiesAsync', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    contributionOpportunitiesBackendApiService
      .fetchReviewableTranslationOpportunitiesAsync('invalid').then(
        successHandler, failHandler
      );
    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        '/getreviewableopportunitieshandler',
        {}
      ) + '?topic_name=invalid'
    );

    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Failed to fetch reviewable translation opportunities.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      new Error('Failed to fetch reviewable translation opportunities.'));
  }));

  it('should successfully fetch the featured translation languages',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      contributionOpportunitiesBackendApiService
        .fetchFeaturedTranslationLanguagesAsync()
        .then(successHandler, failHandler);

      const req = httpTestingController.expectOne(
        '/retrivefeaturedtranslationlanguages'
      );
      expect(req.request.method).toEqual('GET');
      req.flush({
        featured_translation_languages:
          [{ language_code: 'en', explanation: 'English' }]
      });

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith([
        FeaturedTranslationLanguage.createFromBackendDict(
          { language_code: 'en', explanation: 'English' }
        )
      ]);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should fail to fetch the featured translation languages ' +
    'when calling \'fetchFeaturedTranslationLanguagesAsync\'', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    let emptyList: FeaturedTranslationLanguage[] = [];

    contributionOpportunitiesBackendApiService
      .fetchFeaturedTranslationLanguagesAsync()
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/retrivefeaturedtranslationlanguages'
    );
    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Failed to fetch featured translation languages.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(emptyList);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully fetch translatable topic names', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    contributionOpportunitiesBackendApiService
      .fetchTranslatableTopicNamesAsync()
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne('/gettranslatabletopicnames');
    expect(req.request.method).toEqual('GET');
    req.flush({ topic_names: ['Topic 1', 'Topic 2'] });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      ['All', 'Topic 1', 'Topic 2']
    );
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should return empty response if \'gettranslatabletopicnames call fails',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');
      const emptyResponse: string [] = [];

      contributionOpportunitiesBackendApiService
        .fetchTranslatableTopicNamesAsync()
        .then(successHandler, failHandler);

      const req = httpTestingController.expectOne(
        '/gettranslatabletopicnames'
      );
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Failed to fetch translatable topic names.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(emptyResponse);
      expect(failHandler).not.toHaveBeenCalled();
    }));
});
