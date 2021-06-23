// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TopicEditorStateService.
 */

import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { BackendChangeObject } from 'domain/editor/undo_redo/change.model';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { EditableStoryBackendApiService } from 'domain/story/editable-story-backend-api.service';
import { StorySummaryBackendDict } from 'domain/story/story-summary.model';
import { EditableTopicBackendApiService, FetchTopicResponse, UpdateTopicResponse } from 'domain/topic/editable-topic-backend-api.service';
import { SubtopicPage, SubtopicPageBackendDict } from 'domain/topic/subtopic-page.model';
import { TopicRightsBackendApiService } from 'domain/topic/topic-rights-backend-api.service';
import { TopicRightsBackendDict } from 'domain/topic/topic-rights.model';
import { TopicBackendDict, TopicObjectFactory } from 'domain/topic/TopicObjectFactory';
import { AlertsService } from 'services/alerts.service';
import { TopicEditorStateService } from './topic-editor-state.service';

describe('Topic editor state service', () => {
  let topicEditorStateService: TopicEditorStateService;
  let mockEditableTopicBackendApiService: MockEditableTopicBackendApiService;
  let alertsService: AlertsService;
  let topicObjectFactory: TopicObjectFactory;

  let skillCreationIsAllowed: boolean = true;
  let skillQuestionCountDict = {};
  let groupedSkillSummaries = {
    topic1: {
      id: 'topic_id',
      description: 'desc',
      language_code: 'en',
      version: 2,
      misconception_count: 0,
      worked_examples_count: 0,
      skill_model_created_on: 123,
      skill_model_last_updated: 213
    }
  };
  let topicDict: TopicBackendDict = {
    id: 'topic_id',
    name: 'topic_name',
    abbreviated_name: 'topic',
    description: 'topic description',
    language_code: 'en',
    uncategorized_skill_ids: [],
    next_subtopic_id: 2,
    version: 1,
    thumbnail_filename: '',
    thumbnail_bg_color: '',
    subtopics: [],
    canonical_story_references: [],
    additional_story_references: [],
    url_fragment: 'fragment',
    practice_tab_is_displayed: true,
    meta_tag_content: 'content',
    page_title_fragment_for_web: 'title_fragment'
  };
  let storySummaryBackendDict: StorySummaryBackendDict = {
    id: 'id',
    title: 'story summary title',
    node_titles: [],
    thumbnail_filename: 'filename',
    thumbnail_bg_color: 'bg_color',
    description: 'desc',
    story_is_published: true,
    completed_node_titles: [],
    url_fragment: 'story_fragment',
    all_node_dicts: []
  };
  let subtopicPage: SubtopicPageBackendDict = {
    id: 'subtopic_id',
    topic_id: 'topic_id',
    page_contents: {
      subtitled_html: {
        content_id: 'content_id',
        html: 'html'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {}
      }
    },
    language_code: 'en'
  };

  class MockEditableTopicBackendApiService {
    fetchTopicAsync(topicId: string): Promise<FetchTopicResponse> {
      return Promise.resolve({
        skillCreationIsAllowed: skillCreationIsAllowed,
        skillQuestionCountDict: skillQuestionCountDict,
        groupedSkillSummaries: groupedSkillSummaries,
        topicDict: topicDict,
        skillIdToDescriptionDict: {},
        skillIdToRubricsDict: {},
        classroomUrlFragment: 'url_fragment'
      } as unknown as FetchTopicResponse);
    }

    fetchStoriesAsync(topicId: string): Promise<StorySummaryBackendDict[]> {
      return Promise.resolve([storySummaryBackendDict]);
    }

    fetchSubtopicPageAsync(
        topicId: number, subtopicId: number): Promise<SubtopicPageBackendDict> {
      return Promise.resolve(subtopicPage);
    }

    updateTopicAsync(
        topicId: string,
        version: number,
        commitMessage: string,
        changeList: BackendChangeObject[]):
        Promise<UpdateTopicResponse> {
      return Promise.resolve({
        topicDict: topicDict,
        skillIdToRubricsDict: {},
        skillIdToDescriptionDict: {}
      });
    }

    doesTopicWithNameExistAsync(topicName: string): Promise<boolean> {
      return Promise.resolve(true);
    }

    doesTopicWithUrlFragmentExistAsync(topicName: string): Promise<boolean> {
      return Promise.resolve(true);
    }
  }

  class MockTopicRightsBackendApiService {
    fetchTopicRightsAsync(topicId: string): Promise<TopicRightsBackendDict> {
      return Promise.resolve({
        published: true,
        can_publish_topic: true,
        can_edit_topic: true
      });
    }
  }

  class MockEditableStoryBackendApiService {
    deleteStoryAsync(storyId: string): Promise<Object> {
      return Promise.resolve({});
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        AlertsService,
        {
          provide: EditableStoryBackendApiService,
          useClass: MockEditableStoryBackendApiService
        },
        {
          provide: EditableTopicBackendApiService,
          useClass: MockEditableTopicBackendApiService
        },
        TopicObjectFactory,
        {
          provide: TopicRightsBackendApiService,
          useClass: MockTopicRightsBackendApiService
        },
        UndoRedoService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    mockEditableTopicBackendApiService = (TestBed.inject(
      EditableTopicBackendApiService) as unknown) as
      jasmine.SpyObj<MockEditableTopicBackendApiService>;
    alertsService = (TestBed.inject(AlertsService) as unknown) as
      jasmine.SpyObj<AlertsService>;
    topicObjectFactory = TestBed.inject(TopicObjectFactory);
  });

  it('should create', () => {
    expect(topicEditorStateService).toBeDefined();
  });

  it('should load topic', fakeAsync(() => {
    topicEditorStateService.loadTopic('test_id');
    tick();
    expect(topicEditorStateService.isSkillCreationAllowed())
      .toEqual(skillCreationIsAllowed);
    expect(topicEditorStateService.isLoadingTopic()).toEqual(false);
    expect(topicEditorStateService.hasLoadedTopic()).toBeTrue();
    expect(topicEditorStateService.getGroupedSkillSummaries()).toBeDefined();
    expect(topicEditorStateService.getSkillQuestionCountDict()).toBeDefined();
    expect(topicEditorStateService.getTopicRights()).toBeDefined();
  }));

  it('should display error message when topic fails to load', fakeAsync(() => {
    let errorMsg: string = 'Error Message';
    spyOn(mockEditableTopicBackendApiService, 'fetchTopicAsync').and
      .returnValue(Promise.reject(errorMsg));
    spyOn(alertsService, 'addWarning');

    topicEditorStateService.loadTopic('test_id');
    tick();
    expect(alertsService.addWarning).toHaveBeenCalledWith(errorMsg);
  }));

  it('should display default error message when topic fails to load',
    fakeAsync(() => {
      spyOn(mockEditableTopicBackendApiService, 'fetchTopicAsync').and
        .returnValue(Promise.reject());
      spyOn(alertsService, 'addWarning');

      topicEditorStateService.loadTopic('test_id');
      tick();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'There was an error when loading the topic editor.');
    }));

  it('should load subtopic page', fakeAsync(() => {
    topicEditorStateService.loadSubtopicPage('1', 2);
    tick();
    expect(topicEditorStateService.getSubtopicPage()).toEqual(
      SubtopicPage.createFromBackendDict(subtopicPage));
    expect(topicEditorStateService.getCachedSubtopicPages()).toHaveSize(1);
    topicEditorStateService.loadSubtopicPage('1', 2);
    expect(topicEditorStateService.getSubtopicPage()).toEqual(
      SubtopicPage.createFromBackendDict(subtopicPage));
  }));

  it('should show error when loading subtopic page fails', fakeAsync(() => {
    spyOn(mockEditableTopicBackendApiService, 'fetchSubtopicPageAsync')
      .and.returnValue(Promise.reject());
    spyOn(alertsService, 'addWarning');
    topicEditorStateService.loadSubtopicPage('1', 2);
    tick();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'There was an error when loading the topic.');
  }));

  it('should set subtopic page', fakeAsync(() => {
    topicEditorStateService.setSubtopicPage(
      SubtopicPage.createFromBackendDict(subtopicPage));
    expect(topicEditorStateService.getSubtopicPage()).toEqual(
      SubtopicPage.createFromBackendDict(subtopicPage));

    topicEditorStateService.loadSubtopicPage('1', 2);
    tick();
    topicEditorStateService.setSubtopicPage(
      SubtopicPage.createFromBackendDict(subtopicPage));
    expect(topicEditorStateService.getSubtopicPage()).toEqual(
      SubtopicPage.createFromBackendDict(subtopicPage));
  }));

  it('should set topic', () => {
    let topic = topicObjectFactory.create(topicDict, {});
    topicEditorStateService.setTopic(topic);
    expect(topicEditorStateService.getTopic()).toEqual(topic);
  });

  it('should delete subtopic page', fakeAsync(() => {
    topicEditorStateService.loadSubtopicPage('1', 2);
    tick();
    topicEditorStateService.deleteSubtopicPage('1', 2);
  }));

  it('should test getters', () => {
    expect(topicEditorStateService.getSkillIdToRubricsObject()).toBeDefined();
    expect(topicEditorStateService.getCanonicalStorySummaries()).toBeDefined();
    expect(topicEditorStateService.onStorySummariesInitialized).toBeDefined();
    expect(topicEditorStateService.onSubtopicPageLoaded).toBeDefined();
    expect(topicEditorStateService.isSavingTopic()).toBeDefined();
    expect(topicEditorStateService.onTopicInitialized).toBeDefined();
    expect(topicEditorStateService.onTopicReinitialized).toBeDefined();
    expect(topicEditorStateService.getClassroomUrlFragment()).toBeDefined();
  });

  it('should update existence of topic name', fakeAsync(() => {
    topicEditorStateService.updateExistenceOfTopicName('test_topic', () => {});
    tick();
    expect(topicEditorStateService.getTopicWithNameExists()).toBeTrue();
  }));

  it('should show error when updation of topic name', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');
    spyOn(mockEditableTopicBackendApiService, 'doesTopicWithNameExistAsync')
      .and.returnValue(Promise.reject());

    topicEditorStateService.updateExistenceOfTopicName('test_topic', () => {});
    tick();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'There was an error when checking if the topic name ' +
        'exists for another topic.'
    );
  }));

  it('should update existence of topic url fragment', fakeAsync(() => {
    topicEditorStateService.updateExistenceOfTopicUrlFragment(
      'test_topic', () => {});
    tick();
    expect(topicEditorStateService.getTopicWithUrlFragmentExists()).toBeTrue();
  }));

  it('should show error when updation of topic url fragment', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');
    spyOn(
      mockEditableTopicBackendApiService, 'doesTopicWithUrlFragmentExistAsync')
      .and.returnValue(Promise.reject());

    topicEditorStateService.updateExistenceOfTopicUrlFragment(
      'test_topic', () => {});
    tick();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'There was an error when checking if the topic url fragment ' +
        'exists for another topic.'
    );
  }));
});
