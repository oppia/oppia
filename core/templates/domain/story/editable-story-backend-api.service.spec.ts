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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {
  EditableStoryBackendApiService,
  FetchStoryBackendResponse,
} from 'domain/story/editable-story-backend-api.service';
import {CsrfTokenService} from 'services/csrf-token.service';

describe('Editable story backend API service', () => {
  let editableStoryBackendApiService: EditableStoryBackendApiService;
  let sampleDataResults: FetchStoryBackendResponse;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;
  // Sample story object returnable from the backend.

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditableStoryBackendApiService],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    editableStoryBackendApiService = TestBed.inject(
      EditableStoryBackendApiService
    );
    csrfService = TestBed.inject(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(async () => {
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
          nodes: [
            {
              id: 'node_1',
              title: 'node 1',
              description: '',
              prerequisite_skill_ids: [],
              acquired_skill_ids: [],
              destination_node_ids: [],
              outline: 'Outline',
              exploration_id: 'exp_id',
              outline_is_finalized: false,
              thumbnail_bg_color: '#a33f40',
              thumbnail_filename: 'img.png',
              status: 'Published',
              planned_publication_date_msecs: 100.0,
              last_modified_msecs: 100.0,
              first_publication_date_msecs: 200.0,
              unpublishing_reason: null,
            },
          ],
          next_node_id: 'node_3',
        },
        language_code: 'en',
        corresponding_topic_id: 'topic_id',
        thumbnail_filename: 'img.png',
        thumbnail_bg_color: '#a33f40',
        url_fragment: 'story-title',
        meta_tag_content: 'story meta tag content',
      },
      topic_name: 'Topic Name',
      story_is_published: true,
      skill_summaries: [
        {
          id: 'skill_1',
          description: 'Skill Description',
          language_code: 'en',
          version: 1,
          misconception_count: 1,
          worked_examples_count: 1,
          skill_model_created_on: 1,
          skill_model_last_updated: 1,
        },
      ],
      topic_url_fragment: 'topic-frag',
      classroom_url_fragment: 'math',
    };
  });
  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing story from the backend', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    editableStoryBackendApiService
      .fetchStoryAsync('storyId')
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/story_editor_handler/data/storyId'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({
      story: sampleDataResults.story,
      topicName: sampleDataResults.topic_name,
      storyIsPublished: true,
      skillSummaries: sampleDataResults.skill_summaries,
      topicUrlFragment: sampleDataResults.topic_url_fragment,
      classroomUrlFragment: sampleDataResults.classroom_url_fragment,
    });
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully delete a story from the backend', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    editableStoryBackendApiService
      .deleteStoryAsync('storyId')
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/story_editor_handler/data/storyId'
    );
    expect(req.request.method).toEqual('DELETE');
    req.flush(200);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should not delete a story from the backend if ' +
      'the story Id does not exist',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');
      editableStoryBackendApiService
        .deleteStoryAsync('not_valid_id')
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/story_editor_handler/data/not_valid_id'
      );

      expect(req.request.method).toEqual('DELETE');
      req.flush(
        {error: "Story with given id doesn't exist."},
        {
          status: 404,
          statusText: "Story with given id doesn't exist.",
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        "Story with given id doesn't exist."
      );
    })
  );

  it('should use the rejection handler if the backend request failed', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    editableStoryBackendApiService
      .fetchStoryAsync('2')
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/story_editor_handler/data/2');
    expect(req.request.method).toEqual('GET');
    req.flush(
      {error: 'Error loading story 2.'},
      {
        status: 500,
        statusText: 'Error loading story 2.',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading story 2.');
  }));
  it('should update a story after fetching it from the backend', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');
    var story: {id: string; title: string; version: number} = {
      id: '',
      title: '',
      version: 0,
    };

    // Loading a story the first time should fetch it from the backend.
    editableStoryBackendApiService.fetchStoryAsync('storyId').then(
      // eslint-disable-next-line
      (data: any) => {
        story = data.story;
      }
    );
    let req = httpTestingController.expectOne(
      '/story_editor_handler/data/storyId'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    story.title = 'New Title';
    story.version = 2;
    var storyWrapper = {
      story: story,
    };

    // Send a request to update story.
    editableStoryBackendApiService
      .updateStoryAsync(story.id, story.version, 'Title is updated', [])
      .then(successHandler, failHandler);
    req = httpTestingController.expectOne('/story_editor_handler/data/storyId');
    expect(req.request.method).toEqual('PUT');
    req.flush(storyWrapper);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(story);
    expect(failHandler).not.toHaveBeenCalled();
  }));
  it("should use the rejection handler if the story to update doesn't exist", fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    // Loading a story the first time should fetch it from the backend.
    editableStoryBackendApiService
      .updateStoryAsync('storyId_1', 1, 'Update an invalid Story.', [])
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/story_editor_handler/data/storyId_1'
    );
    expect(req.request.method).toEqual('PUT');
    req.flush(
      {error: "Story with given id doesn't exist."},
      {
        status: 404,
        statusText: "Story with given id doesn't exist.",
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      "Story with given id doesn't exist."
    );
  }));
  it('should publish a story', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    // Send a request to update story.
    editableStoryBackendApiService
      .changeStoryPublicationStatusAsync('storyId', true)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/story_publish_handler/storyId');
    expect(req.request.method).toEqual('PUT');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should call success handler if the story is associated ' +
      'with given url fragment',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      editableStoryBackendApiService
        .doesStoryWithUrlFragmentExistAsync('url_fragment')
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/story_url_fragment_handler/url_fragment'
      );
      expect(req.request.method).toEqual('GET');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should call rejection handler if the story is not associated ' +
      'with given url fragment',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      editableStoryBackendApiService
        .doesStoryWithUrlFragmentExistAsync('url_fragment')
        .then(successHandler, error => failHandler(error.statusText));
      let req = httpTestingController.expectOne(
        '/story_url_fragment_handler/url_fragment'
      );
      expect(req.request.method).toEqual('GET');
      req.flush(
        {error: "Story with given url fragment doesn't exist."},
        {
          status: 404,
          statusText: "Story with given url fragment doesn't exist.",
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalledWith();
      expect(failHandler).toHaveBeenCalledWith(
        "Story with given url fragment doesn't exist."
      );
    })
  );

  it(
    'should call success handler if the exploration ' +
      'is validated with no errors',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      editableStoryBackendApiService
        .validateExplorationsAsync('storyId', ['expId1', 'expId2'])
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/validate_story_explorations/storyId?' +
          'comma_separated_exp_ids=expId1,expId2'
      );
      expect(req.request.method).toEqual('GET');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should call rejection handler if the exploration ' +
      'has validation errors',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      editableStoryBackendApiService
        .validateExplorationsAsync('not_valid', ['expId1', 'expId2'])
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/validate_story_explorations/not_valid?' +
          'comma_separated_exp_ids=expId1,expId2'
      );
      expect(req.request.method).toEqual('GET');
      req.flush(
        {error: 'Story has validation errors.'},
        {
          status: 404,
          statusText: 'Story has validation errors.',
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Story has validation errors.');
    })
  );

  it("should use the rejection handler if the story to publish doesn't exist", fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    // Loading a story the first time should fetch it from the backend.
    editableStoryBackendApiService
      .changeStoryPublicationStatusAsync('storyId', true)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/story_publish_handler/storyId');
    expect(req.request.method).toEqual('PUT');
    req.flush(
      {error: "Story with given id doesn't exist."},
      {
        status: 404,
        statusText: "Story with given id doesn't exist.",
      }
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      "Story with given id doesn't exist."
    );
  }));
});
