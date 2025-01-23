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
 * @fileoverview Unit tests for for ProgressTabComponent.
 */

import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
} from '@angular/core/testing';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {LearnerDashboardActivityBackendApiService} from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {ProgressTabComponent} from './progress-tab.component';
import {EventEmitter, NO_ERRORS_SCHEMA, Pipe} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {UserService} from 'services/user.service';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
class MockRemoveActivityNgbModalRef {
  componentInstance = {
    sectionNameI18nId: null,
    subsectionName: null,
    activityId: null,
    activityTitle: null,
  };
}

@Pipe({name: 'truncate'})
class MockTruncatePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

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

describe('Progress Tab Component', () => {
  let component: ProgressTabComponent;
  let fixture: ComponentFixture<ProgressTabComponent>;
  let learnerDashboardActivityBackendApiService: LearnerDashboardActivityBackendApiService;
  let ngbModal: NgbModal;
  let windowDimensionsService: WindowDimensionsService;
  let mockResizeEmitter: EventEmitter<void>;
  let userService: UserService;
  let explorationSummary: LearnerExplorationSummary;

  let subtopic = {
    skill_ids: ['skill_id_2'],
    id: 1,
    title: 'subtopic_name',
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    url_fragment: 'subtopic-name',
  };

  let nodeDict1 = {
    id: 'node_1',
    thumbnail_filename: 'image1.png',
    title: 'Chapter 1',
    description: 'Description 1',
    prerequisite_skill_ids: ['skill_id_1'],
    acquired_skill_ids: ['skill_id_2'],
    destination_node_ids: ['node_2'],
    outline: 'Outline',
    exploration_id: 'exp_1',
    outline_is_finalized: false,
    thumbnail_bg_color: '#a33f40',
    status: 'Published',
    planned_publication_date_msecs: 100.0,
    last_modified_msecs: 100.0,
    first_publication_date_msecs: 200.0,
    unpublishing_reason: null,
  };
  let nodeDict2 = {
    id: 'node_2',
    thumbnail_filename: 'image2.png',
    title: 'Chapter 2',
    description: 'Description 1',
    prerequisite_skill_ids: ['skill_id_1'],
    acquired_skill_ids: ['skill_id_2'],
    destination_node_ids: ['node_3'],
    outline: 'Outline',
    exploration_id: 'exp_2',
    outline_is_finalized: false,
    thumbnail_bg_color: '#a33f40',
    status: 'Published',
    planned_publication_date_msecs: 100.0,
    last_modified_msecs: 100.0,
    first_publication_date_msecs: 200.0,
    unpublishing_reason: null,
  };
  const learntTopicSummaryDict = {
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
        node_titles: ['Chapter 1', 'Chapter 2'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 2'],
        all_node_dicts: [nodeDict1, nodeDict2],
        url_fragment: 'story-title',
        topic_name: 'Topic Name',
        classroom_url_fragment: 'math',
        topic_url_fragment: 'topic-name',
      },
    ],
    url_fragment: 'topic-name',
    subtopics: [subtopic],
    degrees_of_mastery: {
      skill_id_1: 1,
      skill_id_2: 1,
    },
    skill_descriptions: {
      skill_id_1: 'Skill Description 1',
      skill_id_2: 'Skill Description 2',
    },
  };

  let newSubtopic = {
    skill_ids: ['skill_id_3'],
    id: 1,
    title: 'subtopic_name',
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    url_fragment: 'subtopic-name',
  };

  let newNodeDict = {
    id: 'node_1',
    thumbnail_filename: 'image1.png',
    title: 'Chapter 1',
    description: 'Description 1',
    prerequisite_skill_ids: ['skill_id_3'],
    acquired_skill_ids: ['skill_id_4'],
    destination_node_ids: [''],
    outline: 'Outline',
    exploration_id: 'exp_1',
    outline_is_finalized: false,
    thumbnail_bg_color: '#a33f40',
    status: 'Published',
    planned_publication_date_msecs: 100.0,
    last_modified_msecs: 100.0,
    first_publication_date_msecs: 200.0,
    unpublishing_reason: null,
  };

  const newTopicSummaryDict = {
    id: 'new_sample_topic_id',
    name: 'New Topic Name',
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
        completed_node_titles: [''],
        all_node_dicts: [newNodeDict],
        url_fragment: 'new-story-title',
        topic_name: 'New Topic Name',
        classroom_url_fragment: 'math',
        topic_url_fragment: 'new-topic-name',
      },
    ],
    url_fragment: 'new-topic-name',
    subtopics: [newSubtopic],
    degrees_of_mastery: {
      skill_id_3: 0,
    },
    skill_descriptions: {
      skill_id_3: 'Skill Description 3',
    },
  };

  const multipleTopicsSummaryDict = {
    id: 'new_sample_topic_id',
    name: 'New Topic Name',
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
        completed_node_titles: [''],
        all_node_dicts: [newNodeDict],
        url_fragment: 'new-story-title',
        topic_name: 'New Topic Name',
        classroom_url_fragment: 'math',
        topic_url_fragment: 'new-topic-name',
      },
    ],
    url_fragment: 'new-topic-name',
    subtopics: [newSubtopic, subtopic],
    degrees_of_mastery: {
      skill_id_2: 0,
      skill_id_3: 0.75,
    },
    skill_descriptions: {
      skill_id_2: 'Skill Description 2',
      skill_id_3: 'Skill Description 3',
    },
  };

  beforeEach(async(() => {
    mockResizeEmitter = new EventEmitter();
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      declarations: [ProgressTabComponent, MockTranslatePipe, MockTruncatePipe],
      providers: [
        LearnerDashboardActivityBackendApiService,
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => mockResizeEmitter,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressTabComponent);
    component = fixture.componentInstance;
    learnerDashboardActivityBackendApiService = TestBed.inject(
      LearnerDashboardActivityBackendApiService
    );
    ngbModal = TestBed.inject(NgbModal);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    userService = TestBed.inject(UserService);
    component.incompleteExplorationsList = [];
    component.incompleteCollectionsList = [];
    component.completedExplorationsList = [];
    component.completedCollectionsList = [];
    component.explorationPlaylist = [];
    component.collectionPlaylist = [];
    component.subscriptionsList = [];
    component.completedToIncompleteCollections = [];
    component.totalCompletedLessonsList = [];
    component.totalIncompleteLessonsList = [];
    component.currentGoals = [];
    explorationSummary =
      LearnerExplorationSummary.createFromBackendDict(sampleExploration);
    component.partialTopicMastery = [];
    component.learntTopicMastery = [];
    component.partiallyLearntTopicsList = [
      LearnerTopicSummary.createFromBackendDict(newTopicSummaryDict),
    ];
    component.learntTopicsList = [
      LearnerTopicSummary.createFromBackendDict(learntTopicSummaryDict),
    ];

    component.subtopicMasteries = {
      new_sample_topic_id: {},
      sample_topic_id: {1: 1},
    };

    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      'default-image-url-png',
      'default-image-url-webp',
    ]);

    fixture.detectChanges();
  });

  it('should initilize values on init for web view', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);

    component.ngOnInit();

    expect(component.windowIsNarrow).toBeFalse();
    expect(component.noCommunityLessonActivity).toEqual(true);
    expect(component.noPlaylistActivity).toEqual(true);
    expect(component.totalIncompleteLessonsList).toEqual([]);
    expect(component.totalCompletedLessonsList).toEqual([]);
    expect(component.totalLessonsInPlaylist).toEqual([]);
    expect(component.allCommunityLessons).toEqual([]);
    expect(component.displayIncompleteLessonsList).toEqual([]);
    expect(component.displayCompletedLessonsList).toEqual([]);
    expect(component.displayLessonsInPlaylist).toEqual([]);
    expect(component.displayInCommunityLessons).toEqual([]);
    expect(component.selectedSection).toEqual('All');
    expect(component.dropdownEnabled).toEqual(false);
  });

  it('should check whether window is narrow on resizing the screen', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    expect(component.displayLessonsInPlaylist).toEqual([]);
    expect(component.windowIsNarrow).toBeTrue();

    mockResizeEmitter.emit();

    expect(component.windowIsNarrow).toBeFalse();
    expect(component.displayLessonsInPlaylist).toEqual([]);
  });

  it('should initilize values on init for mobile view', () => {
    component.ngOnInit();

    expect(component.displayLessonsInPlaylist).toEqual([]);
  });

  it('should sanitize given png base64 data and generate url', () => {
    let result = component.decodePngURIData('%D1%88%D0%B5%D0%BB%D0%BB%D1%8B');

    fixture.detectChanges();

    expect(result).toBe('шеллы');
  });

  it('should enable the dropdown', () => {
    expect(component.dropdownEnabled).toEqual(false);
    component.toggleDropdown();
    expect(component.dropdownEnabled).toEqual(true);
  });

  it('should change sections', () => {
    component.dropdownEnabled = true;
    component.changeSection('Completed');
    expect(component.dropdownEnabled).toEqual(false);
    expect(component.selectedSection).toEqual('Completed');

    component.changeSection('Incomplete');
    expect(component.selectedSection).toEqual('Incomplete');

    component.changeSection('All');
    expect(component.selectedSection).toEqual('All');
  });

  it('should return the correct lesson type', () => {
    const incomplete = {
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
    let incompleteSummary =
      LearnerExplorationSummary.createFromBackendDict(incomplete);
    component.totalIncompleteLessonsList = [incompleteSummary];
    let result = component.getLessonType(incompleteSummary);
    expect(result).toEqual('Incomplete');

    const completed = {
      last_updated_msec: 1591296735670.528,
      community_owned: false,
      objective: 'Test Objective 1',
      id: '44LKoKLoobGe',
      num_views: 1,
      thumbnail_icon_url: '/subjects/image.svg',
      human_readable_contributors_summary: {},
      language_code: 'en',
      thumbnail_bg_color: '#cd622b',
      created_on_msec: 1591296225736.666,
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
      category: 'Art',
      title: 'Test Title 1',
    };
    let completedSummary =
      LearnerExplorationSummary.createFromBackendDict(completed);
    component.totalCompletedLessonsList = [completedSummary];
    result = component.getLessonType(completedSummary);
    expect(result).toEqual('Completed');
  });

  it('should get user profile image png data url correctly', () => {
    expect(component.getProfileImagePngDataUrl('username')).toBe(
      'default-image-url-png'
    );
  });

  it('should get user profile image webp data url correctly', () => {
    expect(component.getProfileImageWebpDataUrl('username')).toBe(
      'default-image-url-webp'
    );
  });

  it('should show username popover based on its length', () => {
    expect(component.showUsernamePopover('abcdefghijk')).toBe('mouseenter');
    expect(component.showUsernamePopover('abc')).toBe('none');
  });

  it('should handle show more button', () => {
    expect(component.showMoreInSection.incomplete).toEqual(false);
    const exp1 = {
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
    let summary1 = LearnerExplorationSummary.createFromBackendDict(exp1);
    const exp2 = {
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
    let summary2 = LearnerExplorationSummary.createFromBackendDict(exp2);
    const exp3 = {
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
    let summary3 = LearnerExplorationSummary.createFromBackendDict(exp3);
    const exp4 = {
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
    let summary4 = LearnerExplorationSummary.createFromBackendDict(exp4);

    component.totalIncompleteLessonsList = [
      summary1,
      summary2,
      summary3,
      summary4,
    ];
    component.handleShowMore('incomplete');
    expect(component.showMoreInSection.incomplete).toEqual(true);
    expect(component.displayIncompleteLessonsList).toEqual(
      component.totalIncompleteLessonsList
    );

    component.showMoreInSection.incomplete = true;
    component.handleShowMore('incomplete');
    expect(component.showMoreInSection.incomplete).toEqual(false);
    expect(component.displayIncompleteLessonsList).toEqual(
      component.totalIncompleteLessonsList.slice(0, 3)
    );

    component.totalCompletedLessonsList = [
      summary1,
      summary2,
      summary3,
      summary4,
    ];
    component.totalIncompleteLessonsList = [];
    component.handleShowMore('completed');
    expect(component.showMoreInSection.completed).toEqual(true);
    expect(component.displayCompletedLessonsList).toEqual(
      component.totalCompletedLessonsList
    );

    component.showMoreInSection.completed = true;
    component.handleShowMore('completed');
    expect(component.showMoreInSection.completed).toEqual(false);
    expect(component.displayCompletedLessonsList).toEqual(
      component.totalCompletedLessonsList.slice(0, 3)
    );

    component.totalLessonsInPlaylist = [summary1, summary2, summary3, summary4];
    component.totalCompletedLessonsList = [];
    component.handleShowMore('playlist');
    expect(component.showMoreInSection.playlist).toEqual(true);
    expect(component.displayLessonsInPlaylist).toEqual(
      component.totalLessonsInPlaylist
    );

    component.showMoreInSection.playlist = true;
    component.handleShowMore('playlist');
    expect(component.showMoreInSection.playlist).toEqual(false);
    expect(component.startIndexInPlaylist).toEqual(0);
    expect(component.endIndexInPlaylist).toEqual(3);
  });

  it('should get the correct tile type', () => {
    const collection = {
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
    let collectionSummary = CollectionSummary.createFromBackendDict(collection);

    const exploration = {
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
    let explorationSummary =
      LearnerExplorationSummary.createFromBackendDict(exploration);

    let result = component.getTileType(explorationSummary);
    expect(result).toEqual('exploration');

    result = component.getTileType(collectionSummary);
    expect(result).toEqual('collection');
  });

  it('should change page by one', () => {
    const exp1 = {
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
    let summary1 = LearnerExplorationSummary.createFromBackendDict(exp1);
    const exp2 = {
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
    let summary2 = LearnerExplorationSummary.createFromBackendDict(exp2);
    const exp3 = {
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
    let summary3 = LearnerExplorationSummary.createFromBackendDict(exp3);
    const exp4 = {
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
    let summary4 = LearnerExplorationSummary.createFromBackendDict(exp4);
    component.displayInCommunityLessons = [
      summary1,
      summary2,
      summary3,
      summary4,
    ];
    component.changePageByOne('MOVE_TO_NEXT_PAGE', 'communityLessons');
    expect(component.pageNumberInCommunityLessons).toEqual(2);

    component.pageNumberInCommunityLessons = 2;
    component.changePageByOne('MOVE_TO_PREV_PAGE', 'communityLessons');
    expect(component.pageNumberInCommunityLessons).toEqual(1);

    component.displayInCommunityLessons = [];
    component.displayLessonsInPlaylist = [
      summary1,
      summary2,
      summary3,
      summary4,
    ];
    component.changePageByOne('MOVE_TO_NEXT_PAGE', 'playlist');
    expect(component.pageNumberInPlaylist).toEqual(2);

    component.pageNumberInPlaylist = 2;
    component.changePageByOne('MOVE_TO_PREV_PAGE', 'playlist');
    expect(component.pageNumberInPlaylist).toEqual(1);
  });

  it('should open a modal to remove an exploration from playlist', fakeAsync(() => {
    spyOnProperty(navigator, 'userAgent').and.returnValue('iPhone');
    expect(learnerDashboardActivityBackendApiService.removeActivityModalStatus)
      .toBeUndefined;

    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockRemoveActivityNgbModalRef,
        result: Promise.resolve('success'),
      } as NgbModalRef;
    });
    const exp1 = {
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
    let summary1 = LearnerExplorationSummary.createFromBackendDict(exp1);
    component.explorationPlaylist = [summary1];
    component.totalLessonsInPlaylist = [summary1];
    let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
    let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';

    component.openRemoveActivityModal(
      sectionNameI18nId,
      subsectionName,
      summary1
    );
    fixture.detectChanges();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should open a modal to remove a collection from playlist', fakeAsync(() => {
    expect(learnerDashboardActivityBackendApiService.removeActivityModalStatus)
      .toBeUndefined;

    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockRemoveActivityNgbModalRef,
        result: Promise.resolve('success'),
      } as NgbModalRef;
    });

    const collection = {
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
    let collectionSummary = CollectionSummary.createFromBackendDict(collection);
    component.collectionPlaylist = [collectionSummary];
    component.totalLessonsInPlaylist = [collectionSummary];
    component.showMoreInSection.playlist = true;
    let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
    let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';

    component.openRemoveActivityModal(
      sectionNameI18nId,
      subsectionName,
      collectionSummary
    );
    fixture.detectChanges();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should open a modal to remove an exploration from incomplete list', fakeAsync(() => {
    expect(learnerDashboardActivityBackendApiService.removeActivityModalStatus)
      .toBeUndefined;

    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockRemoveActivityNgbModalRef,
        result: Promise.resolve('success'),
      } as NgbModalRef;
    });
    const exp1 = {
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
    let summary1 = LearnerExplorationSummary.createFromBackendDict(exp1);
    component.incompleteExplorationsList = [summary1];
    component.totalIncompleteLessonsList = [summary1];
    let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
    let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';

    component.openRemoveActivityModal(
      sectionNameI18nId,
      subsectionName,
      summary1
    );
    fixture.detectChanges();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should open a modal to remove a collection from incomplete list', fakeAsync(() => {
    expect(learnerDashboardActivityBackendApiService.removeActivityModalStatus)
      .toBeUndefined;

    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockRemoveActivityNgbModalRef,
        result: Promise.resolve('success'),
      } as NgbModalRef;
    });

    const collection = {
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
    let collectionSummary = CollectionSummary.createFromBackendDict(collection);
    component.incompleteCollectionsList = [collectionSummary];
    component.totalIncompleteLessonsList = [collectionSummary];
    component.showMoreInSection.incomplete = true;
    let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
    let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';

    component.openRemoveActivityModal(
      sectionNameI18nId,
      subsectionName,
      collectionSummary
    );
    fixture.detectChanges();

    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should return true when there are no lessons', () => {
    component.partiallyLearntTopicsList = [];
    component.learntTopicsList = [];

    fixture.detectChanges();

    expect(component.isLearnerStateEmpty()).toBeTrue();
  });

  it('should return false when there are in-progress lessons', () => {
    component.totalIncompleteLessonsList = [explorationSummary];
    fixture.detectChanges();

    expect(component.isLearnerStateEmpty()).toBeFalse();
  });

  it('should return false when there are completed lessons', () => {
    component.totalCompletedLessonsList = [explorationSummary];
    fixture.detectChanges();

    expect(component.isLearnerStateEmpty()).toBeFalse();
  });

  it('should return false when there are completed and in-progress lessons', () => {
    component.totalCompletedLessonsList = [explorationSummary];
    component.totalIncompleteLessonsList = [explorationSummary];
    fixture.detectChanges();

    expect(component.isLearnerStateEmpty()).toBeFalse();
  });

  it('should return false when there are in-progress skills', () => {
    component.totalCompletedLessonsList = [];
    component.totalIncompleteLessonsList = [];
    fixture.detectChanges();

    expect(component.isLearnerStateEmpty()).toBeFalse();
  });

  it('should return false when there are completed skills', () => {
    component.totalCompletedLessonsList = [];
    component.totalIncompleteLessonsList = [];
    component.partiallyLearntTopicsList = [];
    fixture.detectChanges();

    expect(component.isLearnerStateEmpty()).toBeFalse();
  });

  it("should correctly set a topic and its subtopics' masteries on ngOnInit", () => {
    fixture.detectChanges();

    expect(component.partialTopicMastery).toEqual([
      {topic: component.partiallyLearntTopicsList[0], progress: [0]},
    ]);
    expect(component.learntTopicMastery).toEqual([
      {topic: component.learntTopicsList[0], progress: [100]},
    ]);
  });

  it('should correctly get total number of skills', () => {
    const multipleTopics = LearnerTopicSummary.createFromBackendDict(
      multipleTopicsSummaryDict
    );
    const allSkills = [
      {topic: multipleTopics, progress: [0, 0.75]},
      {topic: multipleTopics, progress: [0, 0.75]},
    ];

    expect(allSkills.reduce(component.getTotalSkillCards, 0)).toBe(4);
  });
});
