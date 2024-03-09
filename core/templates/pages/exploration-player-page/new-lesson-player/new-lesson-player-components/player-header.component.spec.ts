// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for new lesson player header component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { ReadOnlyTopicBackendDict, ReadOnlyTopicObjectFactory } from 'domain/topic_viewer/read-only-topic-object.factory';
import { TopicViewerBackendApiService } from 'domain/topic_viewer/topic-viewer-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { StatsReportingService } from '../../services/stats-reporting.service';
import { PlayerHeaderComponent } from './player-header.component';
import { MobileMenuService } from '../new-lesson-player-services/mobile-menu.service';

describe('Lesson player header component', () => {
  let fixture: ComponentFixture<PlayerHeaderComponent>;
  let componentInstance: PlayerHeaderComponent;
  let contextService: ContextService;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let siteAnalyticsService: SiteAnalyticsService;
  let statsReportingService: StatsReportingService;
  let urlInterpolationService: UrlInterpolationService;
  let urlService: UrlService;
  let topicViewerBackendApiService: TopicViewerBackendApiService;
  let readOnlyTopicObjectFactory: ReadOnlyTopicObjectFactory;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let mobileMenuService: MobileMenuService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        PlayerHeaderComponent,
        MockTranslatePipe
      ],
      providers: [
        ContextService,
        ReadOnlyExplorationBackendApiService,
        SiteAnalyticsService,
        StatsReportingService,
        UrlInterpolationService,
        UrlService,
        TopicViewerBackendApiService,
        ReadOnlyTopicObjectFactory,
        MobileMenuService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerHeaderComponent);
    componentInstance = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    statsReportingService = TestBed.inject(StatsReportingService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    urlService = TestBed.inject(UrlService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    readOnlyTopicObjectFactory = TestBed.inject(ReadOnlyTopicObjectFactory);
    topicViewerBackendApiService = TestBed.inject(
      TopicViewerBackendApiService);
    mobileMenuService = TestBed.inject(MobileMenuService);

    spyOn(topicViewerBackendApiService, 'fetchTopicDataAsync').and.resolveTo(
      readOnlyTopicObjectFactory.createFromBackendDict({
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
      } as ReadOnlyTopicBackendDict)
    );

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
  });

  it('should initialize when component loads into view', fakeAsync(() => {
    let explorationId = 'expId';
    let explorationTitle = 'Exploration Title';
    let topicUrl = 'topic_url';

    spyOn(urlService, 'getPathname').and.returnValue('/explore/');
    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    spyOn(readOnlyExplorationBackendApiService, 'fetchExplorationAsync')
      .and.returnValue(Promise.resolve({
        exploration: {
          title: explorationTitle
        }
      } as FetchExplorationBackendResponse));
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(componentInstance, 'getTopicUrl').and.returnValue(topicUrl);
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('');
    spyOn(statsReportingService, 'setTopicName');
    spyOn(siteAnalyticsService, 'registerCuratedLessonStarted');

    componentInstance.ngOnInit();
    tick();
    tick();

    expect(urlService.getPathname).toHaveBeenCalled();
    expect(contextService.getExplorationId).toHaveBeenCalled();
    expect(readOnlyExplorationBackendApiService.fetchExplorationAsync)
      .toHaveBeenCalled();
    expect(urlService.getExplorationVersionFromUrl).toHaveBeenCalled();
    expect(componentInstance.getTopicUrl).toHaveBeenCalled();
    expect(urlService.getTopicUrlFragmentFromLearnerUrl).toHaveBeenCalled();
    expect(topicViewerBackendApiService.fetchTopicDataAsync).toHaveBeenCalled();
    expect(statsReportingService.setTopicName).toHaveBeenCalled();
    expect(siteAnalyticsService.registerCuratedLessonStarted)
      .toHaveBeenCalled();
  }));

  it('should register community lesson start event', fakeAsync(() => {
    let explorationId = 'expId';
    let explorationTitle = 'Exploration Title';

    spyOn(urlService, 'getPathname').and.returnValue('/explore/');
    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
    spyOn(readOnlyExplorationBackendApiService, 'fetchExplorationAsync')
      .and.returnValue(Promise.resolve({
        exploration: {
          title: explorationTitle
        }
      } as FetchExplorationBackendResponse));
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(componentInstance, 'getTopicUrl').and.returnValue('');
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('');
    spyOn(statsReportingService, 'setTopicName');
    spyOn(siteAnalyticsService, 'registerCommunityLessonStarted');

    componentInstance.ngOnInit();
    tick();
    tick();

    expect(siteAnalyticsService.registerCommunityLessonStarted)
      .toHaveBeenCalled();
  }));

  it('should get topic url from fragment correctly', () => {
    let topicUrl = 'topic_url';

    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic_url_fragment');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroom_url_fragment');
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(topicUrl);

    expect(componentInstance.getTopicUrl()).toEqual(topicUrl);
  });

  it('should set topic name and subtopic title translation key and ' +
  'check whether hacky translations are displayed or not correctly',
  waitForAsync(() => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl')
      .and.returnValue('topic_url_fragment');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('classroom_url_fragment');
    spyOn(componentInstance, 'getTopicUrl').and.returnValue('topic_url');

    componentInstance.ngOnInit();
    fixture.whenStable().then(() => {
      fixture.detectChanges();

      expect(componentInstance.topicNameTranslationKey)
        .toBe('I18N_TOPIC_topic1_TITLE');
      expect(componentInstance.explorationTitleTranslationKey)
        .toBe('I18N_EXPLORATION_test_id_TITLE');

      spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
        .and.returnValues(true, false);
      spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
        .and.returnValues(false, false);

      let hackyTopicNameTranslationIsDisplayed =
        componentInstance.isHackyTopicNameTranslationDisplayed();
      expect(hackyTopicNameTranslationIsDisplayed).toBe(true);

      let hackyExpTitleTranslationIsDisplayed =
        componentInstance.isHackyExpTitleTranslationDisplayed();
      expect(hackyExpTitleTranslationIsDisplayed).toBe(false);
    });
  }));

  it('should toggle menu on mobile', () => {
    spyOn(mobileMenuService, 'toggleMenuVisibility');
    componentInstance.toggleMenu();
    expect(mobileMenuService.toggleMenuVisibility).toHaveBeenCalled();
  });
});
