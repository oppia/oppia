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
 * @fileoverview Unit tests for learner view info component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from '../../../../domain/exploration/read-only-exploration-backend-api.service';
import {
  ReadOnlyTopicBackendDict,
  ReadOnlyTopic,
} from 'domain/topic_viewer/read-only-topic.model';
import {TopicViewerBackendApiService} from '../../../../domain/topic_viewer/topic-viewer-backend-api.service';
import {UrlInterpolationService} from '../../../../domain/utilities/url-interpolation.service';
import {PageContextService} from '../../../../services/page-context.service';
import {UrlService} from '../../../../services/contextual/url.service';
import {I18nLanguageCodeService} from '../../../../services/i18n-language-code.service';
import {SiteAnalyticsService} from '../../../../services/site-analytics.service';
import {MockTranslatePipe} from '../../../../tests/unit-test-utils';
import {StatsReportingService} from '../../services/stats-reporting.service';
import {LearnerViewInfoComponent} from './learner-view-info.component';
import {LearnerViewInfoBackendApiService} from '../../services/learner-view-info-backend-api.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {
  LearnerExplorationSummaryBackendDict,
  TranslatableExplorationMetadataField,
} from 'domain/summary/learner-exploration-summary.model';

class MockPlatformFeatureService {
  status = {EnableTranslationOppsWithNewOppModels: {isEnabled: false}};
}

describe('Learner view info component', () => {
  let fixture: ComponentFixture<LearnerViewInfoComponent>;
  let componentInstance: LearnerViewInfoComponent;
  let pageContextService: PageContextService;
  let readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService;
  let siteAnalyticsService: SiteAnalyticsService;
  let statsReportingService: StatsReportingService;
  let urlInterpolationService: UrlInterpolationService;
  let urlService: UrlService;
  let topicViewerBackendApiService: TopicViewerBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let learnerViewInfoBackendApiService: LearnerViewInfoBackendApiService;
  let platformFeatureService: PlatformFeatureService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [LearnerViewInfoComponent, MockTranslatePipe],
      providers: [
        PageContextService,
        ReadOnlyExplorationBackendApiService,
        SiteAnalyticsService,
        StatsReportingService,
        UrlInterpolationService,
        UrlService,
        TopicViewerBackendApiService,
        {provide: PlatformFeatureService, useClass: MockPlatformFeatureService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerViewInfoComponent);
    componentInstance = fixture.componentInstance;
    pageContextService = TestBed.inject(PageContextService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    );
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    statsReportingService = TestBed.inject(StatsReportingService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    urlService = TestBed.inject(UrlService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    topicViewerBackendApiService = TestBed.inject(TopicViewerBackendApiService);
    learnerViewInfoBackendApiService = TestBed.inject(
      LearnerViewInfoBackendApiService
    );
    platformFeatureService = TestBed.inject(PlatformFeatureService);

    spyOn(topicViewerBackendApiService, 'fetchTopicDataAsync').and.resolveTo(
      ReadOnlyTopic.createFromBackendDict({
        subtopics: [],
        skill_descriptions: {},
        uncategorized_skill_ids: [],
        degrees_of_mastery: {},
        canonical_story_dicts: [],
        additional_story_dicts: [],
        topic_name: 'Topic Name 1',
        topic_id: 'topic1',
        topic_description: 'Description',
        practice_tab_is_displayed: false,
        meta_tag_content: 'content',
        page_title_fragment_for_web: 'title',
        classroom_name: 'math',
      } as ReadOnlyTopicBackendDict)
    );

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
  });

  afterEach(() => {
    componentInstance.ngOnDestory();
  });

  describe('accepted title translations', () => {
    beforeEach(() => {
      platformFeatureService.status.EnableTranslationOppsWithNewOppModels.isEnabled =
        true;
      spyOn(urlService, 'getPathname').and.returnValue('/explore/expId');
      spyOn(pageContextService, 'getExplorationId').and.returnValue('expId');
      spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(null);
      spyOn(urlService, 'getPidFromUrl').and.returnValue(null);
      spyOn(componentInstance, 'getTopicUrl').and.returnValue(null);
      spyOn(
        readOnlyExplorationBackendApiService,
        'fetchExplorationAsync'
      ).and.resolveTo({
        exploration: {title: 'Original title'},
      } as FetchExplorationBackendResponse);
    });

    it('should show the accepted title instead of a bundled translation', fakeAsync(() => {
      spyOn(
        learnerViewInfoBackendApiService,
        'fetchLearnerInfoAsync'
      ).and.resolveTo({
        summaries: [
          {
            title: 'पाई काटना',
            translated_metadata_fields: [
              TranslatableExplorationMetadataField.TITLE,
            ],
          } as LearnerExplorationSummaryBackendDict,
        ],
      });
      const bundledTranslation = spyOn(
        i18nLanguageCodeService,
        'isHackyTranslationDisplayed'
      ).and.returnValue(true);
      componentInstance.ngOnInit();
      tick();
      expect(
        learnerViewInfoBackendApiService.fetchLearnerInfoAsync
      ).toHaveBeenCalledWith('["expId"]', 'true');
      expect(componentInstance.explorationTitle).toBe('पाई काटना');
      expect(
        componentInstance.isHackyExpTitleTranslationDisplayed()
      ).toBeFalse();
      expect(bundledTranslation).not.toHaveBeenCalled();
    }));

    for (const summaries of [
      [],
      [
        {
          title: 'Current summary title',
        } as LearnerExplorationSummaryBackendDict,
      ],
      [
        {
          title: 'Translated objective only',
          translated_metadata_fields: [
            TranslatableExplorationMetadataField.OBJECTIVE,
          ],
        } as LearnerExplorationSummaryBackendDict,
      ],
    ]) {
      it(
        'should retain the original title without an accepted title (' +
          (summaries.length ? summaries[0].title : 'missing summary') +
          ')',
        fakeAsync(() => {
          spyOn(
            learnerViewInfoBackendApiService,
            'fetchLearnerInfoAsync'
          ).and.resolveTo({summaries});
          componentInstance.ngOnInit();
          tick();
          expect(componentInstance.explorationTitle).toBe('Original title');
          expect(componentInstance.hasTranslatedTitle).toBeFalse();
        })
      );
    }

    it('should retain the original title when summary loading fails', fakeAsync(() => {
      spyOn(
        learnerViewInfoBackendApiService,
        'fetchLearnerInfoAsync'
      ).and.rejectWith(new Error('Summary unavailable'));
      componentInstance.ngOnInit();
      tick();
      expect(componentInstance.explorationTitle).toBe('Original title');
    }));

    for (const preview of ['version', 'draft']) {
      it(
        'should preserve the title of a ' + preview + ' preview',
        fakeAsync(() => {
          if (preview === 'version') {
            (
              urlService.getExplorationVersionFromUrl as jasmine.Spy
            ).and.returnValue(1);
          } else {
            (urlService.getPidFromUrl as jasmine.Spy).and.returnValue(
              'draftId'
            );
          }
          spyOn(learnerViewInfoBackendApiService, 'fetchLearnerInfoAsync');
          componentInstance.ngOnInit();
          tick();
          expect(componentInstance.explorationTitle).toBe('Original title');
          expect(
            learnerViewInfoBackendApiService.fetchLearnerInfoAsync
          ).not.toHaveBeenCalled();
        })
      );
    }
  });

  it('should initialize when component loads into view', fakeAsync(() => {
    let explorationId = 'expId';
    let explorationTitle = 'Exploration Title';
    let topicUrl = 'topic_url';

    spyOn(urlService, 'getPathname').and.returnValue('/explore/');
    spyOn(pageContextService, 'getExplorationId').and.returnValue(
      explorationId
    );
    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(
      Promise.resolve({
        exploration: {
          title: explorationTitle,
        },
      } as FetchExplorationBackendResponse)
    );
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(componentInstance, 'getTopicUrl').and.returnValue(topicUrl);
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      ''
    );
    spyOn(statsReportingService, 'setTopicName');
    spyOn(siteAnalyticsService, 'registerCuratedLessonStarted');

    componentInstance.ngOnInit();
    tick();
    tick();

    expect(urlService.getPathname).toHaveBeenCalled();
    expect(pageContextService.getExplorationId).toHaveBeenCalled();
    expect(
      readOnlyExplorationBackendApiService.fetchExplorationAsync
    ).toHaveBeenCalled();
    expect(urlService.getExplorationVersionFromUrl).toHaveBeenCalled();
    expect(componentInstance.getTopicUrl).toHaveBeenCalled();
    expect(urlService.getTopicUrlFragmentFromLearnerUrl).toHaveBeenCalled();
    expect(topicViewerBackendApiService.fetchTopicDataAsync).toHaveBeenCalled();
    expect(statsReportingService.setTopicName).toHaveBeenCalled();
    expect(
      siteAnalyticsService.registerCuratedLessonStarted
    ).toHaveBeenCalled();
  }));

  it('should register community lesson start event', fakeAsync(() => {
    let explorationId = 'expId';
    let explorationTitle = 'Exploration Title';

    spyOn(urlService, 'getPathname').and.returnValue('/explore/');
    spyOn(pageContextService, 'getExplorationId').and.returnValue(
      explorationId
    );
    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(
      Promise.resolve({
        exploration: {
          title: explorationTitle,
        },
      } as FetchExplorationBackendResponse)
    );
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(componentInstance, 'getTopicUrl').and.returnValue('');
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      ''
    );
    spyOn(statsReportingService, 'setTopicName');
    spyOn(siteAnalyticsService, 'registerCommunityLessonStarted');

    componentInstance.ngOnInit();
    tick();
    tick();

    expect(
      siteAnalyticsService.registerCommunityLessonStarted
    ).toHaveBeenCalled();
  }));

  it('should get topic url from fragment correctly', () => {
    let topicUrl = 'topic_url';

    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic_url_fragment'
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroom_url_fragment'
    );
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(topicUrl);

    expect(componentInstance.getTopicUrl()).toEqual(topicUrl);
  });

  it(
    'should set topic name and subtopic title translation key and ' +
      'check whether hacky translations are displayed or not correctly',
    waitForAsync(() => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        'topic_url_fragment'
      );
      spyOn(
        urlService,
        'getClassroomUrlFragmentFromLearnerUrl'
      ).and.returnValue('classroom_url_fragment');
      spyOn(componentInstance, 'getTopicUrl').and.returnValue('topic_url');

      componentInstance.ngOnInit();
      fixture.whenStable().then(() => {
        fixture.detectChanges();

        expect(componentInstance.topicNameTranslationKey).toBe(
          'I18N_TOPIC_topic1_TITLE'
        );
        expect(componentInstance.explorationTitleTranslationKey).toBe(
          'I18N_EXPLORATION_test_id_TITLE'
        );

        spyOn(
          i18nLanguageCodeService,
          'isHackyTranslationAvailable'
        ).and.returnValues(true, false);
        spyOn(
          i18nLanguageCodeService,
          'isCurrentLanguageEnglish'
        ).and.returnValues(false, false);

        let hackyTopicNameTranslationIsDisplayed =
          componentInstance.isHackyTopicNameTranslationDisplayed();
        expect(hackyTopicNameTranslationIsDisplayed).toBe(true);

        let hackyExpTitleTranslationIsDisplayed =
          componentInstance.isHackyExpTitleTranslationDisplayed();
        expect(hackyExpTitleTranslationIsDisplayed).toBe(false);
      });
    })
  );
});
