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
 * @fileoverview Unit test for TopicCreationBackendApiService.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController }
  from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { CsrfTokenService } from 'services/csrf-token.service';
import { IImageData } from 'domain/skill/skill-creation-backend-api.service';
import { NewlyCreatedTopic, NewlyCreatedTopicObjectFactory } from
  'domain/topics_and_skills_dashboard/NewlyCreatedTopicObjectFactory';
import { TopicCreationBackendApiService, ITopicCreationBackend } from
  'domain/topic/topic-creation-backend-api.service.ts';

describe('Topic creation backend api service', () => {
  let csrfService: CsrfTokenService = null;
  let httpTestingController: HttpTestingController = null;
  let topicCreationBackendApiService: TopicCreationBackendApiService = null;
  let newlyCreatedTopicObjectFactory: NewlyCreatedTopicObjectFactory = null;
  let topic: NewlyCreatedTopic = null;
  let imagesData: IImageData[] = null;
  const thumbnailBgColor = '#e3e3e3';
  let postData: ITopicCreationBackend = {
    name: 'topic-name',
    description: 'Description',
    thumbnailBgColor: thumbnailBgColor,
    filename: 'image.svg',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TopicCreationBackendApiService]
    });

    csrfService = TestBed.get(CsrfTokenService);
    httpTestingController = TestBed.get(HttpTestingController);
    newlyCreatedTopicObjectFactory = TestBed.get(
      NewlyCreatedTopicObjectFactory);
    topicCreationBackendApiService = TestBed.get(
      TopicCreationBackendApiService);
    topic = newlyCreatedTopicObjectFactory.createDefault();
    topic.name = 'topic-name';
    topic.description = 'Description';
    let imageBlob = new Blob(
      ['data:image/png;base64,xyz']);
    imagesData = [{
      filename: 'image.svg',
      imageBlob: imageBlob
    }];
    spyOn(csrfService, 'getTokenAsync').and.returnValue(() => {
      return new Promise((resolve) => {
        resolve('sample-csrf-token');
      });
    });
  });

  afterEach(()=> {
    httpTestingController.verify();
  });

  it('should successfully create a new topic and obtain the skill ID',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      topicCreationBackendApiService.createTopic(
        topic, imagesData, thumbnailBgColor).then(
        successHandler);
      let req = httpTestingController.expectOne(
        '/topic_editor_handler/create_new');
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

  it('should fail to create a new topic and call the fail handler',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      topicCreationBackendApiService.createTopic(
        topic, imagesData, thumbnailBgColor).then(
        successHandler, failHandler);
      const errorResponse = new HttpErrorResponse({
        error: 'test 404 error',
        status: 404,
        statusText: 'Not Found'
      });
      let req = httpTestingController.expectOne(
        '/topic_editor_handler/create_new');
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
