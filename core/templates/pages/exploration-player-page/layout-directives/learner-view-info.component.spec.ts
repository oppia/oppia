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
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {
  ReadOnlyTopicBackendDict,
  ReadOnlyTopicObjectFactory,
} from 'domain/topic_viewer/read-only-topic-object.factory';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';
import {StoryViewerBackendApiService} from 'domain/story_viewer/story-viewer-backend-api.service';
import {StoryPlaythrough} from 'domain/story_viewer/story-playthrough.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ContextService} from 'services/context.service';
import {UrlService} from 'services/contextual/url.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {StatsReportingService} from '../services/stats-reporting.service';
import {LearnerViewInfoComponent} from './learner-view-info.component';

describe('Learner view info component', () => {
  let fixture: ComponentFixture<LearnerViewInfoComponent>;
  let componentInstance: LearnerViewInfoComponent;
  let contextService: ContextService;
  let readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService;
  let storyViewerBackendApiService: StoryViewerBackendApiService;
  let siteAnalyticsService: SiteAnalyticsService;
  let statsReportingService: StatsReportingService;
  let urlInterpolationService: UrlInterpolationService;
  let urlService: UrlService;
  let topicViewerBackendApiService: TopicViewerBackendApiService;
  let readOnlyTopicObjectFactory: ReadOnlyTopicObjectFactory;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [LearnerViewInfoComponent, MockTranslatePipe],
      providers: [
        ContextService,
        ReadOnlyExplorationBackendApiService,
        SiteAnalyticsService,
        StatsReportingService,
        UrlInterpolationService,
        UrlService,
        TopicViewerBackendApiService,
        StoryViewerBackendApiService,
        ReadOnlyTopicObjectFactory,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerViewInfoComponent);
    componentInstance = fixture.componentInstance;
    contextService = TestBed.inject(ContextService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    );
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    statsReportingService = TestBed.inject(StatsReportingService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    urlService = TestBed.inject(UrlService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    readOnlyTopicObjectFactory = TestBed.inject(ReadOnlyTopicObjectFactory);
    topicViewerBackendApiService = TestBed.inject(TopicViewerBackendApiService);
    storyViewerBackendApiService = TestBed.inject(StoryViewerBackendApiService);

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
      true
    );
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
    expect(contextService.getExplorationId).toHaveBeenCalled();
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
    spyOn(contextService, 'getExplorationId').and.returnValue(explorationId);
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

  it('should not show chapter when exploration is not part of Topic', () => {
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      ''
    );

    componentInstance.ngOnInit();

    expect(componentInstance.explorationStoryChapter).toBeUndefined();
  });

  it('should show chapter when exploration is part of Topic', fakeAsync(() => {
    var firstSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_1',
      description: 'description',
      title: 'Title 1',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: 'exp_id_1',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private',
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
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
      },
      completed: true,
      thumbnail_bg_color: '#927117',
      thumbnail_filename: 'filename',
    };

    var secondSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_2',
      description: 'description',
      title: 'Title 2',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_3'],
      outline: 'Outline',
      exploration_id: 'test_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private',
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
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
      },
      completed: false,
      thumbnail_bg_color: '#927117',
      thumbnail_filename: 'filename',
    };

    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic_url_fragment'
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroom_url_fragment'
    );
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story_url_fragment'
    );

    spyOn(storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(
        StoryPlaythrough.createFromBackendDict({
          story_id: 'story_id',
          story_nodes: [
            firstSampleReadOnlyStoryNodeBackendDict,
            secondSampleReadOnlyStoryNodeBackendDict,
          ],
          story_title: 'story',
          story_description: 'Story_Description',
          topic_name: 'Topic 1',
          meta_tag_content: 'Story meta tag content',
        })
      )
    );

    componentInstance.ngOnInit();

    tick();
    tick();

    expect(componentInstance.explorationStoryChapter).toBe(2);
  }));

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
      spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
        'story_url_fragment'
      );
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
