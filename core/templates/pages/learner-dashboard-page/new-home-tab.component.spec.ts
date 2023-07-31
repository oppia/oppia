// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for for NewHomeTabComponent.
 */

import { async, ComponentFixture, fakeAsync, TestBed, tick } from
  '@angular/core/testing';
import { MaterialModule } from 'modules/material.module';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { LearnerDashboardActivityBackendApiService } from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { CollectionSummary } from 'domain/collection/collection-summary.model';
import { StorySummary } from 'domain/story/story-summary.model';
import { NewHomeTabComponent } from './new-home-tab.component';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ChapterProgressSummary } from 'domain/exploration/chapter-progress-summary.model';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

class MockRemoveActivityNgbModalRef {
  componentInstance = {
    sectionNameI18nId: null,
    subsectionName: null,
    activityId: null,
    activityTitle: null
  };
}

describe('New Home tab Component', () => {
  let component: NewHomeTabComponent;
  let fixture: ComponentFixture<NewHomeTabComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let windowDimensionsService: WindowDimensionsService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let learnerDashboardActivityBackendApiService:
  LearnerDashboardActivityBackendApiService;
  let ngbModal: NgbModal;
  let readOnlyExplorationBackendApiService:
  ReadOnlyExplorationBackendApiService;
  let mockResizeEmitter: EventEmitter<void>;

  interface storySummaryTile {
    topicName: string;
    storySummary: StorySummary;
    markTileAsGoal: boolean;
    learnerGroupTitle: string;
  }

  beforeEach(async(() => {
    mockResizeEmitter = new EventEmitter();
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        MockTranslatePipe,
        NewHomeTabComponent
      ],
      providers: [
        LearnerDashboardActivityBackendApiService,
        UrlInterpolationService,
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => mockResizeEmitter,
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewHomeTabComponent);
    component = fixture.componentInstance;
    readOnlyExplorationBackendApiService =
    TestBed.inject(ReadOnlyExplorationBackendApiService);
    learnerDashboardActivityBackendApiService =
      TestBed.inject(LearnerDashboardActivityBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
    let subtopic = {
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      url_fragment: 'subtopic-name'
    };

    let nodeDict1 = {
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
      unpublishing_reason: null
    };
    let nodeDict2 = {
      id: 'node_2',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_3'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null
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
      classroom: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 1'],
        url_fragment: 'story-title',
        all_node_dicts: [nodeDict1]
      },
      {
        id: '1',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: [],
        url_fragment: 'story-title',
        all_node_dicts: [nodeDict2]
      }],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2'
      }
    };
    component.currentGoals = [LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict1)];
    component.goalTopics = [LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict1)];
    component.partiallyLearntTopicsList = [];
    component.storyInProgress = [];
    component.storyInRecommended = [];
    component.incompleteExplorationsList = [];
    component.explorationPlaylist = [];
    component.collectionPlaylist = [];
    component.completedExplorationsList = [];
    component.untrackedTopics = {};
    component.storyIdToLearnerGroupsTitleMap = new Map([
      ['0', ['learner Group Title']]]);
    component.username = 'username';
    fixture.detectChanges();
  });

  it('should get the correct width in mobile view', () => {
    expect(component.storyInProgress.length).toBe(1);
  });

  it('should check the completed ExpIds', () => {
    const completed = {
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
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let completedSummary = LearnerExplorationSummary.createFromBackendDict(
      completed);
    component.completedExplorationsList = [completedSummary];
    const completedExpIds = ['44LKoKLlIbGe'];
    component.ngOnInit();
    expect(component.completedExpIds).toEqual(completedExpIds);
  });
  it('should check total explortion Ids', () => {
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
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let expSummary = LearnerExplorationSummary.createFromBackendDict(
      exp1);
    component.explorationPlaylist = [expSummary];
    component.ngOnInit();
    expect(component.totalExploration).toEqual([expSummary]);
  });
  it('should intialize', fakeAsync(() => {
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
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };
    let expSummary = LearnerExplorationSummary.createFromBackendDict(
      exp1);
    component.totalExploration = [expSummary];
    const explorationProgressSummaryDict = {
      total_checkpoints_count: 6,
      visited_checkpoints_count: 4
    };
    const explorationProgress = ChapterProgressSummary.createFromBackendDict(
      explorationProgressSummaryDict);
    const expIds = ['44LKoKLlIbGe'];
    const explorationOrChapterProgress = [explorationProgress];
    spyOn(component, 'calculateExplorationProgress');
    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchProgressInExplorationsOrChapters')
      .and.returnValue(Promise.resolve([explorationProgress]));

    component.ngOnInit();
    tick(100);
    expect(
      readOnlyExplorationBackendApiService.
        fetchProgressInExplorationsOrChapters).toHaveBeenCalled();
    expect(component.calculateExplorationProgress).toHaveBeenCalledWith(
      explorationOrChapterProgress[0], expIds[0]
    );
    expect(component.explorationToProgressMap.size).toBe(1);
  }));

  it('should check whether window is narrow on resizing the screen', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    expect(component.windowIsNarrow).toBeTrue();

    mockResizeEmitter.emit();

    expect(component.windowIsNarrow).toBeFalse();
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
      node_count: 0
    };
    let collectionSummary = CollectionSummary.createFromBackendDict(
      collection);

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
        5: 0
      },
      status: 'public',
      tags: [],
      activity_type: 'exploration',
      category: 'Algebra',
      title: 'Test Title'
    };

    let explorationSummary = LearnerExplorationSummary.createFromBackendDict(
      exploration);

    const storySummary = StorySummary.createFromBackendDict({
      id: 'storyId',
      title: 'Story Title',
      node_titles: ['node1', 'node2', 'node3'],
      thumbnail_filename: 'thumbnail.jpg',
      thumbnail_bg_color: '#FF9933',
      description: 'This is the story description',
      story_is_published: true,
      completed_node_titles: ['node1'],
      url_fragment: 'story1',
      all_node_dicts: [],
      topic_name: 'topic',
      topic_url_fragment: 'topic',
      classroom_url_fragment: 'math',
    });

    const storyData: storySummaryTile = {
      topicName: 'Addition',
      storySummary: storySummary,
      markTileAsGoal: true,
      learnerGroupTitle: 'learner Group Title'
    };

    let result = component.getTileType(explorationSummary);
    expect(result).toEqual('exploration');

    result = component.getTileType(collectionSummary);
    expect(result).toEqual('collection');

    result = component.getTileType(storyData);
    expect(result).toEqual('story');
  });

  it('should calculate exploration progress', fakeAsync(() => {
    component.completedExpIds = ['44LKoKLlIbGe'];
    const expIds = ['44LKoKLlIbGe', '55LKoKLlIbGe'];
    const explorationProgressSummaryDict1 = {
      total_checkpoints_count: 6,
      visited_checkpoints_count: 3
    };
    const explorationProgressSummaryDict2 = {
      total_checkpoints_count: 1,
      visited_checkpoints_count: 1
    };
    const explorationProgress1 = ChapterProgressSummary.createFromBackendDict(
      explorationProgressSummaryDict1);
    const explorationProgress2 = ChapterProgressSummary.createFromBackendDict(
      explorationProgressSummaryDict2);
    const explorationOrChaptersProgress =
    [explorationProgress1, explorationProgress2];
    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchProgressInExplorationsOrChapters')
      .and.returnValue(Promise.resolve(explorationOrChaptersProgress));
    component.ngOnInit();
    tick();
    let expProgress = component.calculateExplorationProgress(
      explorationOrChaptersProgress[0], expIds[0]);
    expect(expProgress).toBe(100);
    expProgress = component.calculateExplorationProgress(
      explorationOrChaptersProgress[1], expIds[1]);
    expect(expProgress).toBe(0);
    expProgress = component.calculateExplorationProgress(
      explorationOrChaptersProgress[0], expIds[1]);
    expect(expProgress).toBe(50);
  }));

  it('should check whether an object is non empty when calling ' +
    '\'isNonemptyObject\'', () => {
    let result = component.isNonemptyObject({});
    expect(result).toBe(false);

    result = component.isNonemptyObject({description: 'description'});
    expect(result).toBe(true);
  });

  it('should get the classroom link', () => {
    component.classroomUrlFragment = 'math';
    const urlSpy = spyOn(
      urlInterpolationService, 'interpolateUrl')
      .and.returnValue('/learn/math');
    expect(component.getClassroomLink('math')).toEqual(
      '/learn/math');
    expect(urlSpy).toHaveBeenCalled();
  });

  it('should open a modal to remove an exploration from playlist',
    fakeAsync(() => {
      spyOnProperty(navigator, 'userAgent').and.returnValue('iPhone');
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus)
        .toBeUndefined;

      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
          { componentInstance: MockRemoveActivityNgbModalRef,
            result: Promise.resolve('success')
          }) as NgbModalRef;
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
          5: 0
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      };
      let summary1 = LearnerExplorationSummary.createFromBackendDict(
        exp1);
      component.explorationPlaylist = [summary1];
      component.totalLessonsInPlaylist = [summary1];
      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';

      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, summary1);
      fixture.detectChanges();

      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should open a modal to remove a collection from playlist',
    fakeAsync(() => {
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus)
        .toBeUndefined;

      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
          { componentInstance: MockRemoveActivityNgbModalRef,
            result: Promise.resolve('success')
          }) as NgbModalRef;
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
        node_count: 0
      };
      let collectionSummary = CollectionSummary.createFromBackendDict(
        collection);
      component.collectionPlaylist = [collectionSummary];
      component.totalLessonsInPlaylist = [collectionSummary];
      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';

      component.openRemoveActivityModal(
        sectionNameI18nId, subsectionName, collectionSummary);
      fixture.detectChanges();

      expect(modalSpy).toHaveBeenCalled();
    }));
});
