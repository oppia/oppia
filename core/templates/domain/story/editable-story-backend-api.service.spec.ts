// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EditableStoryBackendApiService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { EditableStoryBackendApiService, PublishedStoryModel } from
  'domain/story/editable-story-backend-api.service';
import { CsrfTokenService } from 'services/csrf-token.service';

describe('Editable story backend API service', () => {
  let editableStoryBackendApiService:
    EditableStoryBackendApiService = null;
  var sampleDataResults = null;
  let httpTestingController: HttpTestingController = null;
  let csrfService: CsrfTokenService = null;
  let successHandler = null;
  let failHandler = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    editableStoryBackendApiService = TestBed.get(
      EditableStoryBackendApiService
    );

    csrfService = TestBed.get(CsrfTokenService);
    httpTestingController = TestBed.get(
      HttpTestingController
    );

    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');

    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('simple-csrf-token');
    });

    // Sample story object returnable from the backend.
    sampleDataResults = {
      story: {
        id: 'storyId',
        title: 'Story title',
        description: 'Story description',
        notes: 'Notes',
        version: 1,
        story_contents: {
          initial_node_id: 'node_1',
          nodes: [{
            id: 'node_1',
            prerequisite_skill_ids: [],
            acquired_skill_ids: [],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false
          }],
          next_node_id: 'node_3'
        },
        language_code: 'en'
      },
      topic_name: 'Topic Name',
      story_is_published: true,
      skill_summaries: [{
        id: 'skill_1',
        description: 'Skill Description'
      }],
      topic_url_fragment: 'topic-frag',
      classroom_url_fragment: 'math'
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing story from the backend',
    fakeAsync(() => {
      editableStoryBackendApiService.fetchStory('storyId').then(
        successHandler, failHandler);

      const requestUrl = '/story_editor_handler/data/storyId';
      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        story: sampleDataResults.story,
        topicName: sampleDataResults.topic_name,
        storyIsPublished: true,
        skillSummaries: sampleDataResults.skill_summaries,
        topicUrlFragment: sampleDataResults.topic_url_fragment,
        classroomUrlFragment: sampleDataResults.classroom_url_fragment
      });
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should successfully delete a story from the backend',
    fakeAsync(() => {
      editableStoryBackendApiService.deleteStory('storyId').then(
        successHandler, failHandler);

      const requestUrl = '/story_editor_handler/data/storyId';
      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('DELETE');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should use the rejection handler if the backend request failed',
    fakeAsync(() => {
      editableStoryBackendApiService.fetchStory('2').then(
        successHandler, failHandler);

      const requestUrl = '/story_editor_handler/data/2';
      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(
        {error: 'Error loading story 2.'},
        {status: 500, statusText: ''}
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading story 2.');
    }));

  it('should update a story after fetching it from the backend',
    fakeAsync(() => {
      var story = null;

      // Loading a story the first time should fetch it from the backend.
      editableStoryBackendApiService.fetchStory('storyId').then(
        (data: PublishedStoryModel) => {
          story = data.story;
        });
      let requestUrl = '/story_editor_handler/data/storyId';
      let req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();

      story.title = 'New Title';
      story.version = '2';
      let storyWrapper = {
        story: story
      };
      editableStoryBackendApiService.updateStory(
        story.id, story.version, 'Title is updated', []
      ).then(successHandler, failHandler);

      req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('PUT');
      req.flush(storyWrapper);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(story);
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should use the rejection handler if the story to update doesn\'t exist',
    fakeAsync(() => {
      // Loading a story the first time should fetch it from the backend.
      editableStoryBackendApiService.updateStory(
        'storyId_1', 1, 'Update an invalid Story.', []
      ).then(successHandler, failHandler);
      const requestUrl = '/story_editor_handler/data/storyId_1';
      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('PUT');
      req.flush(
        {error: 'Story with given id doesn\'t exist.'},
        {status: 400, statusText: ''}
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Story with given id doesn\'t exist.');
    }));

  it('should publish a story', fakeAsync(() => {
    // Send a request to update story.
    editableStoryBackendApiService.changeStoryPublicationStatus(
      'storyId', true
    ).then(successHandler, failHandler);

    const requestUrl = '/story_publish_handler/storyId';
    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('PUT');
    req.flush({});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler if the story to publish doesn\'t exist',
    fakeAsync(() => {
      // Loading a story the first time should fetch it from the backend.
      editableStoryBackendApiService.changeStoryPublicationStatus(
        'storyId_1', true).then(successHandler, failHandler);

      const requestUrl = '/story_publish_handler/storyId_1';
      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('PUT');
      req.flush(
        {error: 'Story with given id doesn\'t exist.'},
        {status: 404, statusText: ''}
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Story with given id doesn\'t exist.');
    }));
});
