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
 * @fileoverview Unit tests for StoryViewerBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { StoryPlaythroughObjectFactory } from
  'domain/story_viewer/StoryPlaythroughObjectFactory';
import { StoryViewerBackendApiService } from
  'domain/story_viewer/story-viewer-backend-api.service';

describe('Story viewer backend API service', () => {
  let storyViewerBackendApiService: StoryViewerBackendApiService = null;
  let storyPlaythroughObjectFactory: StoryPlaythroughObjectFactory = null;
  let httpTestingController: HttpTestingController;

  let sampleDataResults = {
    story_id: 'qwerty',
    story_title: 'Story title',
    story_description: 'Story description',
    story_nodes: [],
    topic_name: 'Topic name'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    storyViewerBackendApiService = TestBed.get(StoryViewerBackendApiService);
    storyPlaythroughObjectFactory = TestBed.get(StoryPlaythroughObjectFactory);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing story from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      storyViewerBackendApiService.fetchStoryData(
        'abbrev', 'staging', '0').then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/story_data_handler/staging/abbrev/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        storyPlaythroughObjectFactory.createFromBackendDict(
          sampleDataResults));
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
