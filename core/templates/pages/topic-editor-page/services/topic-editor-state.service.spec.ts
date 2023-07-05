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
import { TopicRights, TopicRightsBackendDict } from 'domain/topic/topic-rights.model';
import { TopicBackendDict, Topic } from 'domain/topic/topic-object.model';
import { AlertsService } from 'services/alerts.service';
import { TopicEditorStateService } from './topic-editor-state.service';

describe('Topic editor state service', () => {
  let topicEditorStateService: TopicEditorStateService;
  let mockEditableTopicBackendApiService: MockEditableTopicBackendApiService;
  let alertsService: AlertsService;
  let undoRedoService: UndoRedoService;
  let editableStoryBackendApiService: EditableStoryBackendApiService;

  let skillCreationIsAllowed: boolean = true;
  let skillQuestionCountDict = {};
  let groupedSkillSummaries = {
    topic_name: [{
      id: 'skillId1',
      description: 'description1',
      language_code: 'en',
      version: 1,
      misconception_count: 3,
      worked_examples_count: 3,
      skill_model_created_on: 1593138898626.193,
      skill_model_last_updated: 1593138898626.193
    }],
    others: [{
      id: 'skillId2',
      description: 'description2',
      language_code: 'en',
      version: 1,
      misconception_count: 3,
      worked_examples_count: 3,
      skill_model_created_on: 1593138898626.193,
      skill_model_last_updated: 1593138898626.193
    }]
  };
  let topicDict: TopicBackendDict;
  let storySummaryBackendDict: StorySummaryBackendDict;
  let subtopicPage: SubtopicPageBackendDict;

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
        skillIdToRubricsDict: {
          skill_id_1: [
            {
              difficulty: 'Easy',
              explanations: [
                'Explanation 1'
              ]
            },
            {
              difficulty: 'Medium',
              explanations: [
                'Explanation 2'
              ]
            },
            {
              difficulty: 'Hard',
              explanations: [
                'Explanation 3'
              ]
            }
          ],
          skill_id_2: []
        },
        skillIdToDescriptionDict: {
          skill_id_1: 'Description 1',
          skill_id_2: ''
        }
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
        {
          provide: TopicRightsBackendApiService,
          useClass: MockTopicRightsBackendApiService
        },
        UndoRedoService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    undoRedoService = TestBed.inject(UndoRedoService);
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    // This throws "Type 'EditableTopicBackendApiService' is not
    // assignable to type desire". We need to suppress this error because of
    // the need to test validations. This is because the backend api service
    // returns an unknown type.
    // @ts-ignore
    mockEditableTopicBackendApiService = (TestBed.inject(
      EditableTopicBackendApiService)) as
      jasmine.SpyObj<MockEditableTopicBackendApiService>;
    editableStoryBackendApiService =
      TestBed.inject(EditableStoryBackendApiService);
    alertsService = (TestBed.inject(AlertsService) as unknown) as
      jasmine.SpyObj<AlertsService>;

    topicDict = {
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
      page_title_fragment_for_web: 'title_fragment',
      skill_ids_for_diagnostic_test: []
    };
    storySummaryBackendDict = {
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
    subtopicPage = {
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
    // This throws "Argument of type 'null' is not assignable to parameter of
    // type 'string'" We need to suppress this error because of the need to test
    // validations. This is because the backend api service returns an unknown
    // type.
    // @ts-ignore
    topicEditorStateService.loadSubtopicPage(null, null);
    tick();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'There was an error when loading the topic.');
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

  it('should show error when invalid topic id is provided', fakeAsync(() => {
    spyOn(mockEditableTopicBackendApiService, 'fetchSubtopicPageAsync')
      .and.returnValue(Promise.reject());
    spyOn(alertsService, 'addWarning');
    topicEditorStateService.loadSubtopicPage('', 2);
    tick();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'There was an error when loading the topic.');
  }));

  it('should set subtopic page', fakeAsync(() => {
    subtopicPage.id = 'topic_id1234-0';
    topicEditorStateService.setSubtopicPage(
      SubtopicPage.createFromBackendDict(subtopicPage));
    expect(topicEditorStateService.getSubtopicPage()).toEqual(
      SubtopicPage.createFromBackendDict(subtopicPage));

    topicEditorStateService.loadSubtopicPage('topic_id1234', 0);
    tick();
    topicEditorStateService.setSubtopicPage(
      SubtopicPage.createFromBackendDict(subtopicPage));
    expect(topicEditorStateService.getSubtopicPage()).toEqual(
      SubtopicPage.createFromBackendDict(subtopicPage));
  }));

  it('should set topic', () => {
    let topic = Topic.create(topicDict, {});
    topicEditorStateService.setTopic(topic);
    expect(topicEditorStateService.getTopic()).toEqual(topic);
  });

  it('should delete subtopic page when user deletes subtopic', fakeAsync(() => {
    topicDict.id = 'topic_id1234';
    let topic = Topic.create(topicDict, {});
    topicEditorStateService.setTopic(topic);
    subtopicPage.id = 'topic_id1234-0';
    topicEditorStateService.setSubtopicPage(
      SubtopicPage.createFromBackendDict(subtopicPage));
    tick();
    subtopicPage.id = 'topic_id1234-1';
    topicEditorStateService.setSubtopicPage(
      SubtopicPage.createFromBackendDict(subtopicPage));
    tick();
    subtopicPage.id = 'topic_id1234-2';
    topicEditorStateService.setSubtopicPage(
      SubtopicPage.createFromBackendDict(subtopicPage));
    tick();

    topicEditorStateService.deleteSubtopicPage('topic_id1234', 1);

    subtopicPage.id = 'topic_id1234-0';
    let subtopic0 = SubtopicPage.createFromBackendDict(subtopicPage);
    subtopicPage.id = 'topic_id1234-1';
    let subtopic1 = SubtopicPage.createFromBackendDict(subtopicPage);
    expect(topicEditorStateService.getCachedSubtopicPages()).toEqual([
      subtopic0, subtopic1
    ]);
  }));

  it('should save topic when user saves a topic', fakeAsync(() => {
    spyOn(undoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(undoRedoService, 'clearChanges');
    spyOn(undoRedoService, 'getCommittableChangeList').and.returnValue([{
      cmd: 'delete_canonical_story',
      story_id: 'story_id'
    }]);
    spyOn(mockEditableTopicBackendApiService, 'updateTopicAsync').and
      .callThrough();
    spyOn(editableStoryBackendApiService, 'deleteStoryAsync').and
      .callThrough();
    var successCallback = jasmine.createSpy('successCallback');
    let topic = Topic.create(topicDict, {});
    topicEditorStateService.setTopic(topic);

    topicEditorStateService.saveTopic('Commit Message', successCallback);
    tick();

    expect(mockEditableTopicBackendApiService.updateTopicAsync)
      .toHaveBeenCalledWith(
        'topic_id', 1, 'Commit Message', [
          {
            cmd: 'delete_canonical_story',
            story_id: 'story_id'
          }
        ]
      );
    expect(successCallback).toHaveBeenCalled();
    expect(undoRedoService.getCommittableChangeList).toHaveBeenCalled();
    expect(editableStoryBackendApiService.deleteStoryAsync)
      .toHaveBeenCalled();
    expect(undoRedoService.clearChanges).toHaveBeenCalled();
  }));

  it('should warn user when there is an error saving the topic',
    fakeAsync(() => {
      spyOn(undoRedoService, 'hasChanges').and.returnValue(true);
      spyOn(undoRedoService, 'getCommittableChangeList').and.returnValue([{
        cmd: 'delete_canonical_story',
        story_id: 'story_id'
      }]);
      spyOn(mockEditableTopicBackendApiService, 'updateTopicAsync').and
        .returnValue(Promise.reject());
      spyOn(alertsService, 'addWarning');
      var successCallback = jasmine.createSpy('successCallback');
      let topic = Topic.create(topicDict, {});
      topicEditorStateService.setTopic(topic);

      topicEditorStateService.saveTopic('Commit Message', successCallback);
      tick();

      expect(mockEditableTopicBackendApiService.updateTopicAsync)
        .toHaveBeenCalledWith(
          'topic_id', 1, 'Commit Message', [
            {
              cmd: 'delete_canonical_story',
              story_id: 'story_id'
            }
          ]
        );
      expect(successCallback).not.toHaveBeenCalled();
      expect(alertsService.addWarning)
        .toHaveBeenCalledWith('There was an error when saving the topic.');
    }));

  it('should not save topic when there are no changes', fakeAsync(() => {
    spyOn(undoRedoService, 'hasChanges').and.returnValue(false);
    spyOn(mockEditableTopicBackendApiService, 'updateTopicAsync');

    let topic = Topic.create(topicDict, {});
    topicEditorStateService.setTopic(topic);

    topicEditorStateService.saveTopic('Commit Message', () => {});
    tick();

    expect(mockEditableTopicBackendApiService.updateTopicAsync).not
      .toHaveBeenCalled();
  }));

  it('should not save topic when topicis not initialised', fakeAsync(() => {
    spyOn(alertsService, 'fatalWarning');
    spyOn(mockEditableTopicBackendApiService, 'updateTopicAsync');

    topicEditorStateService.saveTopic('Commit Message', () => {});
    tick();

    expect(alertsService.fatalWarning).toHaveBeenCalledWith(
      'Cannot save a topic before one is loaded.'
    );
    expect(mockEditableTopicBackendApiService.updateTopicAsync).not
      .toHaveBeenCalled();
  }));

  it('should set topic rights when called', () => {
    let topic = Topic.create(topicDict, {});
    topicEditorStateService.setTopic(topic);
    expect(topicEditorStateService.getTopicRights()).toEqual(
      TopicRights.createFromBackendDict({
        published: false,
        can_publish_topic: false,
        can_edit_topic: false
      }));

    topicEditorStateService.setTopicRights(TopicRights.createFromBackendDict({
      published: true,
      can_publish_topic: true,
      can_edit_topic: true
    }));

    expect(topicEditorStateService.getTopicRights()).toEqual(
      TopicRights.createFromBackendDict({
        published: true,
        can_publish_topic: true,
        can_edit_topic: true
      }));
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
      'test_topic', () => {}, () => {});
    tick();
    expect(topicEditorStateService.getTopicWithUrlFragmentExists()).toBeTrue();
  }));

  it('should not show error when updation of topic url fragment failed' +
     'with 400 status code', fakeAsync(() => {
    let errorResponse = {
      headers: {
        normalizedNames: {},
        lazyUpdate: null
      },
      status: 400,
      statusText: 'Bad Request',
      url: '',
      ok: false,
      name: 'HttpErrorResponse',
      message: 'Http failure response for test url: 400 Bad Request',
      error: {
        error: 'Error: Bad request to server',
        status_code: 400
      }
    };

    spyOn(alertsService, 'addWarning');
    spyOn(
      mockEditableTopicBackendApiService, 'doesTopicWithUrlFragmentExistAsync')
      .and.returnValue(Promise.reject(errorResponse));

    topicEditorStateService.updateExistenceOfTopicUrlFragment(
      'test_topic', () => {}, () => {});
    tick();
    expect(alertsService.addWarning).not.toHaveBeenCalled();
  }));

  it('should not show error when updation of topic url fragment failed' +
     'with 400 status code', fakeAsync(() => {
    let errorResponse = {
      headers: {
        normalizedNames: {},
        lazyUpdate: null
      },
      status: 500,
      statusText: 'Error: Failed to check topic url fragment.',
      url: '',
      ok: false,
      name: 'HttpErrorResponse',
      message: 'Http failure response for test url: 500' +
               'Error: Failed to check topic url fragment.',
      error: {
        error: 'Error: Failed to check topic url fragment.',
        status_code: 500
      }
    };

    spyOn(alertsService, 'addWarning');
    spyOn(
      mockEditableTopicBackendApiService, 'doesTopicWithUrlFragmentExistAsync')
      .and.returnValue(Promise.reject(errorResponse));

    topicEditorStateService.updateExistenceOfTopicUrlFragment(
      'test_topic', () => {}, () => {});
    tick();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      errorResponse.message);
  }));
});
