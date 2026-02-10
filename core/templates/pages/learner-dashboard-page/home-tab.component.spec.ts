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
} from '@angular/core/testing';
import {AppConstants} from 'app.constants';
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

describe('Home tab Component', () => {
  let component: HomeTabComponent;
  let fixture: ComponentFixture<HomeTabComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let windowDimensionsService: WindowDimensionsService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let mockResizeEmitter: EventEmitter<void>;
  let siteAnalyticsService: SiteAnalyticsService;
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
    component.currentGoals = [
      LearnerTopicSummary.createFromBackendDict(
        learnerTopicSummaryBackendDict1
      ),
    ];
    component.goalTopics = [
      LearnerTopicSummary.createFromBackendDict(
        learnerTopicSummaryBackendDict1
      ),
    ];
    component.partiallyLearntTopicsList = [
      LearnerTopicSummary.createFromBackendDict(
        learnerTopicSummaryBackendDict1
      ),
    ];
    component.untrackedTopics = {};
    component.username = 'username';
    fixture.detectChanges();
  });

  it('should get the correct width in mobile view', () => {
    component.ngOnInit();
    expect(component.width).toEqual(233);
    expect(component.windowIsNarrow).toBe(true);
  });

  it('should check whether window is narrow on resizing the screen', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    expect(component.windowIsNarrow).toBe(true);

    mockResizeEmitter.emit();

    expect(component.windowIsNarrow).toBe(false);
  });

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
    () => {
      component.currentGoalsLength = AppConstants.MAX_CURRENT_GOALS_COUNT;

      expect(component.isGoalLimitReached()).toBe(true);

      component.currentGoalsLength = 2;
      component.goalTopicsLength = 2;
      expect(component.isGoalLimitReached()).toBe(true);
    }
  );

  it(
    'should not show empty learn something new tab' +
      "'when goal selection limit is not reached'",
    () => {
      component.goalTopicsLength = 0;
      expect(component.isGoalLimitReached()).toBe(false);
    }
  );

  it(
    'should not show empty learn something new tab' +
      "'when goal selection limit is reached and goal selection limit" +
      " is not reached'",
    () => {
      component.goalTopicsLength = 2;
      component.currentGoalsLength = 0;
      component.goalTopicsLength = 3;
      expect(component.isGoalLimitReached()).toBe(false);
    }
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

  it('should get the correct number of stories that have available story nodes to recommend', () => {
    expect(component.storySummariesWithAvailableNodes).toEqual(new Set(['1']));
  });

  it('should get the correct number in-progress lessons (explorations, collections, and classrooms)', () => {
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
    component.incompleteCollectionsList = [
      CollectionSummary.createFromBackendDict(sampleCollection),
    ];
    component.incompleteExplorationsList = [
      LearnerExplorationSummary.createFromBackendDict(sampleExploration),
    ];

    fixture.detectChanges();
    expect(component.getTotalInProgressLessons()).toBe(4);
  });

  it('should get publishedNotesCount when isSerialChapterLearnerFeature is turned ON', () => {
    // Add an unpublished node to test the filtering behavior.
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

    component.partiallyLearntTopicsList = [
      LearnerTopicSummary.createFromBackendDict(learnerTopicSummaryBackendDict),
    ];

    mockPlatformFeatureService.status.SerialChapterLaunchLearnerView.isEnabled =
      true;

    // Re-initialize component to trigger ngOnInit with the feature flag ON.
    component.ngOnInit();

    expect(component.isSerialChapterFeatureLearnerFlagEnabled()).toBe(true);

    // Verify the story structure.
    const storySummaries =
      component.partiallyLearntTopicsList[0].getCanonicalStorySummaryDicts();
    const story = storySummaries[0];
    expect(story.getId()).toEqual('story_with_mixed_nodes');
    expect(story.getNodeTitles().length).toEqual(3);
    expect(story.getCompletedNodeTitles().length).toEqual(1);
    expect(story.getCompletedNodeTitles()).toContain('Completed Chapter');

    // Verify that getAllNodes returns all 3 nodes.
    const allNodes = story.getAllNodes();
    expect(allNodes.length).toEqual(3);

    // Verify filtering behavior: only 2 nodes should have Published status.
    const publishedNodeIds = allNodes
      .filter((node: {getPublishedStatus: () => boolean}) =>
        node.getPublishedStatus()
      )
      .map((node: {getId: () => string}) => node.getId());
    expect(publishedNodeIds.length).toEqual(2);
    expect(publishedNodeIds).toContain('completed_node');
    expect(publishedNodeIds).toContain('remaining_node');
    expect(publishedNodeIds).not.toContain('unpublished_node');

    expect(publishedNodeIds.length).toEqual(2);
    expect(publishedNodeIds).toContain('completed_node');
    expect(publishedNodeIds).toContain('remaining_node');
    expect(publishedNodeIds).not.toContain('unpublished_node');

    // Verify that the story is added to storySummariesWithAvailableNodes.
    // With the feature flag ON, only published nodes should be counted.
    // Story has 3 total nodes but only 2 published (completed and remaining).
    // With 1 completed and 2 published, remainingPublished = 2 - 1 - 1 = 0.
    // So this story should NOT be in storySummariesWithAvailableNodes.
    expect(
      component.storySummariesWithAvailableNodes.has('story_with_mixed_nodes')
    ).toBe(false);
  });

  it('should get publishedNotesCount when isSerialChapterLearnerFeature is turned OFF', () => {
    // Add an unpublished node to test the difference in behavior.
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

    component.partiallyLearntTopicsList = [
      LearnerTopicSummary.createFromBackendDict(learnerTopicSummaryBackendDict),
    ];

    mockPlatformFeatureService.status.SerialChapterLaunchLearnerView.isEnabled =
      false;

    // Re-initialize component to trigger ngOnInit with the feature flag OFF.
    component.ngOnInit();

    expect(component.isSerialChapterFeatureLearnerFlagEnabled()).toBe(false);

    // Verify the story structure.
    const storySummaries =
      component.partiallyLearntTopicsList[0].getCanonicalStorySummaryDicts();
    const story = storySummaries[0];
    expect(story.getId()).toEqual('story_with_mixed_nodes_2');
    expect(story.getNodeTitles().length).toEqual(3);
    expect(story.getCompletedNodeTitles().length).toEqual(1);
    expect(story.getCompletedNodeTitles()).toContain('Completed Chapter');

    // Verify that getAllNodes returns all 3 nodes.
    const allNodes = story.getAllNodes();
    expect(allNodes.length).toEqual(3);

    // Verify that even though there are published and unpublished nodes,
    // when the flag is OFF, all nodes are counted.
    const publishedNodes = allNodes.filter(
      (node: {getPublishedStatus: () => boolean}) => node.getPublishedStatus()
    );
    expect(publishedNodes.length).toEqual(2);

    // With the feature flag OFF, ALL nodes should be counted (including unpublished).
    // Story has 3 total nodes (all counted when flag is OFF).
    // With 1 completed and 3 total, remainingPublished = 3 - 1 - 1 = 1.
    // Since remainingPublished (1) > 0 and < publishedNodesCount (3),
    // this story SHOULD be in storySummariesWithAvailableNodes.
    expect(
      component.storySummariesWithAvailableNodes.has('story_with_mixed_nodes_2')
    ).toBe(true);
  });
});

describe('Home tab Component Loader visibility tests', () => {
  let component: HomeTabComponent;
  let fixture: ComponentFixture<HomeTabComponent>;
  let i18nLanguageCodeService: I18nLanguageCodeService;
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
    TestBed.configureTestingModule({
      imports: [MaterialModule, FormsModule, HttpClientTestingModule],
      declarations: [MockTranslatePipe, HomeTabComponent],
      providers: [
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

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
  });

  it('should set allCardsLoaded to true immediately when totalLessonCards is 0', () => {
    component.currentGoals = [];
    component.goalTopics = [];
    component.incompleteExplorationsList = [];
    component.incompleteCollectionsList = [];
    component.partiallyLearntTopicsList = [];
    component.totalLessonsInPlaylists = [];
    component.untrackedTopics = {};
    component.username = 'testuser';
    component.allCardsLoaded = false;
    component.loadingMessage = 'Loading';
    const hideLoadingScreenSpy = spyOn(loaderService, 'hideLoadingScreen');

    component.ngOnInit();

    expect(component.totalLessonCards).toEqual(0);
    expect(component.allCardsLoaded).toBe(true);
    expect(component.loadingMessage).toEqual('');
    expect(hideLoadingScreenSpy).toHaveBeenCalled();
  });

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
    };

    component.currentGoals = [];
    component.goalTopics = [];
    component.incompleteExplorationsList = [
      LearnerExplorationSummary.createFromBackendDict(sampleExploration),
    ];
    component.incompleteCollectionsList = [];
    component.partiallyLearntTopicsList = [];
    component.totalLessonsInPlaylists = [];
    component.untrackedTopics = {};
    component.username = 'testuser';
    component.allCardsLoaded = false;
    const hideLoadingScreenSpy = spyOn(loaderService, 'hideLoadingScreen');

    component.ngOnInit();

    expect(component.allCardsLoaded).toBe(false);
    expect(component.totalLessonCards).toBeGreaterThan(0);
    tick(10100);
    expect(component.allCardsLoaded).toBe(true);
    expect(component.loadingMessage).toEqual('');
    expect(hideLoadingScreenSpy).toHaveBeenCalled();
  }));

  it('should not call hideLoadingScreen in timeout if cards are already loaded', fakeAsync(() => {
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
    };

    component.currentGoals = [];
    component.goalTopics = [];
    component.incompleteExplorationsList = [
      LearnerExplorationSummary.createFromBackendDict(sampleExploration),
    ];
    component.incompleteCollectionsList = [];
    component.partiallyLearntTopicsList = [];
    component.totalLessonsInPlaylists = [];
    component.untrackedTopics = {};
    component.username = 'testuser';
    const hideLoadingScreenSpy = spyOn(loaderService, 'hideLoadingScreen');

    component.ngOnInit();

    component.allCardsLoaded = true;
    const callCountBeforeTimeout = hideLoadingScreenSpy.calls.count();
    tick(10100);
    expect(hideLoadingScreenSpy.calls.count()).toEqual(callCountBeforeTimeout);
  }));

  it('should increment loadedLessonCards and hide loading screen when all lessons are loaded', () => {
    component.loadedLessonCards = 4;
    component.totalLessonCards = 5;
    component.allCardsLoaded = false;
    component.loadingMessage = 'Loading';
    const hideLoadingScreenSpy = spyOn(loaderService, 'hideLoadingScreen');

    component.onLessonLoaded();

    expect(component.loadedLessonCards).toEqual(5);
    expect(component.allCardsLoaded).toBe(true);
    expect(component.loadingMessage).toEqual('');
    expect(hideLoadingScreenSpy).toHaveBeenCalled();
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
});
