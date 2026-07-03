// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for FeedbackBackendApiService.
 */

import {HttpErrorResponse} from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';

import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {
  SendALessonFeedbackModel,
  IssueReportModel,
} from 'domain/feedback/feedback.model';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {throwError} from 'rxjs';

describe('Feedback backend api service', () => {
  let feedbackBackendApiService: FeedbackBackendApiService;
  let httpTestingController: HttpTestingController;
  let imageLocalStorageService: ImageLocalStorageService;
  let imageUploadHelperService: ImageUploadHelperService;

  const sendALessonFeedbackPayload =
    SendALessonFeedbackModel.createForSubmission({
      feedbackText: 'Hello',
      exploration_context: {
        explorationId: 'test',
        explorationVersion: 1,
        stateName: 'intro',
        stateIndex: 1,
        learnerCurrentAnswer: 'test',
      },
    });

  const issueReportPayload = IssueReportModel.createForSubmission({
    source: 'lesson',
    reportMessage: 'text',
    explorationContext: {
      explorationId: 'test',
      explorationVersion: 1,
      stateName: 'intro',
      stateIndex: 1,
      learnerCurrentAnswer: 'test',
    },
    category: 'broken_layout_or_image',
    includeTechnicalLogs: false,
    sessionInfo: null,
    screenshotFilename: null,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    feedbackBackendApiService = TestBed.inject(FeedbackBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    imageUploadHelperService = TestBed.inject(ImageUploadHelperService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch captcha config', fakeAsync(() => {
    const onSuccess = jasmine.createSpy('onSuccess');

    feedbackBackendApiService.fetchCaptchaConfigAsync().then(onSuccess);

    const req = httpTestingController.expectOne(
      '/feedback_captcha_config_handler'
    );
    expect(req.request.method).toEqual('GET');
    req.flush({site_key: 'site_key'});
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith({site_key: 'site_key'});
  }));

  it('should return empty screenshot data when no screenshot is staged', fakeAsync(() => {
    const onSuccess = jasmine.createSpy('onSuccess');

    feedbackBackendApiService
      .getStagedScreenshotSubmissionDataAsync(null)
      .then(onSuccess);
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith({
      screenshotFilename: null,
      screenshotFile: null,
    });
  }));

  it('should serialize a staged screenshot from local storage', fakeAsync(() => {
    const imageBlob = new Blob(['image-data'], {type: 'image/png'});
    spyOn(imageLocalStorageService, 'getRawImageData').and.returnValue(
      'data:image/png;base64,aW1hZ2UtZGF0YQ=='
    );
    spyOn(
      imageUploadHelperService,
      'convertImageDataToImageFile'
    ).and.returnValue(imageBlob);
    spyOn(
      imageLocalStorageService,
      'getFilenameToBase64MappingAsync'
    ).and.resolveTo({
      'reply.png': 'aW1hZ2UtZGF0YQ==',
    });
    const onSuccess = jasmine.createSpy('onSuccess');

    feedbackBackendApiService
      .getStagedScreenshotSubmissionDataAsync('reply.png')
      .then(onSuccess);
    flushMicrotasks();

    expect(imageLocalStorageService.getRawImageData).toHaveBeenCalledWith(
      'reply.png'
    );
    expect(
      imageUploadHelperService.convertImageDataToImageFile
    ).toHaveBeenCalledWith('data:image/png;base64,aW1hZ2UtZGF0YQ==');
    expect(
      imageLocalStorageService.getFilenameToBase64MappingAsync
    ).toHaveBeenCalledWith([
      {
        filename: 'reply.png',
        imageBlob,
      },
    ]);
    expect(onSuccess).toHaveBeenCalledWith({
      screenshotFilename: 'reply.png',
      screenshotFile: {'reply.png': 'aW1hZ2UtZGF0YQ=='},
    });
  }));

  it('should reject if staged screenshot is missing from local storage', fakeAsync(() => {
    const onFailure = jasmine.createSpy('onFailure');
    spyOn(imageLocalStorageService, 'getRawImageData').and.returnValue(null);

    feedbackBackendApiService
      .getStagedScreenshotSubmissionDataAsync('missing.png')
      .catch(onFailure);
    flushMicrotasks();

    expect(onFailure).toHaveBeenCalledWith(
      new Error('No staged feedback screenshot found.')
    );
  }));

  it('should submit send a lesson feedback', fakeAsync(() => {
    const onSuccess = jasmine.createSpy('onSuccess');

    feedbackBackendApiService
      .submitLessonFeedbackAsync(sendALessonFeedbackPayload, null)
      .then(onSuccess);

    const req = httpTestingController.expectOne('/feedback');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(
      sendALessonFeedbackPayload.toBackendDict()
    );
    req.flush({id: 'thread_id'});
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith({id: 'thread_id'});
  }));

  it('should reject with http error when feedback submission fails', fakeAsync(() => {
    const onFailure = jasmine.createSpy('onFailure');

    feedbackBackendApiService
      .submitLessonFeedbackAsync(sendALessonFeedbackPayload, null)
      .catch(onFailure);

    const req = httpTestingController.expectOne('/feedback');
    req.flush(
      {error: 'Invalid feedback.'},
      {
        status: 400,
        statusText: 'Bad Request',
      }
    );
    flushMicrotasks();

    expect(
      onFailure.calls.mostRecent().args[0] instanceof HttpErrorResponse
    ).toBe(true);
  }));

  it('should rethrow non-http errors during feedback submission', fakeAsync(() => {
    const error = new Error('Unexpected error.');
    const serviceWithFailingHttp = new FeedbackBackendApiService(
      {
        post: () => throwError(error),
      } as never,
      imageLocalStorageService,
      imageUploadHelperService
    );
    const onFailure = jasmine.createSpy('onFailure');

    serviceWithFailingHttp
      .submitLessonFeedbackAsync(sendALessonFeedbackPayload, null)
      .catch(onFailure);
    flushMicrotasks();

    expect(onFailure).toHaveBeenCalledWith(error);
  }));

  it('should submit site and lesson issue report', fakeAsync(() => {
    const onSuccess = jasmine.createSpy('onSuccess');

    feedbackBackendApiService
      .submitSiteAndLessonIssueReportAsync(issueReportPayload, 'captcha-token')
      .then(onSuccess);
    flushMicrotasks();
    const req = httpTestingController.expectOne('/report');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({
      ...issueReportPayload.toBackendDict(),
      screenshot_file: null,
      captcha_token: 'captcha-token',
    });
    req.flush({id: 'thread_id'});
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith({id: 'thread_id'});
  }));

  it('should reject with http error when feedback submission fails', fakeAsync(() => {
    const onFailure = jasmine.createSpy('onFailure');

    feedbackBackendApiService
      .submitSiteAndLessonIssueReportAsync(issueReportPayload, 'captcha-token')
      .catch(onFailure);
    flushMicrotasks();

    const req = httpTestingController.expectOne('/report');
    req.flush(
      {error: 'Invalid feedback.'},
      {
        status: 400,
        statusText: 'Bad Request',
      }
    );
    flushMicrotasks();

    expect(
      onFailure.calls.mostRecent().args[0] instanceof HttpErrorResponse
    ).toBe(true);
  }));

  it('should rethrow non-http errors during feedback submission', fakeAsync(() => {
    const error = new Error('Unexpected error.');
    const serviceWithFailingHttp = new FeedbackBackendApiService(
      {
        post: () => throwError(error),
      } as never,
      imageLocalStorageService,
      imageUploadHelperService
    );
    const onFailure = jasmine.createSpy('onFailure');

    serviceWithFailingHttp
      .submitSiteAndLessonIssueReportAsync(issueReportPayload, null)
      .catch(onFailure);
    flushMicrotasks();

    expect(onFailure).toHaveBeenCalledWith(error);
  }));
});
