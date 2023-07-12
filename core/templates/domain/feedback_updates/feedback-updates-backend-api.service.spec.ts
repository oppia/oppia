// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for FeedbackUpdatesBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { AddMessagePayload, FeedbackUpdatesBackendApiService } from
  'domain/feedback_updates/feedback-updates-backend-api.service';


describe('Feedback Updates Backend API Service', () => {
  let feedbackUpdatesBackendApiService:
  FeedbackUpdatesBackendApiService;
  let httpTestingController: HttpTestingController;

  const sampleFeedbackUpdatesDataResults = {
    number_of_unread_threads: 0,
    thread_summaries: [
      {
        status: 'open',
        author_second_last_message: null,
        exploration_id: 'JctD1Xvtg1eC',
        last_message_is_read: true,
        thread_id:
          'exploration.JctD1Xvtg1eC.WzE1OTIyMjMzMDM3ODMuMTldWzEyOTk3XQ==',
        author_last_message: 'nishantwrp',
        last_updated_msecs: 1592223304062.665,
        last_message_text: '',
        original_author_id: 'uid_oijrdjajpkgegqmqqttxsxbbiobexugg',
        exploration_title: 'What is a negative number?',
        second_last_message_is_read: false,
        total_message_count: 1
      }
    ]
  };

  const FEEDBACK_UPDATES_DATA_URL = (
    '/feedbackupdateshandler/data');
  const ERROR_STATUS_CODE = 400;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FeedbackUpdatesBackendApiService]
    });
    feedbackUpdatesBackendApiService = TestBed.get(
      FeedbackUpdatesBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch learner dashboard feedback updates data ' +
    'from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    feedbackUpdatesBackendApiService
      .fetchFeedbackUpdatesDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      FEEDBACK_UPDATES_DATA_URL);
    expect(req.request.method).toEqual('POST');
    req.flush(sampleFeedbackUpdatesDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));


  it('should use rejection handler if learner dashboard feedback updates ' +
    'data backend request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    feedbackUpdatesBackendApiService
      .fetchFeedbackUpdatesDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      FEEDBACK_UPDATES_DATA_URL);
    expect(req.request.method).toEqual('POST');
    req.flush({
      error: 'Error loading dashboard data.'
    }, {
      status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(400);
  }
  ));


  it('should add current message to the feedback updates thread' +
    ' when calling addNewMessageAsync', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let updatedStatus = true;
    let updatedSubject = 'Updated Subject';
    let text = 'Sending message';
    let url = '/threadhandler/exploration.4.Wfafsafd';
    let payload: AddMessagePayload = {
      updated_status: updatedStatus,
      updated_subject: updatedSubject,
      text: text
    };

    feedbackUpdatesBackendApiService.addNewMessageAsync(
      url, payload
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/threadhandler/exploration.4.Wfafsafd');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));


  it('should fail to add current message to the feedback updates thread' +
    ' when calling addNewMessageAsync', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let updatedStatus = true;
    let updatedSubject = 'Updated Subject';
    let text = 'Sending message';
    let invalidUrl = '/invalidUrl';
    let payload: AddMessagePayload = {
      updated_status: updatedStatus,
      updated_subject: updatedSubject,
      text: text
    };
    feedbackUpdatesBackendApiService.addNewMessageAsync(
      invalidUrl, payload
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/invalidUrl');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { error: 'Given URL is invalid.'},
      { status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Given URL is invalid.');
  }
  ));

  it('should get the data of current feedback updates thread' +
    ' when calling addNewMessageAsync', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let url = '/threadhandler/exploration.4.Wfafsafd';
    let result = [{
      author_username: 'User',
      created_on_msecs: 1617712024611.706,
      message_id: 1,
      text: 'test',
      updated_status: null
    }];

    feedbackUpdatesBackendApiService.onClickThreadAsync(
      url
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/threadhandler/exploration.4.Wfafsafd');
    expect(req.request.method).toEqual('GET');

    req.flush(
      {
        message_summary_list: [{
          author_username: 'User',
          created_on_msecs: 1617712024611.706,
          message_id: 1,
          text: 'test',
          updated_status: null
        }]
      },
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(result);
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to get the data of current feedback updates thread' +
    ' when calling addNewMessageAsync', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let invalidUrl = '/invalidUrl';
    feedbackUpdatesBackendApiService.onClickThreadAsync(
      invalidUrl
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/invalidUrl');
    expect(req.request.method).toEqual('GET');

    req.flush(
      { error: 'Given URL is invalid.'},
      { status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Given URL is invalid.');
  }
  ));
});
