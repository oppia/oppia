// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for learner group syllabus tab.
 */

import {NO_ERRORS_SCHEMA, Pipe} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {LearnerGroupSyllabusBackendApiService} from 'domain/learner_group/learner-group-syllabus-backend-api.service';
import {StorySummary} from 'domain/story/story-summary.model';
import {LearnerGroupSubtopicSummary} from 'domain/learner_group/learner-group-subtopic-summary.model';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {LearnerGroupSyllabus} from 'domain/learner_group/learner-group-syllabus.model';
import {LearnerGroupSyllabusComponent} from './learner-group-syllabus.component';
import {LearnerGroupData} from 'domain/learner_group/learner-group.model';
import {LearnerGroupBackendApiService} from 'domain/learner_group/learner-group-backend-api.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';

@Pipe({name: 'truncate'})
class MockTrunctePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

describe('LearnerGroupSyllabusComponent', () => {
  let component: LearnerGroupSyllabusComponent;
  let fixture: ComponentFixture<LearnerGroupSyllabusComponent>;
  let assetsBackendApiService: AssetsBackendApiService;
  let learnerGroupSyllabusBackendApiService: LearnerGroupSyllabusBackendApiService;
  let learnerGroupBackendApiService: LearnerGroupBackendApiService;
  let ngbModal: NgbModal;

  const sampleSubtopicSummaryDict = {
    subtopic_id: 1,
    subtopic_title: 'subtopicTitle',
    parent_topic_id: 'topicId1',
    parent_topic_name: 'parentTopicName',
    thumbnail_filename: 'thumbnailFilename',
    thumbnail_bg_color: 'red',
    subtopic_mastery: 0.5,
  };
  const sampleLearnerGroupSubtopicSummary =
    LearnerGroupSubtopicSummary.createFromBackendDict(
      sampleSubtopicSummaryDict
    );

  const sampleSubtopicSummaryDict2 = {
    subtopic_id: 0,
    subtopic_title: 'subtopicTitle',
    parent_topic_id: 'topicId1',
    parent_topic_name: 'parentTopicName',
    thumbnail_filename: 'thumbnailFilename',
    thumbnail_bg_color: 'red',
    subtopic_mastery: 0.6,
  };
  const sampleLearnerGroupSubtopicSummary2 =
    LearnerGroupSubtopicSummary.createFromBackendDict(
      sampleSubtopicSummaryDict2
    );

  const sampleStorySummaryBackendDict = {
    id: 'story_id_0',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Chapter 1'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Chapter 1'],
    url_fragment: 'story-title',
    all_node_dicts: [],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };
  const sampleStorySummary = StorySummary.createFromBackendDict(
    sampleStorySummaryBackendDict
  );

  const sampleStorySummaryBackendDict2 = {
    id: 'story_id_1',
    title: 'Story Title 2',
    description: 'Story Description 2',
    node_titles: ['Chapter 2'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Chapter 2'],
    url_fragment: 'some-story-title',
    all_node_dicts: [],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };

  const mockSyllabusItemsBackendDict = {
    learner_group_id: 'groupId',
    story_summary_dicts: [
      sampleStorySummaryBackendDict,
      sampleStorySummaryBackendDict2,
    ],
    subtopic_summary_dicts: [
      sampleSubtopicSummaryDict,
      sampleSubtopicSummaryDict2,
    ],
  };
  const mockSyllabusItems = LearnerGroupSyllabus.createFromBackendDict(
    mockSyllabusItemsBackendDict
  );

  const learnerGroupBackendDict = {
    id: 'groupId',
    title: 'title',
    description: 'description',
    facilitator_usernames: ['facilitator_username'],
    learner_usernames: [],
    invited_learner_usernames: ['username1'],
    subtopic_page_ids: ['topicId1:1'],
    story_ids: ['story_id_0'],
  };
  const learnerGroup = LearnerGroupData.createFromBackendDict(
    learnerGroupBackendDict
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        LearnerGroupSyllabusComponent,
        MockTranslatePipe,
        MockTrunctePipe,
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    learnerGroupSyllabusBackendApiService = TestBed.inject(
      LearnerGroupSyllabusBackendApiService
    );
    learnerGroupBackendApiService = TestBed.inject(
      LearnerGroupBackendApiService
    );
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
    fixture = TestBed.createComponent(LearnerGroupSyllabusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component.learnerGroup = learnerGroup;
  });

  it('should determine if displayed item is a story or a subtopic', () => {
    expect(component.isDisplayedItemStory('story-2')).toBe(true);
    expect(component.isDisplayedItemStory('subtopic-2')).toBe(false);
    expect(component.isDisplayedItemSubtopic('story-2')).toBe(false);
    expect(component.isDisplayedItemSubtopic('subtopic-2')).toBe(true);
  });

  it('should determine index of syllabus item to display', () => {
    expect(component.getIndexToDisplay('story-2')).toBe(2);
    expect(component.getIndexToDisplay('subtopic-5')).toBe(5);
  });

  it('should initialize', fakeAsync(() => {
    spyOn(
      learnerGroupSyllabusBackendApiService,
      'fetchLearnerGroupSyllabus'
    ).and.returnValue(Promise.resolve(mockSyllabusItems));
    expect(component.learnerGroup).toEqual(learnerGroup);

    component.ngOnInit();
    tick(100);

    expect(component.storySummaries).toEqual(mockSyllabusItems.storySummaries);
    expect(component.subtopicSummaries).toEqual(
      mockSyllabusItems.subtopicPageSummaries
    );
    expect(component.displayOrderOfSyllabusItems).toEqual([
      'story-0',
      'story-1',
      'subtopic-0',
      'subtopic-1',
    ]);
  }));

  it('should get subtopic thumbnail url', () => {
    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview').and.returnValue(
      '/topic/thumbnail/url'
    );

    expect(
      component.getSubtopicThumbnailUrl(sampleLearnerGroupSubtopicSummary)
    ).toEqual('/topic/thumbnail/url');
  });

  it('should get story thumbnail url', () => {
    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview').and.returnValue(
      '/story/thumbnail/url'
    );

    expect(component.getStoryThumbnailUrl(sampleStorySummary)).toEqual(
      '/story/thumbnail/url'
    );
  });

  it('should update newly added subtopic summaries successfully', () => {
    expect(component.newlyAddedSubtopicSummaries).toEqual([]);
    component.updateNewlyAddedSubtopicSummaries([
      sampleLearnerGroupSubtopicSummary,
    ]);

    expect(component.newlyAddedSubtopicSummaries).toEqual([
      sampleLearnerGroupSubtopicSummary,
    ]);
  });

  it('should update newly added story summaries successfully', () => {
    expect(component.newlyAddedStorySummaries).toEqual([]);
    component.updateNewlyAddedStorySummaries([sampleStorySummary]);

    expect(component.newlyAddedStorySummaries).toEqual([sampleStorySummary]);
  });

  it('should update newly added story and subtopic ids successfully', () => {
    expect(component.newlyAddedStoryIds).toEqual([]);
    expect(component.newlyAddedSubtopicIds).toEqual([]);

    component.updateNewlyAddedStoryIds(['storyId', 'storyId2']);
    component.updateNewlyAddedSubtopicIds(['subtopicId1', 'subtopicId2']);

    expect(component.newlyAddedStoryIds).toEqual(['storyId', 'storyId2']);
    expect(component.newlyAddedSubtopicIds).toEqual([
      'subtopicId1',
      'subtopicId2',
    ]);
  });

  it('should determine if new syllabus was added or not', () => {
    expect(component.newlyAddedStoryIds).toEqual([]);
    expect(component.newlyAddedSubtopicIds).toEqual([]);
    expect(component.isNewSyllabusAdded()).toBe(false);

    component.updateNewlyAddedStoryIds(['storyId', 'storyId2']);
    component.updateNewlyAddedSubtopicIds(['subtopicId1', 'subtopicId2']);

    expect(component.isNewSyllabusAdded()).toBe(true);
  });

  it('should check whether add new syllabus items mode is active', () => {
    expect(component.isAddNewSyllabusItemsModeActive()).toBe(false);
    component.toggleAddNewSyllabusItemsMode();
    expect(component.isAddNewSyllabusItemsModeActive()).toBe(true);
  });

  it('should save new syllabus items successfully', fakeAsync(() => {
    const demoLearnerGroupBackendDict = {
      id: 'groupId',
      title: 'title',
      description: 'description',
      facilitator_usernames: ['facilitator_username'],
      learner_usernames: [],
      invited_learner_usernames: ['username1'],
      subtopic_page_ids: [],
      story_ids: ['story_id_1'],
    };
    const demoLearnerGroup = LearnerGroupData.createFromBackendDict(
      demoLearnerGroupBackendDict
    );

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        itemsAddedCount: 2,
      },
      result: Promise.resolve(),
    } as NgbModalRef);

    spyOn(
      learnerGroupBackendApiService,
      'updateLearnerGroupAsync'
    ).and.returnValue(Promise.resolve(learnerGroup));

    component.learnerGroup = demoLearnerGroup;
    component.subtopicSummaries = [];
    component.storySummaries = [sampleStorySummary];
    component.newlyAddedStoryIds = ['story_id_0'];
    component.newlyAddedSubtopicIds = ['topicId1:1'];

    component.saveNewSyllabusItems();
    tick(100);
    fixture.detectChanges();

    expect(component.learnerGroup).toEqual(learnerGroup);
    expect(component.newlyAddedStoryIds).toEqual([]);
  }));

  it('should close save new syllabus items modal successfully', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        itemsAddedCount: 2,
      },
      result: Promise.reject(),
    } as NgbModalRef);

    component.learnerGroup = learnerGroup;
    component.newlyAddedStoryIds = ['story_id_0'];
    component.newlyAddedSubtopicIds = ['topicId1:2'];

    component.saveNewSyllabusItems();
    tick(100);
    fixture.detectChanges();

    expect(component.learnerGroup).toEqual(learnerGroup);
  }));

  it('should remove subtopic page id from syllabus successfully', fakeAsync(() => {
    const demoLearnerGroupBackendDict = {
      id: 'groupId',
      title: 'title',
      description: 'description',
      facilitator_usernames: ['facilitator_username'],
      learner_usernames: [],
      invited_learner_usernames: ['username1'],
      subtopic_page_ids: ['topicId1:0', 'topicId1:1'],
      story_ids: ['story_id_1'],
    };
    const demoLearnerGroup = LearnerGroupData.createFromBackendDict(
      demoLearnerGroupBackendDict
    );

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        confirmationTitle: 'title',
        confirmationMessage: 'message',
      },
      result: Promise.resolve(),
    } as NgbModalRef);

    spyOn(
      learnerGroupBackendApiService,
      'updateLearnerGroupAsync'
    ).and.returnValue(Promise.resolve(learnerGroup));

    component.learnerGroup = demoLearnerGroup;
    component.subtopicSummaries = [
      sampleLearnerGroupSubtopicSummary,
      sampleLearnerGroupSubtopicSummary2,
    ];
    component.storySummaries = [];

    component.removeSubtopicPageIdFromSyllabus('topicId1:0');
    tick(100);
    fixture.detectChanges();

    expect(component.learnerGroup).toEqual(learnerGroup);
    expect(component.subtopicSummaries).toEqual([
      sampleLearnerGroupSubtopicSummary,
    ]);
  }));

  it('should remove story id from syllabus successfully', fakeAsync(() => {
    const demoLearnerGroupBackendDict = {
      id: 'groupId',
      title: 'title',
      description: 'description',
      facilitator_usernames: ['facilitator_username'],
      learner_usernames: [],
      invited_learner_usernames: ['username1'],
      subtopic_page_ids: ['topicId1:1'],
      story_ids: ['story_id_0', 'story_id_1'],
    };
    const demoLearnerGroup = LearnerGroupData.createFromBackendDict(
      demoLearnerGroupBackendDict
    );

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        confirmationTitle: 'title',
        confirmationMessage: 'message',
      },
      result: Promise.resolve(),
    } as NgbModalRef);

    spyOn(
      learnerGroupBackendApiService,
      'updateLearnerGroupAsync'
    ).and.returnValue(Promise.resolve(learnerGroup));

    component.learnerGroup = demoLearnerGroup;
    component.storySummaries = [sampleStorySummary];
    component.subtopicSummaries = [];

    component.removeStoryIdFromSyllabus('story_id_1');
    tick(100);
    fixture.detectChanges();

    expect(component.learnerGroup).toEqual(learnerGroup);
  }));

  it('should close remove story from syllabus modal successfully', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        confirmationTitle: 'title',
        confirmationMessage: 'message',
      },
      result: Promise.reject(),
    } as NgbModalRef);

    component.learnerGroup = learnerGroup;

    component.removeStoryIdFromSyllabus('story_id_0');
    tick(100);
    fixture.detectChanges();

    expect(component.learnerGroup).toEqual(learnerGroup);
  }));

  it('should close remove subtopic from syllabus modal successfully', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        confirmationTitle: 'title',
        confirmationMessage: 'message',
      },
      result: Promise.reject(),
    } as NgbModalRef);

    component.learnerGroup = learnerGroup;

    component.removeSubtopicPageIdFromSyllabus('topicId1:1');
    tick(100);
    fixture.detectChanges();

    expect(component.learnerGroup).toEqual(learnerGroup);
  }));
});
