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
 * @fileoverview Unit tests for TopicRightsBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { TopicRightsBackendApiService } from
  'domain/topic/topic-rights-backend-api.service';
import { CsrfTokenService } from 'services/csrf-token.service';

describe('Topic rights backend API service', () => {
  let topicRightsBackendApiService: TopicRightsBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;

  let topicId = '0';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    topicRightsBackendApiService = TestBed.inject(TopicRightsBackendApiService);

    csrfService = TestBed.inject(CsrfTokenService);
    httpTestingController = TestBed.inject(HttpTestingController);

    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');

    spyOn(csrfService, 'getTokenAsync').and.callFake(async() => {
      return Promise.resolve('simple-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch a topic rights', fakeAsync(() => {
    topicRightsBackendApiService.fetchTopicRightsAsync(topicId).then(
      successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/rightshandler/get_topic_rights/' + topicId);
    expect(req.request.method).toEqual('GET');
    req.flush({}, {status: 200, statusText: ''});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should not fetch a topic rights', fakeAsync(() => {
    topicRightsBackendApiService.fetchTopicRightsAsync(topicId).then(
      successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/rightshandler/get_topic_rights/' + topicId);
    expect(req.request.method).toEqual('GET');
    req.flush({}, {status: 404, statusText: ''});

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should successfully publish and unpublish a topic', fakeAsync(() => {
    topicRightsBackendApiService.publishTopicAsync(topicId).then(
      successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/rightshandler/change_topic_status/0');
    expect(req.request.method).toEqual('PUT');
    req.flush({}, {status: 200, statusText: ''});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();

    topicRightsBackendApiService.unpublishTopicAsync(topicId).then(
      successHandler, failHandler);

    req = httpTestingController.expectOne(
      '/rightshandler/change_topic_status/0');
    expect(req.request.method).toEqual('PUT');
    req.flush({}, {status: 200, statusText: ''});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should call the provided fail handler on HTTP failure', fakeAsync(() => {
    topicRightsBackendApiService.publishTopicAsync(topicId).then(
      successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/rightshandler/change_topic_status/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(
      {error: 'Topic doesn\'t not exist.'},
      {status: 404, statusText: ''}
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should report an uncached topic rights after caching it',
    fakeAsync(() => {
      // The topic should not currently be cached.
      expect(topicRightsBackendApiService.isCached(topicId)).toBeFalse();

      // A new topic should be fetched from the backend. Also,
      // the returned topic should match the expected topic object.
      topicRightsBackendApiService.loadTopicRightsAsync(topicId).then(
        successHandler, failHandler);

      const req = httpTestingController.expectOne(
        '/rightshandler/get_topic_rights/0');
      expect(req.request.method).toEqual('GET');
      req.flush({
        topic_id: '0',
        topic_is_published: true,
        manager_ids: ['user_id']
      }, {status: 200, statusText: ''});

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
      // It should now be cached.
      expect(topicRightsBackendApiService.isCached(topicId)).toBeTrue();
    }));

  it('should report a cached topic rights after caching it', fakeAsync(() => {
    // The topic should not currently be cached.
    expect(topicRightsBackendApiService.isCached(topicId)).toBeFalse();

    // Cache a topic rights object.
    topicRightsBackendApiService.cacheTopicRights(topicId, {
      topic_id: '0',
      topic_is_published: true,
      manager_ids: ['user_id']
    });

    // It should now be cached.
    expect(topicRightsBackendApiService.isCached(topicId)).toBeTrue();

    // A new topic should not have been fetched from the backend. Also,
    // the returned topic should match the expected topic object.
    topicRightsBackendApiService.loadTopicRightsAsync(topicId).then(
      successHandler, failHandler);

    // http://brianmcd.com/2014/03/27/a-tip-for-angular-unit-tests-with-promises.html
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({
      topic_id: '0',
      topic_is_published: true,
      manager_ids: ['user_id']
    });
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should send a topic rights mail', fakeAsync(() => {
    topicRightsBackendApiService.sendMailAsync(topicId, 'dummyTopic').then(
      successHandler, failHandler);
    const req = httpTestingController.expectOne(
      '/rightshandler/send_topic_publish_mail/' + topicId);
    expect(req.request.method).toEqual('PUT');
    req.flush({}, {status: 200, statusText: ''});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handler error on sending topic rights mail', fakeAsync(() => {
    topicRightsBackendApiService.sendMailAsync(topicId, 'dummyTopic').then(
      successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/rightshandler/send_topic_publish_mail/' + topicId);
    expect(req.request.method).toEqual('PUT');
    req.flush({}, {status: 404, statusText: ''});

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));
});
