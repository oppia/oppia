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
 * @fileoverview Unit tests for for CollectionSummaryTileComponent.
 */

import { async, ComponentFixture, fakeAsync, TestBed } from
  '@angular/core/testing';
import { MaterialModule } from 'components/material.module';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LearnerDashboardActivityBackendApiService } from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import { LearnerDashboardIdsBackendApiService } from 'domain/learner_dashboard/learner-dashboard-ids-backend-api.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import { GoalsTabComponent } from './goals-tab.component';
import { LearnerDashboardActivityIds } from 'domain/learner_dashboard/learner-dashboard-activity-ids.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';

class MockRemoveActivityNgbModalRef {
  componentInstance: {
    sectionNameI18nId: null,
    subsectionName: null,
    activityId: null,
    activityTitle: null
  };
}

describe('Goals tab Component', () => {
  let component: GoalsTabComponent;
  let fixture: ComponentFixture<GoalsTabComponent>;
  let learnerDashboardActivityBackendApiService:
    LearnerDashboardActivityBackendApiService;
  let learnerDashboardIdsBackendApiService:
    LearnerDashboardIdsBackendApiService;
  let ngbModal: NgbModal;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        GoalsTabComponent,
        MockTranslatePipe
      ],
      providers: [
        LearnerDashboardActivityBackendApiService,
        LearnerDashboardIdsBackendApiService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalsTabComponent);
    component = fixture.componentInstance;
    learnerDashboardActivityBackendApiService =
      TestBed.inject(LearnerDashboardActivityBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
    learnerDashboardIdsBackendApiService =
      TestBed.inject(LearnerDashboardIdsBackendApiService);
    let subtopic = {
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      url_fragment: 'subtopic-name'
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
      thumbnail_bg_color: '#a33f40'
    };
    const learnerTopicSummaryBackendDict1 = {
      id: 'sample_topic_id',
      name: 'Topic Name',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom: 'math',
      practice_tab_is_displayed: false,
      canonical_story_dicts: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 1'],
        url_fragment: 'story-title',
        all_node_dicts: [nodeDict]
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
    const learnerTopicSummaryBackendDict2 = {
      id: 'sample_topic_2',
      name: 'Topic Name 2',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom: 'math',
      practice_tab_is_displayed: false,
      canonical_story_dicts: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 1'],
        url_fragment: 'story-title',
        all_node_dicts: []
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
    const learnerTopicSummaryBackendDict3 = {
      id: 'sample_topic_3',
      name: 'Topic Name 3',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom: 'math',
      practice_tab_is_displayed: false,
      canonical_story_dicts: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 1'],
        url_fragment: 'story-title',
        all_node_dicts: [nodeDict]
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
    component.editGoals = [LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict1),
    LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict2),
    LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict3)];
    component.completedGoals = [LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict3)];
    component.learntToPartiallyLearntTopics = [];
    component.MAX_CURRENT_GOALS_LENGTH = 5;
    component.currentGoalsStoryIsShown = [];
    component.topicBelongToCurrentGoals = [];
    component.topicIdsInCompletedGoals = [];
    component.topicIdsInEditGoals = [];
    component.topicIdsInCurrentGoals = [];
    component.topicMapping = {
      'belongs to current goals': 0,
      'belongs to completed goals': 1,
      'belongs to neither': 2
    };
    component.activityType = 'learntopic';
    fixture.detectChanges();
  });

  it('should intialize the component and set values', fakeAsync(() => {
    let learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        new_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    const learnerDashboardSpy = spyOn(
      learnerDashboardIdsBackendApiService, 'fetchLearnerDashboardIdsAsync')
      .and.callFake(async() => {
        return Promise.resolve(learnerDashboardActivityIds);
      });

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.topicIdsInCompletedGoals)
      .toEqual(learnerDashboardActivityIds.learntTopicIds);
    expect(component.topicIdsInCurrentGoals)
      .toEqual(learnerDashboardActivityIds.topicIdsToLearn);
    expect(component.topicIdsInEditGoals)
      .toEqual(learnerDashboardActivityIds.allTopicIds);
    expect(learnerDashboardSpy).toHaveBeenCalled();
  }
  ));
  it('should check where the topicId belongs to current goal', fakeAsync(() => {
    component.topicIdsInCurrentGoals = ['1', '2', '3'];

    let topicBelongsTo = component.topicBelongsTo('1');
    fixture.detectChanges();

    expect(topicBelongsTo).toEqual(0);
  }
  ));

  it('should check where the topicId belongs to completed goal',
    fakeAsync(() => {
      component.topicIdsInCompletedGoals = ['1', '2', '3'];

      let topicBelongsTo = component.topicBelongsTo('1');
      fixture.detectChanges();

      expect(topicBelongsTo).toEqual(1);
    }
    ));

  it('should check if the topicName belongs to learntToPartiallyLearntTopics',
    fakeAsync(() => {
      component.learntToPartiallyLearntTopics = ['topic', 'topic2', 'topic3'];

      let topicBelongsTo = component.topicBelongToLearntToPartiallyLearntTopics(
        'topic');
      fixture.detectChanges();

      expect(topicBelongsTo).toEqual(true);
    }
    ));

  it('should toggle story', fakeAsync(() => {
    component.currentGoalsStoryIsShown = [true];

    component.toggleStory('0');
    fixture.detectChanges();

    expect(component.currentGoalsStoryIsShown[0]).toEqual(false);
  }
  ));

  it('should add topic to learner goals if not already present',
    fakeAsync(() => {
      component.topicIdsInCurrentGoals.length = 0;
      component.topicIdsInCompletedGoals = ['1', '2'];
      const learnerGoalsSpy = spyOn(
        learnerDashboardActivityBackendApiService, 'addToLearnerGoals')
        .and.returnValue(true);

      component.addToLearnerGoals(component.editGoals[0], '3', 1);
      fixture.detectChanges();

      expect(learnerGoalsSpy).toHaveBeenCalled();
    }));

  it('should remove topic from the learner goals', fakeAsync(() => {
    expect(learnerDashboardActivityBackendApiService.removeActivityModalStatus)
      .toBeUndefined;
    component.topicIdsInCurrentGoals = ['1', '2', '3'];

    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return <NgbModalRef>(
        { componentInstance: MockRemoveActivityNgbModalRef,
          result: Promise.resolve('success')
        });
    });

    component.removeFromLearnerGoals('2', 'topicName', 1);
    fixture.detectChanges();

    expect(modalSpy).toHaveBeenCalled();
  }));
});
