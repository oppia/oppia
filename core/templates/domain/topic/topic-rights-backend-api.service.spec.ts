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
 * @fileoverview Unit tests for TopicRightsBackendApiService.
 */

import { TranslatorProviderForTests } from 'tests/test.extras';

import { TopicRightsBackendApiService } from
  'domain/topic/topic-rights-backend-api.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

describe('Topic rights backend API service', () => {
  let topicRightsBackendApiService: TopicRightsBackendApiService = null;
  let csrfService: CsrfTokenService = null;
  let topicId: string = '0';
  let httpTestingController: HttpTestingController = null;

  beforeEach(
    angular.mock.module('oppia', TranslatorProviderForTests));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    topicRightsBackendApiService = TestBed.get(TopicRightsBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    csrfService = TestBed.get(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return new Promise((resolve) => {
        resolve('sample-csrf-token');
      });
    });
  });

  afterEach(function() {
    httpTestingController.verify();
  });

  it('should fetch a topic rights', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    topicRightsBackendApiService.fetchTopicRights(topicId).then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/rightshandler/get_topic_rights/' + topicId);
    expect(req.request.method).toEqual('GET');
    req.flush({
      topic_id: 0,
      topic_is_published: true,
      manager_ids: ['user_id']
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should not fetch a topic rights', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    topicRightsBackendApiService.fetchTopicRights(topicId).then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/rightshandler/get_topic_rights/' + topicId);
    expect(req.request.method).toEqual('GET');
    req.flush('Error fetching topic rights', {
      status: 404,
      statusText: 'Error fetching topic rights'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should successfully publish and unpublish a topic', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    topicRightsBackendApiService.publishTopic(topicId).then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/rightshandler/change_topic_status/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(200);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();

    topicRightsBackendApiService.unpublishTopic(topicId).then(
      successHandler, failHandler);
    let req2 = httpTestingController.expectOne(
      '/rightshandler/change_topic_status/0');
    expect(req2.request.method).toEqual('PUT');
    req2.flush(200);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should call the provided fail handler on HTTP failure', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    topicRightsBackendApiService.publishTopic(topicId).then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/rightshandler/change_topic_status/0');
    expect(req.request.method).toEqual('PUT');
    req.flush('Topic doesn\'t not exist.', {
      status: 404,
      statusText: 'Topic doesn\'t not exist.'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));


  it('should send a topic rights mail', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    topicRightsBackendApiService.sendMail(topicId, '').then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/rightshandler/send_topic_publish_mail/' + topicId);
    expect(req.request.method).toEqual('PUT');
    req.flush(200);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handler error on sending topic rights mail', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    topicRightsBackendApiService.sendMail(topicId, '').then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/rightshandler/send_topic_publish_mail/' + topicId);
    expect(req.request.method).toEqual('PUT');
    req.flush('Error sending topic rights mail', {
      status: 404,
      statusText: 'Error sending topic rights mail'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));
});
