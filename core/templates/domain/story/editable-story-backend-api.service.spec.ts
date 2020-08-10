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
 * @fileoverview Unit tests for EditableStoryBackendApiService.
 */

import { EditableStoryBackendApiService } from
  'domain/story/editable-story-backend-api.service';
import { CsrfTokenService } from 'services/csrf-token.service';

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from
  '@angular/core/testing';
export {};
class MockEditableStory extends EditableStoryBackendApiService {
  isAuthenticated() {
    return 'Mocked';
  }
}
describe('Editable story backend API service', () => {
  let editableStoryBackendApiService: EditableStoryBackendApiService = null;
  let sampleDataResults = null;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService = null;
  // Sample story object returnable from the backend.

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditableStoryBackendApiService]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    editableStoryBackendApiService = TestBed.get(
      EditableStoryBackendApiService
    );
    csrfService = TestBed.get(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('sample-csrf-token');
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
      }]
    };
  });
  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing story from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      editableStoryBackendApiService.fetchStory('storyId').then(
        successHandler, failHandler);
      var req = httpTestingController.expectOne(
        '/story_editor_handler/data/storyId');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        story: sampleDataResults.story,
        topic_name: sampleDataResults.topic_name,
        story_is_published: true,
        skill_summaries: sampleDataResults.skill_summaries
      });
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it('should successfully delete a story from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      editableStoryBackendApiService.deleteStory('storyId').then(
        successHandler, failHandler);
      var req = httpTestingController.expectOne(
        '/story_editor_handler/data/storyId');
      expect(req.request.method).toEqual('DELETE');
      req.flush(200);

      flushMicrotasks();
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));

  it('should use the rejection handler if the backend request failed',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      editableStoryBackendApiService.fetchStory('2').then(
        successHandler, failHandler);
      var req = httpTestingController.expectOne(
        '/story_editor_handler/data/2');
      expect(req.request.method).toEqual('GET');
      req.flush('Error loading story 2.', {
        status: 500,
        statusText: 'Error loading story 2.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading story 2.');
    }
    ));
  it('should update a story after fetching it from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');
      var story = null;

      // Loading a story the first time should fetch it from the backend.
      editableStoryBackendApiService.fetchStory('storyId').then(
        // eslint-disable-next-line
        (data: any) => {
          story = data.story;
        });
      var req = httpTestingController.expectOne(
        '/story_editor_handler/data/storyId');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      story.title = 'New Title';
      story.version = '2';
      var storyWrapper = {
        story: story
      };

      //  Var req = httpTestingController.expectOne(
      // '/story_editor_handler/data/storyId');
      // expect(req.request.method).toEqual('PUT');
      // req.flush(storyWrapper);
      // flushMicrotasks()

      // Send a request to update story.
      editableStoryBackendApiService.updateStory(
        story.id, story.version, 'Title is updated', []
      ).then(successHandler, failHandler);
      req = httpTestingController.expectOne(
        '/story_editor_handler/data/storyId');
      expect(req.request.method).toEqual('PUT');
      req.flush(storyWrapper);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(story);
      expect(failHandler).not.toHaveBeenCalled();
    }
    ));
  it('should use the rejection handler if the story to update doesn\'t exist',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a story the first time should fetch it from the backend.
      editableStoryBackendApiService.updateStory(
        'storyId_1', '1', 'Update an invalid Story.', []
      ).then(successHandler, failHandler);
      var req = httpTestingController.expectOne(
        '/story_editor_handler/data/storyId_1');
      expect(req.request.method).toEqual('PUT');
      req.flush('Story with given id doesn\'t exist.', {
        status: 404,
        statusText: 'Story with given id doesn\'t exist.'
      });

      flushMicrotasks();


      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Story with given id doesn\'t exist.');
    }
    ));
  it('should publish a story', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // Send a request to update story.
    editableStoryBackendApiService.changeStoryPublicationStatus(
      'storyId', true).then(successHandler, failHandler);
    var req = httpTestingController.expectOne(
      '/story_publish_handler/storyId');
    expect(req.request.method).toEqual('PUT');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler if the story to publish doesn\'t exist',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      // Loading a story the first time should fetch it from the backend.
      editableStoryBackendApiService.changeStoryPublicationStatus(
        'storyId', true).then(successHandler, failHandler);
      var req = httpTestingController.expectOne(
        '/story_publish_handler/storyId');
      expect(req.request.method).toEqual('PUT');
      req.flush('Story with given id doesn\'t exist.', {
        status: 404,
        statusText: 'Story with given id doesn\'t exist.'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Story with given id doesn\'t exist.');
    }
    ));
});
