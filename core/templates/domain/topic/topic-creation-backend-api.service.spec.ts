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

import {HttpErrorResponse} from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks, tick} from '@angular/core/testing';

import {CsrfTokenService} from 'services/csrf-token.service';
import {ImageData} from 'domain/skill/skill-creation-backend-api.service';
import {NewlyCreatedTopic} from 'domain/topics_and_skills_dashboard/newly-created-topic.model';
import {TopicCreationBackendApiService} from 'domain/topic/topic-creation-backend-api.service';

describe('Topic creation backend api service', () => {
  let csrfService: CsrfTokenService;
  let httpTestingController: HttpTestingController;
  let topicCreationBackendApiService: TopicCreationBackendApiService;
  let topic: NewlyCreatedTopic;
  let imagesData: ImageData[];
  const thumbnailBgColor = '#e3e3e3';
  let postData = {
    name: 'topic-name',
    description: 'Description',
    thumbnailBgColor: thumbnailBgColor,
    filename: 'image.svg',
    url_fragment: 'url-fragment',
    page_title_fragment: 'page_title_fragment',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TopicCreationBackendApiService],
    });

    csrfService = TestBed.get(CsrfTokenService);
    httpTestingController = TestBed.get(HttpTestingController);
    topicCreationBackendApiService = TestBed.get(
      TopicCreationBackendApiService
    );
    topic = NewlyCreatedTopic.createDefault();
    topic.name = 'topic-name';
    topic.description = 'Description';
    topic.urlFragment = 'url-fragment';
    topic.pageTitleFragment = 'page_title_fragment';
    let imageBlob = new Blob(['data:image/png;base64,xyz']);
    imagesData = [
      {
        filename: 'image.svg',
        imageBlob: imageBlob,
      },
    ];

    // This throws "Argument of type '() -> Promise<unknown>'
    // is not assignable to parameter of type 'PromiseLike<string>'.".
    // We need to suppress this error because we need to mock the
    // `getTokenAsync` function for testing purposes.
    // @ts-expect-error
    spyOn(csrfService, 'getTokenAsync').and.returnValue(async () => {
      return new Promise(resolve => {
        resolve('sample-csrf-token');
      });
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully create a new topic and obtain the skill ID', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    topicCreationBackendApiService
      .createTopicAsync(topic, imagesData, thumbnailBgColor)
      .then(successHandler);
    let req = httpTestingController.expectOne(
      '/topic_editor_handler/create_new'
    );
    expect(req.request.method).toEqual('POST');

    expect(req.request.body.get('payload')).toEqual(JSON.stringify(postData));
    let sampleFormData = new FormData();
    sampleFormData.append('image', imagesData[0].imageBlob as Blob);
    expect(req.request.body.get('image')).toEqual(sampleFormData.get('image'));
    req.flush(postData);
    flushMicrotasks();
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to create a new topic and call the fail handler', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    topicCreationBackendApiService
      .createTopicAsync(topic, imagesData, thumbnailBgColor)
      .then(successHandler, failHandler);
    const errorResponse = new HttpErrorResponse({
      error: 'test 404 error',
      status: 404,
      statusText: 'Not Found',
    });
    let req = httpTestingController.expectOne(
      '/topic_editor_handler/create_new'
    );
    req.error(new ErrorEvent('Error'), errorResponse);
    expect(req.request.method).toEqual('POST');
    expect(req.request.body.get('payload')).toEqual(JSON.stringify(postData));
    let sampleFormData = new FormData();
    sampleFormData.append('image', imagesData[0].imageBlob as Blob);
    expect(req.request.body.get('image')).toEqual(sampleFormData.get('image'));
    flushMicrotasks();
    expect(failHandler).toHaveBeenCalled();
    expect(successHandler).not.toHaveBeenCalled();
  }));

  it('should throw an error if image blob is null', fakeAsync(() => {
    imagesData = [
      {
        filename: 'image.svg',
        imageBlob: null,
      },
    ];
    let successHandler = jasmine.createSpy('success');
    expect(function () {
      topicCreationBackendApiService
        .createTopicAsync(topic, imagesData, thumbnailBgColor)
        .then(successHandler);
      tick();
    }).toThrowError();
  }));
});
