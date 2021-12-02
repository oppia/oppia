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
 * @fileoverview Unit test for TopicCreationBackendApiService.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController }
  from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { CsrfTokenService } from 'services/csrf-token.service';
import { ImageData } from 'domain/skill/skill-creation-backend-api.service';
import { NewlyCreatedStory } from 'domain/topic/newly-created-story.model';
import { StoryCreationBackendApiService } from './story-creation-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

class MockUrlInterpolationService {
  interpolateUrl(): string {
    return '/story_editor_handler/create_new';
  }
}

describe('Story creation backend api service', () => {
  let csrfService: CsrfTokenService;
  let httpTestingController: HttpTestingController;
  let storyCreationBackendApiService: StoryCreationBackendApiService;
  let story: NewlyCreatedStory;
  let imagesData: ImageData[];
  const thumbnailBgColor = '#e3e3e3';
  let postData = {
    title: 'story-title',
    description: 'description',
    story_url_fragment: 'url-fragment',
    thumbnailBgColor: thumbnailBgColor,
    filename: 'image.svg',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService
        },
        StoryCreationBackendApiService
      ]
    });

    csrfService = TestBed.inject(CsrfTokenService);
    httpTestingController = TestBed.inject(HttpTestingController);
    storyCreationBackendApiService = TestBed.inject(
      StoryCreationBackendApiService);
    story = NewlyCreatedStory.createDefault();
    story.title = 'story-title';
    story.description = 'description';
    story.urlFragment = 'url-fragment';
    let imageBlob = new Blob(
      ['data:image/png;base64,xyz']);
    imagesData = [{
      filename: 'image.svg',
      imageBlob: imageBlob
    }];
  });

  afterEach(()=> {
    httpTestingController.verify();
  });

  it('should successfully create a new story',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      storyCreationBackendApiService.createStoryAsync(
        story, imagesData, thumbnailBgColor).then(
        successHandler);
      let req = httpTestingController.expectOne(
        '/story_editor_handler/create_new');
      expect(req.request.method).toEqual('POST');

      expect(req.request.body.get('payload')).toEqual(JSON.stringify(postData));
      let sampleFormData = new FormData();
      sampleFormData.append('image', imagesData[0].imageBlob);
      expect(
        req.request.body.get('image')).toEqual(sampleFormData.get('image'));
      req.flush(postData);
      flushMicrotasks();
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should fail to create a new story and call the fail handler',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      storyCreationBackendApiService.createStoryAsync(
        story, imagesData, thumbnailBgColor).then(
        successHandler, failHandler);
      const errorResponse = new HttpErrorResponse({
        error: 'test 404 error',
        status: 404,
        statusText: 'Not Found'
      });
      let req = httpTestingController.expectOne(
        '/story_editor_handler/create_new');
      req.error(new ErrorEvent('Error'), errorResponse);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body.get('payload')).toEqual(JSON.stringify(postData));
      let sampleFormData = new FormData();
      sampleFormData.append('image', imagesData[0].imageBlob);
      expect(
        req.request.body.get('image')).toEqual(sampleFormData.get('image'));
      flushMicrotasks();
      expect(failHandler).toHaveBeenCalled();
      expect(successHandler).not.toHaveBeenCalled();
    }));
});
