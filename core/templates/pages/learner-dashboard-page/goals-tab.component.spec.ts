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
 * @fileoverview Unit tests for for GoalsTabComponent.
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
import {LearnerDashboardIdsBackendApiService} from 'domain/learner_dashboard/learner-dashboard-ids-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {GoalsTabComponent} from './goals-tab.component';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {AddGoalsModalComponent} from './add-goals-modal/add-goals-modal.component';
import {By} from '@angular/platform-browser';
import {of} from 'rxjs';

class MockRemoveActivityNgbModalRef {
  componentInstance = {
    sectionNameI18nId: null,
    subsectionName: null,
    activityId: null,
    activityTitle: null,
  };
}

describe('Goals tab Component', () => {
  let component: GoalsTabComponent;
  let fixture: ComponentFixture<GoalsTabComponent>;
  let learnerDashboardActivityBackendApiService: LearnerDashboardActivityBackendApiService;
  let urlInterpolationService: UrlInterpolationService;
  let ngbModal: NgbModal;
  let windowDimensionsService: WindowDimensionsService;
  let mockResizeEmitter: EventEmitter<void>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;
  let matDialogRefSpy: jasmine.SpyObj<MatDialogRef<AddGoalsModalComponent>>;
  let allTopics: {[key: string]: string} = {
    sample_topic_id: 'Topic Name',
    sample_topic_2: 'Topic Name 2',
    sample_topic_3: 'Topic Name 3',
  };
  let sampleTopic: LearnerTopicSummary;

  beforeEach(async(() => {
    mockResizeEmitter = new EventEmitter();
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', [
      'close',
      'afterClosed',
    ]);
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        MaterialModule,
        FormsModule,
        HttpClientTestingModule,
      ],
      declarations: [
        AddGoalsModalComponent,
        GoalsTabComponent,
        MockTranslatePipe,
      ],
      providers: [
        LearnerDashboardActivityBackendApiService,
        LearnerDashboardIdsBackendApiService,
        UrlInterpolationService,
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => mockResizeEmitter,
          },
        },
        {provide: MatDialog, useValue: matDialogSpy},
        {provide: MatDialogRef, useValue: matDialogRefSpy},
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            topics: allTopics,
            checkedTopics: new Set(),
            completedTopics: new Set(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalsTabComponent);
    component = fixture.componentInstance;
    learnerDashboardActivityBackendApiService = TestBed.inject(
      LearnerDashboardActivityBackendApiService
    );
    ngbModal = TestBed.inject(NgbModal);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
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
      planned_publication_date_msecs: 100.0,
      last_modified_msecs: 100.0,
      first_publication_date_msecs: 200.0,
      unpublishing_reason: null,
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
    const learnerTopicSummaryBackendDict2 = {
      id: 'sample_topic_2',
      name: 'Topic Name 2',
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
          all_node_dicts: [],
        },
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
    const learnerTopicSummaryBackendDict3 = {
      id: 'sample_topic_3',
      name: 'Topic Name 3',
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
      LearnerTopicSummary.createFromBackendDict(
        learnerTopicSummaryBackendDict2
      ),
    ];
    component.editGoals = [
      LearnerTopicSummary.createFromBackendDict(
        learnerTopicSummaryBackendDict1
      ),
      LearnerTopicSummary.createFromBackendDict(
        learnerTopicSummaryBackendDict2
      ),
      LearnerTopicSummary.createFromBackendDict(
        learnerTopicSummaryBackendDict3
      ),
    ];
    component.completedGoals = [
      LearnerTopicSummary.createFromBackendDict(
        learnerTopicSummaryBackendDict3
      ),
    ];
    component.partiallyLearntTopicsList = [
      LearnerTopicSummary.createFromBackendDict(
        learnerTopicSummaryBackendDict1
      ),
    ];
    component.untrackedTopics = {};
    component.learntToPartiallyLearntTopics = [];
    component.currentGoalsStoryIsShown = [];
    component.topicBelongToCurrentGoals = [];
    component.topicIdsInCompletedGoals = [];
    component.topicIdsInCurrentGoals = [];
    component.activityType = 'learntopic';

    sampleTopic = LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict1
    );
    fixture.detectChanges();
  });

  it('should intialize the component and set values', fakeAsync(() => {
    component.ngOnInit();
    fixture.detectChanges();

    expect(component.MAX_CURRENT_GOALS_LENGTH).toEqual(5);
    expect(component.windowIsNarrow).toBeTrue();
  }));

  it('should check whether window is narrow on resizing the screen', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    expect(component.windowIsNarrow).toBeTrue();

    mockResizeEmitter.emit();

    expect(component.windowIsNarrow).toBeFalse();
  });

  it('should check where the topicId belongs to current goal', () => {
    component.topicIdsInCurrentGoals = ['1', '2', '3'];

    let topicBelongsTo = component.getTopicClassification('1');
    fixture.detectChanges();

    expect(topicBelongsTo).toEqual(0);
  });

  it('should check where the topicId belongs to completed goal', () => {
    component.topicIdsInCompletedGoals = ['1', '2', '3'];

    let topicBelongsTo = component.getTopicClassification('1');
    fixture.detectChanges();

    expect(topicBelongsTo).toEqual(1);
  });

  it('should check if the topicName belongs to learntToPartiallyLearntTopics', () => {
    component.learntToPartiallyLearntTopics = ['topic', 'topic2', 'topic3'];

    let topicBelongsTo =
      component.doesTopicBelongToLearntToPartiallyLearntTopics('topic');
    fixture.detectChanges();

    expect(topicBelongsTo).toEqual(true);
  });

  it('should toggle story', () => {
    component.currentGoalsStoryIsShown = [true];

    component.toggleStory(0);
    fixture.detectChanges();

    expect(component.currentGoalsStoryIsShown[0]).toEqual(false);
  });

  it('should add topic to learner goals if not already present', () => {
    component.topicIdsInCurrentGoals.length = 0;
    component.topicIdsInCompletedGoals = ['1', '2'];
    const learnerGoalsSpy = spyOn(
      learnerDashboardActivityBackendApiService,
      'addToLearnerGoals'
    ).and.returnValue(Promise.resolve(true));
    component.untrackedTopics = {math: [component.editGoals[0]]};
    component.addToLearnerGoals(component.editGoals[0], 'sample_topic_id', 1);
    fixture.detectChanges();

    expect(learnerGoalsSpy).toHaveBeenCalled();
  });
  it('should remove topic from learner goals if already present', () => {
    component.topicIdsInCurrentGoals = ['1', '2', '3'];

    const learnerGoalsSpy = spyOn(
      learnerDashboardActivityBackendApiService,
      'addToLearnerGoals'
    ).and.returnValue(Promise.resolve(true));
    const removeTopicSpy = spyOn(component, 'removeFromLearnerGoals');

    component.addToLearnerGoals(component.editGoals[0], '2', 1);
    fixture.detectChanges();

    expect(removeTopicSpy).toHaveBeenCalled();
    expect(learnerGoalsSpy).not.toHaveBeenCalled();
  });

  it('should remove topic from the learner goals', () => {
    expect(learnerDashboardActivityBackendApiService.removeActivityModalStatus)
      .toBeUndefined;
    component.topicIdsInCurrentGoals = ['1', '2', '3'];

    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockRemoveActivityNgbModalRef,
        result: Promise.resolve('success'),
      } as NgbModalRef;
    });

    component.removeFromLearnerGoals(
      component.editGoals[0],
      '1',
      'topicName',
      0
    );
    component.removeFromLearnerGoals(
      component.editGoals[1],
      '2',
      'topicName',
      0
    );

    expect(modalSpy).toHaveBeenCalled();
  });

  it('should get static image url', () => {
    const urlSpy = spyOn(
      urlInterpolationService,
      'getStaticImageUrl'
    ).and.returnValue('/assets/images/learner_dashboard/star.svg');

    component.getStaticImageUrl('/learner_dashboard/star.svg');
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
  });

  it('should correctly show and hide the dropdown', () => {
    for (let i = 0; i < component.currentGoals.length; i++) {
      component.toggleThreeDotsDropdown(i);
      expect(component.showThreeDotsDropdown[i]).toBe(true);

      component.toggleThreeDotsDropdown(i);
      expect(component.showThreeDotsDropdown[i]).toBe(false);

      component.toggleThreeDotsDropdown(i);
      expect(component.showThreeDotsDropdown[i]).toBe(true);

      let fakeClickAwayEvent = new MouseEvent('click');
      Object.defineProperty(fakeClickAwayEvent, 'target', {
        value: document.createElement('div'),
      });
      component.onDocumentClick(fakeClickAwayEvent);
      fixture.detectChanges();
      expect(component.showThreeDotsDropdown[i]).toBe(false);

      // Three dots are not shown when no goals are present.
      component.onDocumentClick(fakeClickAwayEvent);
      fixture.detectChanges();
      expect(component.showThreeDotsDropdown[i]).toBe(false);
    }
  });

  it('should open add-goals-modal when add goal button is clicked', () => {
    component.learnerDashboardRedesignFeatureFlag = true;
    fixture.detectChanges();

    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      topics: allTopics,
      checkedTopics: new Set(['sample_topic_id', 'sample_topic_2']),
      completedTopics: new Set(['sample_topic_3']),
    };
    dialogConfig.panelClass = 'oppia-learner-dash-goals-modal';
    matDialogSpy.open.and.returnValue(matDialogRefSpy);
    matDialogRefSpy.afterClosed.and.returnValue(of(new Set()));
    spyOn(component, 'openModal').and.callThrough();

    const addGoalsButton = fixture.debugElement.query(
      By.css('.oppia-learner-dash-button--add-goals')
    );
    addGoalsButton.triggerEventHandler('click', null);

    fixture.detectChanges();

    expect(component.openModal).toHaveBeenCalled();
    expect(matDialogSpy.open).toHaveBeenCalledWith(
      AddGoalsModalComponent,
      dialogConfig
    );
  });

  it('should add new goals if add-goals-modal returns set with new ids', async () => {
    component.checkedTopics = new Set();
    fixture.detectChanges();

    matDialogSpy.open.and.returnValue(matDialogRefSpy);
    matDialogRefSpy.afterClosed.and.returnValue(
      of(new Set(['sample_topic_id', 'sample_topic_2']))
    );
    const addToLearnerGoalsSpy = spyOn(
      learnerDashboardActivityBackendApiService,
      'addToLearnerGoals'
    ).and.returnValue(Promise.resolve(true));
    component.openModal();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(addToLearnerGoalsSpy).toHaveBeenCalledTimes(2);
    expect(addToLearnerGoalsSpy.calls.argsFor(0)).toEqual([
      'sample_topic_id',
      'learntopic',
    ]);
    expect(addToLearnerGoalsSpy.calls.argsFor(1)).toEqual([
      'sample_topic_2',
      'learntopic',
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.checkedTopics).toEqual(
      new Set(['sample_topic_id', 'sample_topic_2'])
    );
  });

  it('should remove goals if add-goals-modal returns set with less ids than current', async () => {
    component.checkedTopics = new Set(['sample_topic_id', 'sample_topic_2']);
    fixture.detectChanges();
    matDialogSpy.open.and.returnValue(matDialogRefSpy);
    matDialogRefSpy.afterClosed.and.returnValue(
      of(new Set(['sample_topic_2']))
    );

    const removeActivityModalAsyncSpy = spyOn(
      learnerDashboardActivityBackendApiService,
      'removeActivityModalAsync'
    ).and.returnValue(Promise.resolve(true));

    component.openModal();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(removeActivityModalAsyncSpy).toHaveBeenCalled();
    expect(removeActivityModalAsyncSpy.calls.argsFor(0)).toEqual([
      'I18N_LEARNER_DASHBOARD_CURRENT_GOALS_SECTION',
      'I18N_DASHBOARD_LEARN_TOPIC',
      'sample_topic_id',
      'Topic Name',
    ]);

    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.checkedTopics).toEqual(new Set(['sample_topic_2']));
  });

  it('should remove goal based on topicId and topicName', async () => {
    component.checkedTopics = new Set(['sample_topic_id', 'sample_topic_2']);
    const removeActivityModalAsyncSpy = spyOn(
      learnerDashboardActivityBackendApiService,
      'removeActivityModalAsync'
    ).and.returnValue(Promise.resolve(true));

    component.removeGoal('sample_topic_2', 'Topic Name 2');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(removeActivityModalAsyncSpy).toHaveBeenCalled();
    expect(component.checkedTopics).toEqual(new Set(['sample_topic_id']));
    expect(component.currentGoals).toEqual([sampleTopic]);
  });
});
