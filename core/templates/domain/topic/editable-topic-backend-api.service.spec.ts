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
 * @fileoverview Unit tests for EditableTopicBackendApiService.
 */

import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';

import { CsrfTokenService } from 'services/csrf-token.service.ts';
import { EditableTopicBackendApiService } from
  'domain/topic/editable-topic-backend-api.service.ts';

describe('Editable topic backend API service', () => {
  let csrfTokenService: CsrfTokenService = null;
  let editableTopicBackendApiService: EditableTopicBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let sampleDataResults = {
    topic_dict: {
      id: '0',
      name: 'Topic Name',
      description: 'Topic Description',
      version: '1',
      canonical_story_references: [{
        story_id: 'story_1',
        story_is_published: true
      }],
      canonical_story_summary_dicts: [{
        id: '0',
        title: 'Title',
        node_count: 1,
        story_is_published: false
      }],
      additional_story_references: [{
        story_id: 'story_2',
        story_is_published: true
      }],
      uncategorized_skill_ids: ['skill_id_1'],
      subtopics: [],
      language_code: 'en'
    },
    grouped_skill_summary_dicts: {},
    skill_id_to_description_dict: {
      skill_id_1: 'Description 1'
    },
    skill_id_to_rubrics_dict: {
      skill_id_1: []
    },
    subtopic_page: {
      id: 'topicId-1',
      topicId: 'topicId',
      page_contents: {
        subtitled_html: {
          html: '<p>Data</p>',
          content_id: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {}
          }
        },
      },
      language_code: 'en'
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditableTopicBackendApiService]
    });

    csrfTokenService = TestBed.get(CsrfTokenService);
    httpTestingController = TestBed.get(HttpTestingController);
    editableTopicBackendApiService = TestBed.get(
      EditableTopicBackendApiService);

    spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(() => {
      return new Promise((resolve) => {
        resolve('sample-csrf-token');
      });
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing topic from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      editableTopicBackendApiService.fetchTopic('0').then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/topic_editor_handler/data/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        topicDict: sampleDataResults.topic_dict,
        skillIdToDescriptionDict:
          sampleDataResults.skill_id_to_description_dict,
        groupedSkillSummaries: sampleDataResults.grouped_skill_summary_dicts,
        skillIdToRubricsDict: sampleDataResults.skill_id_to_rubrics_dict
      });
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it('should use the rejection handler if the backend request failed',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      editableTopicBackendApiService.fetchTopic('1').then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/topic_editor_handler/data/1');
      expect(req.request.method).toEqual('GET');
      req.flush('Error loading topic 1.', {
        status: 500, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading topic 1.');
    }
    ));

  it('should successfully fetch an existing subtopic page from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      editableTopicBackendApiService.fetchSubtopicPage('topicId', 1).then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/subtopic_page_editor_handler/data/topicId/1');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResults.subtopic_page);
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it('should use the rejection handler when fetching an existing subtopic' +
    ' page fails', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    editableTopicBackendApiService.fetchSubtopicPage('topicId', 1).then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/subtopic_page_editor_handler/data/topicId/1');
    expect(req.request.method).toEqual('GET');
    req.flush('Error loading subtopic 1.', {
      status: 500, statusText: 'Invalid Request'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading subtopic 1.');
  }));

  it('should update a topic after fetching it from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let topic = null;

      editableTopicBackendApiService.fetchTopic('0').then(
        (data: {[key: string]: Object}) => {
          topic = data.topicDict;
        });
      let req = httpTestingController.expectOne(
        '/topic_editor_handler/data/0');

      // Loading a topic the first time should fetch it from the backend.
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      topic.name = 'New Name';
      topic.version = '2';
      let topicWrapper = {
        topic_dict: topic,
        skill_id_to_description_dict: {
          skill_id_1: 'Description 1'
        },
        skill_id_to_rubrics_dict: []
      };

      // Send a request to update topic
      editableTopicBackendApiService.updateTopic(
        topic.id, topic.version, 'Name is updated', []
      ).then(successHandler, failHandler);
      req = httpTestingController.expectOne(
        '/topic_editor_handler/data/0');
      expect(req.request.method).toEqual('PUT');
      req.flush(topicWrapper);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        topicDict: topic,
        skillIdToDescriptionDict: topicWrapper.skill_id_to_description_dict,
        skillIdToRubricsDict: topicWrapper.skill_id_to_rubrics_dict
      });
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it('should use the rejection handler if the topic to update doesn\'t exist',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      editableTopicBackendApiService.updateTopic(
        '1', '1', 'Update an invalid topic.', []
      ).then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/topic_editor_handler/data/1');

      // Loading a topic the first time should fetch it from the backend.
      expect(req.request.method).toEqual('PUT');
      req.flush('Topic with given id doesn\'t exist.', {
        status: 404, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Topic with given id doesn\'t exist.');
    }
    ));

  it('should sucessfully fetch stories from a topic', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    editableTopicBackendApiService.fetchStories('0').then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/topic_editor_story_handler/' + '0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults.topic_dict);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.topic_dict.canonical_story_summary_dicts);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler when fetching stories from a' +
    ' topic fails', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    editableTopicBackendApiService.fetchStories('0').then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/topic_editor_story_handler/' + '0');
    expect(req.request.method).toEqual('GET');
    req.flush('Error loading story with id 0.', {
      status: 500, statusText: 'Invalid Request'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error loading story with id 0.');
  }));

  it('should sucessfully delete a topic', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    editableTopicBackendApiService.deleteTopic('0').then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/topic_editor_handler/data/' + '0');
    expect(req.request.method).toEqual('DELETE');
    req.flush('Topic with given id deleted.', {
      status: 200, statusText: 'Success'
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(200);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler when deleting a topic fails',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      editableTopicBackendApiService.deleteTopic('1').then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/topic_editor_handler/data/' + '1');
      expect(req.request.method).toEqual('DELETE');
      req.flush('Error deleting topic 1.', {
        status: 500, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error deleting topic 1.');
    }
    ));
});
