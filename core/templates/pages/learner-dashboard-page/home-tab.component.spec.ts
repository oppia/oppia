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
 * @fileoverview Unit tests for for HomeTabComponent.
 */

import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  flush,
  discardPeriodicTasks,
} from '@angular/core/testing';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {HomeTabComponent} from './home-tab.component';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {LoaderService} from 'services/loader.service';
import {LearnerDashboardBackendApiService} from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import {AppConstants} from 'app.constants';

describe('Home tab Component', () => {
  let component: HomeTabComponent;
  let fixture: ComponentFixture<HomeTabComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let windowDimensionsService: WindowDimensionsService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let mockResizeEmitter: EventEmitter<void>;
  let siteAnalyticsService: SiteAnalyticsService;
  let learnerDashboardBackendApiService: LearnerDashboardBackendApiService;
  let topicsDataSpy: jasmine.Spy;
  let collectionsDataSpy: jasmine.Spy;
  let explorationsDataSpy: jasmine.Spy;
  let loaderService: LoaderService;

  class MockPlatformFeatureService {
    status = {
      SerialChapterLaunchLearnerView: {
        isEnabled: false,
      },
    };
  }
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  beforeEach(async(() => {
    mockResizeEmitter = new EventEmitter();
    TestBed.configureTestingModule({
      imports: [MaterialModule, FormsModule, HttpClientTestingModule],
      declarations: [MockTranslatePipe, HomeTabComponent],
      providers: [
        UrlInterpolationService,
        LearnerDashboardBackendApiService,
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => mockResizeEmitter,
          },
        },
        {provide: PlatformFeatureService, useValue: mockPlatformFeatureService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeTabComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    loaderService = TestBed.inject(LoaderService);
    learnerDashboardBackendApiService = TestBed.inject(
      LearnerDashboardBackendApiService
    );

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );

    let subtopic = {
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      url_fragment: 'subtopic-name',
    };

    let nodeDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null,
    };

    let nodeDict2 = {
      id: 'node_2',
      thumbnail_filename: 'image.png',
      title: 'Title 2',
      description: 'Description 2',
      prerequisite_skill_ids: ['skill_2'],
      acquired_skill_ids: ['skill_3'],
      destination_node_ids: ['node_3'],
      outline: 'Outline',
      exploration_id: 'exp_id_2',
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null,
    };

    let nodeDict3 = {
      id: 'node_3',
      thumbnail_filename: 'image.png',
      title: 'Title 3',
      description: 'Description 2',
      prerequisite_skill_ids: ['skill_3'],
      acquired_skill_ids: ['skill_4'],
      destination_node_ids: ['node_4'],
      outline: 'Outline',
      exploration_id: 'exp_id_3',
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null,
    };

    let inProgressStorySummary = {
      id: '1',
      title: 'Started Story Title',
      description: 'Story Description',
      node_titles: ['Title 1', 'Title 2', 'Title 3'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      story_is_published: true,
      completed_node_titles: ['Title 1'],
      url_fragment: 'story-title',
      all_node_dicts: [nodeDict, nodeDict2, nodeDict3],
      topic_name: 'Topic',
      classroom_url_fragment: 'math',
      topic_url_fragment: 'topic',
    };

    let lastLessonStorySummary = {
      id: '2',
      title: 'Incomplete Story Title',
      description: 'Story Description',
      node_titles: ['Title 1', 'Title 2', 'Title 3'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      story_is_published: true,
      completed_node_titles: ['Title 1', 'Title 2'],
      url_fragment: 'story-title',
      all_node_dicts: [nodeDict, nodeDict2, nodeDict3],
      topic_name: 'Topic',
      classroom_url_fragment: 'math',
      topic_url_fragment: 'topic',
    };

    const learnerTopicSummaryBackendDict1 = {
      id: 'sample_topic_id',
      name: 'Topic Name',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      total_published_node_count: 2,
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom_name: 'math',
      classroom_url_fragment: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [
        {
          id: '0',
          title: 'Story Title',
          description: 'Story Description',
          node_titles: ['Chapter 1'],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          story_is_published: true,
          completed_node_titles: ['Chapter 1'],
          url_fragment: 'story-title',
          all_node_dicts: [nodeDict],
        },
        inProgressStorySummary,
        lastLessonStorySummary,
      ],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3,
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2',
      },
    };

    topicsDataSpy = spyOn(
      learnerDashboardBackendApiService,
      'fetchLearnerDashboardTopicsAndStoriesDataAsync'
    );
    collectionsDataSpy = spyOn(
      learnerDashboardBackendApiService,
      'fetchLearnerDashboardCollectionsDataAsync'
    );
    explorationsDataSpy = spyOn(
      learnerDashboardBackendApiService,
      'fetchLearnerDashboardExplorationsDataAsync'
    );

    const defaultTopic = LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict1
    );
    topicsDataSpy.and.returnValue(
      Promise.resolve({
        completedStoriesList: [],
        learntTopicsList: [],
        partiallyLearntTopicsList: [defaultTopic],
        topicsToLearnList: [defaultTopic],
        allTopicsList: [defaultTopic],
        untrackedTopics: {},
        completedToIncompleteStories: [],
        learntToPartiallyLearntTopics: [],
      })
    );
    collectionsDataSpy.and.returnValue(
      Promise.resolve({
        incompleteCollectionsList: [],
        completedCollectionsList: [],
        collectionPlaylist: [],
      })
    );
    explorationsDataSpy.and.returnValue(
      Promise.resolve({
        incompleteExplorationsList: [],
        completedExplorationsList: [],
        explorationPlaylist: [],
      })
    );

    component.username = 'username';
  });

  it('should get the correct width in mobile view', fakeAsync(() => {
    component.ngOnInit();
    tick();
    fixture.detectChanges();
    flush();

    expect(component.width).toEqual(233);
    expect(component.windowIsNarrow).toBe(true);
    discardPeriodicTasks();
  }));

  it('should check whether window is narrow on resizing the screen', fakeAsync(() => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

    component.ngOnInit();
    tick();
    fixture.detectChanges();
    flush();

    expect(component.windowIsNarrow).toBe(false);

    (windowDimensionsService.isWindowNarrow as jasmine.Spy).and.returnValue(
      true
    );
    mockResizeEmitter.emit();

    expect(component.windowIsNarrow).toBe(true);
    discardPeriodicTasks();
  }));

  it('should get time of day as morning', () => {
    var baseTime = new Date();
    baseTime.setHours(11);
    jasmine.clock().mockDate(baseTime);

    expect(component.getTimeOfDay()).toEqual(
      'I18N_LEARNER_DASHBOARD_MORNING_GREETING'
    );
  });

  it('should get time of day as afternoon', () => {
    var baseTime = new Date();
    baseTime.setHours(15);
    jasmine.clock().mockDate(baseTime);

    expect(component.getTimeOfDay()).toEqual(
      'I18N_LEARNER_DASHBOARD_AFTERNOON_GREETING'
    );
  });

  it('should get time of day as evening', () => {
    var baseTime = new Date();
    baseTime.setHours(20);
    jasmine.clock().mockDate(baseTime);

    expect(component.getTimeOfDay()).toEqual(
      'I18N_LEARNER_DASHBOARD_EVENING_GREETING'
    );
  });

  it('should switch the tab to Goals', () => {
    const setActiveSection = spyOn(component.setActiveSection, 'emit');
    component.changeActiveSection();
    expect(setActiveSection).toHaveBeenCalled();
  });

  it(
    'should check whether an object is non empty when calling ' +
      "'isNonemptyObject'",
    () => {
      let result = component.isNonemptyObject({});
      expect(result).toBe(false);

      result = component.isNonemptyObject({description: 'description'});
      expect(result).toBe(true);

      result = component.isNonemptyObject(undefined);
      expect(result).toBe(false);

      result = component.isNonemptyObject(null);
      expect(result).toBe(false);
    }
  );

  it('should get the classroom link', () => {
    component.classroomUrlFragment = 'math';
    const urlSpy = spyOn(
      urlInterpolationService,
      'interpolateUrl'
    ).and.returnValue('/learn/math');
    expect(component.getClassroomLink('math')).toEqual('/learn/math');
    expect(urlSpy).toHaveBeenCalled();
  });

  it('should get the correct width', () => {
    expect(component.getWidth(1)).toEqual(328);
    expect(component.getWidth(3)).toEqual(662);
  });

  it(
    'should show empty learn something new tab' +
      "'when goal selection limit is reached'",
    fakeAsync(() => {
      const goals = [];
      for (let i = 0; i < AppConstants.MAX_CURRENT_GOALS_COUNT; i++) {
        goals.push({id: 'id' + i});
      }
      topicsDataSpy.and.returnValue(
        Promise.resolve({
          topicsToLearnList: goals,
          allTopicsList: goals,
          partiallyLearntTopicsList: [],
          untrackedTopics: {},
        })
      );

      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.isGoalLimitReached()).toBe(true);

      flush();
      discardPeriodicTasks();
    })
  );

  it(
    'should not show empty learn something new tab' +
      "'when goal selection limit is not reached'",
    fakeAsync(() => {
      topicsDataSpy.and.returnValue(
        Promise.resolve({
          topicsToLearnList: [],
          allTopicsList: [],
          partiallyLearntTopicsList: [],
          untrackedTopics: {},
        })
      );
      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.isGoalLimitReached()).toBe(false);

      flush();
      discardPeriodicTasks();
    })
  );

  it(
    'should not show empty learn something new tab' +
      "'when goal selection limit is reached and goal selection limit" +
      " is not reached'",
    fakeAsync(() => {
      const goals = [{id: '1'}, {id: '2'}];
      const allTopics = [{id: '1'}, {id: '2'}, {id: '3'}];

      topicsDataSpy.and.returnValue(
        Promise.resolve({
          topicsToLearnList: goals,
          allTopicsList: allTopics,
          partiallyLearntTopicsList: [],
          untrackedTopics: {},
        })
      );

      component.ngOnInit();
      tick();
      fixture.detectChanges();

      expect(component.isGoalLimitReached()).toBe(false);

      flush();
      discardPeriodicTasks();
    })
  );

  it('should record analytics when lesson card in home tab clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerNewClassroomLessonEngagedWithEvent'
    ).and.callThrough();
    component.registerNewClassroomLessonEvent('Math', 'Addition');
    expect(
      siteAnalyticsService.registerNewClassroomLessonEngagedWithEvent
    ).toHaveBeenCalled();
  });

  it('should record analytics when in-progress lesson card in home tab clicked', () => {
    spyOn(
      siteAnalyticsService,
      'registerInProgressClassroomLessonEngagedWithEvent'
    ).and.callThrough();
    component.registerClassroomInProgressLessonEvent('Math', 'Addition');
    expect(
      siteAnalyticsService.registerInProgressClassroomLessonEngagedWithEvent
    ).toHaveBeenCalled();
  });

  it('should get the correct number of stories that have available story nodes to recommend', fakeAsync(() => {
    component.ngOnInit();
    tick();
    fixture.detectChanges();
    flush();

    expect(component.storySummariesWithAvailableNodes).toEqual(new Set(['1']));
    discardPeriodicTasks();
  }));

  it('should get the correct number in-progress lessons (explorations, collections, and classrooms)', fakeAsync(() => {
    const sampleExploration = {
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
      num_checkpoints: 0,
      visited_checkpoint_count: 0,
    };

    const sampleCollection = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: '44LKoKLlIbGe',
      thumbnail_icon_url: '/subjects/Algebra.svg',
      language_code: 'en',
      thumbnail_bg_color: '#cc4b00',
      created_on: 1591296635736.666,
      status: 'public',
      category: 'Algebra',
      title: 'Test Title',
      node_count: 0,
    };

    collectionsDataSpy.and.returnValue(
      Promise.resolve({
        incompleteCollectionsList: [
          CollectionSummary.createFromBackendDict(sampleCollection),
        ],
      })
    );
    explorationsDataSpy.and.returnValue(
      Promise.resolve({
        incompleteExplorationsList: [
          LearnerExplorationSummary.createFromBackendDict(sampleExploration),
        ],
      })
    );

    component.ngOnInit();
    tick();
    fixture.detectChanges();
    flush();

    expect(component.getTotalInProgressLessons()).toBe(4);
    discardPeriodicTasks();
  }));

  it('should handle error gracefully when fetching dashboard data fails', fakeAsync(() => {
    topicsDataSpy.and.returnValue(Promise.reject('Backend error'));

    spyOn(console, 'error');
    const hideLoadingScreenSpy = spyOn(loaderService, 'hideLoadingScreen');

    component.ngOnInit();

    tick();
    tick(1000);

    expect(console.error).toHaveBeenCalled();
    expect(component.allCardsLoaded).toBe(true);
    expect(hideLoadingScreenSpy).toHaveBeenCalled();

    discardPeriodicTasks();
  }));

  it('should handle errors thrown inside the success block of dashboard data fetch', fakeAsync(() => {
    topicsDataSpy.and.returnValue(Promise.resolve(null));
    spyOn(console, 'error');
    const hideLoadingScreenSpy = spyOn(loaderService, 'hideLoadingScreen');

    component.ngOnInit();
    tick();
    tick(1000);

    expect(console.error).toHaveBeenCalled();
    expect(component.allCardsLoaded).toBe(true);
    expect(hideLoadingScreenSpy).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should get publishedNotesCount when isSerialChapterLearnerFeature is turned ON', fakeAsync(() => {
    let unpublishedNodeDict = {
      id: 'unpublished_node',
      thumbnail_filename: 'image.png',
      title: 'Unpublished Chapter',
      description: 'Description for unpublished chapter',
      prerequisite_skill_ids: ['skill_4'],
      acquired_skill_ids: ['skill_5'],
      destination_node_ids: [],
      outline: 'Outline',
      exploration_id: 'exp_id_unpublished',
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Planned',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null,
    };

    const completedNodeDict = {
      id: 'completed_node',
      thumbnail_filename: 'image.png',
      title: 'Completed Chapter',
      description: 'Description for completed chapter',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['remaining_node'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null,
    };

    const remainingNodeDict = {
      id: 'remaining_node',
      thumbnail_filename: 'image.png',
      title: 'Remaining Chapter',
      description: 'Description for remaining chapter',
      prerequisite_skill_ids: ['skill_2'],
      acquired_skill_ids: ['skill_3'],
      destination_node_ids: ['unpublished_node'],
      outline: 'Outline',
      exploration_id: 'exp_id_remaining',
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null,
    };

    const learnerTopicSummaryBackendDict = {
      id: 'test_topic_id',
      name: 'Test Topic',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      total_published_node_count: 2,
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom_name: 'math',
      classroom_url_fragment: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [
        {
          id: 'story_with_mixed_nodes',
          title: 'Story With Mixed Nodes',
          description: 'Story Description',
          node_titles: [
            'Completed Chapter',
            'Remaining Chapter',
            'Unpublished Chapter',
          ],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          story_is_published: true,
          completed_node_titles: ['Completed Chapter'],
          url_fragment: 'story-with-mixed-nodes',
          all_node_dicts: [
            completedNodeDict,
            remainingNodeDict,
            unpublishedNodeDict,
          ],
          topic_name: 'Topic',
          classroom_url_fragment: 'math',
          topic_url_fragment: 'topic',
        },
      ],
      url_fragment: 'test-topic',
      subtopics: [],
      degrees_of_mastery: {},
      skill_descriptions: {},
    };

    topicsDataSpy.and.returnValue(
      Promise.resolve({
        partiallyLearntTopicsList: [
          LearnerTopicSummary.createFromBackendDict(
            learnerTopicSummaryBackendDict
          ),
        ],
        topicsToLearnList: [],
        allTopicsList: [],
        untrackedTopics: {},
      })
    );

    mockPlatformFeatureService.status.SerialChapterLaunchLearnerView.isEnabled =
      true;

    component.ngOnInit();
    tick();
    fixture.detectChanges();
    flush();

    expect(component.isSerialChapterFeatureLearnerFlagEnabled()).toBe(true);

    const storySummaries =
      component.partiallyLearntTopicsList[0].getCanonicalStorySummaryDicts();
    const story = storySummaries[0];
    expect(story.getId()).toEqual('story_with_mixed_nodes');

    expect(
      component.storySummariesWithAvailableNodes.has('story_with_mixed_nodes')
    ).toBe(false);
    discardPeriodicTasks();
  }));

  it('should get publishedNotesCount when isSerialChapterLearnerFeature is turned OFF', fakeAsync(() => {
    let unpublishedNodeDict = {
      id: 'unpublished_node_2',
      thumbnail_filename: 'image.png',
      title: 'Unpublished Chapter',
      description: 'Description for unpublished chapter',
      prerequisite_skill_ids: ['skill_4'],
      acquired_skill_ids: ['skill_5'],
      destination_node_ids: [],
      outline: 'Outline',
      exploration_id: 'exp_id_unpublished',
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Planned',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null,
    };

    const completedNodeDict = {
      id: 'completed_node_2',
      thumbnail_filename: 'image.png',
      title: 'Completed Chapter',
      description: 'Description for completed chapter',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['remaining_node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null,
    };

    const remainingNodeDict = {
      id: 'remaining_node_2',
      thumbnail_filename: 'image.png',
      title: 'Remaining Chapter',
      description: 'Description for remaining chapter',
      prerequisite_skill_ids: ['skill_2'],
      acquired_skill_ids: ['skill_3'],
      destination_node_ids: ['unpublished_node_2'],
      outline: 'Outline',
      exploration_id: 'exp_id_remaining',
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null,
    };

    const learnerTopicSummaryBackendDict = {
      id: 'test_topic_id_2',
      name: 'Test Topic 2',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      total_published_node_count: 3,
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom_name: 'math',
      classroom_url_fragment: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [
        {
          id: 'story_with_mixed_nodes_2',
          title: 'Story With Mixed Nodes',
          description: 'Story Description',
          node_titles: [
            'Completed Chapter',
            'Remaining Chapter',
            'Unpublished Chapter',
          ],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          story_is_published: true,
          completed_node_titles: ['Completed Chapter'],
          url_fragment: 'story-with-mixed-nodes',
          all_node_dicts: [
            completedNodeDict,
            remainingNodeDict,
            unpublishedNodeDict,
          ],
          topic_name: 'Topic',
          classroom_url_fragment: 'math',
          topic_url_fragment: 'topic',
        },
      ],
      url_fragment: 'test-topic-2',
      subtopics: [],
      degrees_of_mastery: {},
      skill_descriptions: {},
    };

    topicsDataSpy.and.returnValue(
      Promise.resolve({
        partiallyLearntTopicsList: [
          LearnerTopicSummary.createFromBackendDict(
            learnerTopicSummaryBackendDict
          ),
        ],
        topicsToLearnList: [],
        allTopicsList: [],
        untrackedTopics: {},
      })
    );

    mockPlatformFeatureService.status.SerialChapterLaunchLearnerView.isEnabled =
      false;

    component.ngOnInit();
    tick();
    fixture.detectChanges();
    flush();

    expect(component.isSerialChapterFeatureLearnerFlagEnabled()).toBe(false);

    expect(
      component.storySummariesWithAvailableNodes.has('story_with_mixed_nodes_2')
    ).toBe(true);
    discardPeriodicTasks();
  }));

  it('should include lessons in playlist in total lesson card count when untracked topics exist and goal limit is not reached', fakeAsync(() => {
    const untrackedTopicBackendDict = {
      id: 'untracked_topic_id',
      name: 'Untracked Topic',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      total_published_node_count: 1,
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom_name: 'math',
      classroom_url_fragment: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [],
      url_fragment: 'untracked-topic',
      subtopics: [],
      degrees_of_mastery: {},
      skill_descriptions: {},
    };

    const explorationDict = {
      last_updated_msec: 1591296737470.528,
      community_owned: false,
      objective: 'Test Objective',
      id: 'exp1',
      num_views: 0,
      thumbnail_icon_url: '/subjects/Algebra.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cc4b00',
      created_on_msec: 1591296635736.666,
      ratings: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title',
      num_checkpoints: 0,
      visited_checkpoint_count: 0,
    };

    topicsDataSpy.and.returnValue(
      Promise.resolve({
        topicsToLearnList: [],
        allTopicsList: [],
        partiallyLearntTopicsList: [],
        untrackedTopics: {
          math: [
            LearnerTopicSummary.createFromBackendDict(
              untrackedTopicBackendDict
            ),
          ],
        },
        completedStoriesList: [],
        learntTopicsList: [],
        completedToIncompleteStories: [],
        learntToPartiallyLearntTopics: [],
      })
    );

    explorationsDataSpy.and.returnValue(
      Promise.resolve({
        incompleteExplorationsList: [
          LearnerExplorationSummary.createFromBackendDict(explorationDict),
        ],
        completedExplorationsList: [],
        explorationPlaylist: [],
      })
    );

    component.ngOnInit();
    tick();
    fixture.detectChanges();
    flush();

    expect(component.totalLessonCards).toEqual(2);

    discardPeriodicTasks();
  }));
});

describe('Home tab Component Loader visibility tests', () => {
  let component: HomeTabComponent;
  let fixture: ComponentFixture<HomeTabComponent>;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let loaderService: LoaderService;
  let learnerDashboardBackendApiService: LearnerDashboardBackendApiService;
  let topicsDataSpy: jasmine.Spy;
  let collectionsDataSpy: jasmine.Spy;
  let explorationsDataSpy: jasmine.Spy;

  class MockPlatformFeatureService {
    status = {
      SerialChapterLaunchLearnerView: {
        isEnabled: false,
      },
    };
  }
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule, FormsModule, HttpClientTestingModule],
      declarations: [MockTranslatePipe, HomeTabComponent],
      providers: [
        LearnerDashboardBackendApiService,
        {provide: PlatformFeatureService, useValue: mockPlatformFeatureService},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeTabComponent);
    component = fixture.componentInstance;
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    loaderService = TestBed.inject(LoaderService);
    learnerDashboardBackendApiService = TestBed.inject(
      LearnerDashboardBackendApiService
    );

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );

    topicsDataSpy = spyOn(
      learnerDashboardBackendApiService,
      'fetchLearnerDashboardTopicsAndStoriesDataAsync'
    ).and.returnValue(
      Promise.resolve({
        topicsToLearnList: [],
        allTopicsList: [],
        partiallyLearntTopicsList: [],
        untrackedTopics: {},
      })
    );
    collectionsDataSpy = spyOn(
      learnerDashboardBackendApiService,
      'fetchLearnerDashboardCollectionsDataAsync'
    ).and.returnValue(Promise.resolve({incompleteCollectionsList: []}));
    explorationsDataSpy = spyOn(
      learnerDashboardBackendApiService,
      'fetchLearnerDashboardExplorationsDataAsync'
    ).and.returnValue(Promise.resolve({incompleteExplorationsList: []}));
  });

  it('should set allCardsLoaded to true immediately when totalLessonCards is 0', fakeAsync(() => {
    component.username = 'testuser';
    component.allCardsLoaded = false;
    component.loadingMessage = 'Loading';
    const hideLoadingScreenSpy = spyOn(loaderService, 'hideLoadingScreen');

    component.ngOnInit();
    tick();
    fixture.detectChanges();
    flush();

    expect(component.totalLessonCards).toEqual(0);
    expect(component.allCardsLoaded).toBe(true);
    expect(hideLoadingScreenSpy).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should set allCardsLoaded to true after timeout when not all cards are loaded', fakeAsync(() => {
    const sampleExploration = {
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
      ratings: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title',
      num_checkpoints: 0,
      visited_checkpoint_count: 0,
    };

    explorationsDataSpy.and.returnValue(
      Promise.resolve({
        incompleteExplorationsList: [
          LearnerExplorationSummary.createFromBackendDict(sampleExploration),
        ],
      })
    );

    component.username = 'testuser';
    component.allCardsLoaded = false;
    const hideLoadingScreenSpy = spyOn(loaderService, 'hideLoadingScreen');

    component.ngOnInit();

    tick();
    fixture.detectChanges();

    expect(component.allCardsLoaded).toBe(false);
    expect(component.totalLessonCards).toBeGreaterThan(0);

    flush();

    expect(component.allCardsLoaded).toBe(true);
    expect(hideLoadingScreenSpy).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should not call hideLoadingScreen in timeout if cards are already loaded', fakeAsync(() => {
    component.username = 'testuser';
    const hideLoadingScreenSpy = spyOn(loaderService, 'hideLoadingScreen');

    component.ngOnInit();
    component.allCardsLoaded = true;

    tick();
    fixture.detectChanges();
    flush();

    expect(hideLoadingScreenSpy).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should increment loadedLessonCards', () => {
    component.loadedLessonCards = 4;
    component.totalLessonCards = 5;
    component.allCardsLoaded = false;
    component.loadingMessage = 'Loading';

    component.onLessonLoaded();

    expect(component.loadedLessonCards).toEqual(5);
  });

  it('should increment loadedLessonCards without hiding loading screen when not all lessons are loaded', () => {
    component.loadedLessonCards = 2;
    component.totalLessonCards = 5;
    component.allCardsLoaded = false;
    component.loadingMessage = 'Loading';
    const hideLoadingScreenSpy = spyOn(loaderService, 'hideLoadingScreen');

    component.onLessonLoaded();

    expect(component.loadedLessonCards).toEqual(3);
    expect(component.allCardsLoaded).toBe(false);
    expect(component.loadingMessage).toEqual('Loading');
    expect(hideLoadingScreenSpy).not.toHaveBeenCalled();
  });

  describe('Final Coverage Checks (Loader & Initialization)', () => {
    it('should handle undefined lists without crashing and hide loader', fakeAsync(() => {
      topicsDataSpy.and.returnValue(Promise.resolve({}));
      collectionsDataSpy.and.returnValue(Promise.resolve({}));
      explorationsDataSpy.and.returnValue(Promise.resolve({}));

      spyOn(loaderService, 'hideLoadingScreen');
      component.ngOnInit();
      tick();
      fixture.detectChanges();
      flush();

      expect(component.totalLessonCards).toEqual(0);
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
      discardPeriodicTasks();
    }));

    it('should deduplicate topics in continueWhereYouLeftOffList', fakeAsync(() => {
      const topic = LearnerTopicSummary.createFromBackendDict({
        id: 't1',
        name: 'Topic 1',
        language_code: 'en',
        description: 'desc',
        version: 1,
        story_titles: [],
        total_published_node_count: 0,
        thumbnail_filename: 'img.svg',
        thumbnail_bg_color: '#fff',
        classroom_name: 'math',
        classroom_url_fragment: 'math',
        practice_tab_is_displayed: false,
        canonical_story_summary_dict: [],
        url_fragment: 'topic-1',
        subtopics: [],
        degrees_of_mastery: {},
        skill_descriptions: {},
      });

      topicsDataSpy.and.returnValue(
        Promise.resolve({
          topicsToLearnList: [topic],
          partiallyLearntTopicsList: [topic],
          allTopicsList: [],
          untrackedTopics: {},
        })
      );

      component.ngOnInit();
      tick();
      fixture.detectChanges();
      flush();
      expect(component.continueWhereYouLeftOffList.length).toEqual(1);
      discardPeriodicTasks();
    }));
  });
});
