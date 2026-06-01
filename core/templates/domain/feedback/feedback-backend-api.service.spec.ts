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
  FeedbackListResponse,
  FeedbackSubmitPayload,
  FeedbackThreadDetail,
} from 'domain/feedback/feedback.model';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {throwError} from 'rxjs';

describe('Feedback backend api service', () => {
  let feedbackBackendApiService: FeedbackBackendApiService;
  let httpTestingController: HttpTestingController;
  let imageLocalStorageService: ImageLocalStorageService;
  let imageUploadHelperService: ImageUploadHelperService;

  const payload: FeedbackSubmitPayload = {
    category: 'platform',
    target_type: 'general',
    target_id: null,
    description: 'The page is broken.',
    page_url: 'https://www.oppia.org',
    language_code: 'en',
    rating: 4,
    screenshot_filename: null,
    submit_anonymously: false,
    include_session_info: false,
    session_info: null,
    captcha_token: null,
  };

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

  it('should submit feedback', fakeAsync(() => {
    const onSuccess = jasmine.createSpy('onSuccess');

    feedbackBackendApiService.submitFeedbackAsync(payload).then(onSuccess);

    const req = httpTestingController.expectOne('/give_general_feedback');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({thread_id: 'thread_id'});
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith({thread_id: 'thread_id'});
  }));

  it('should reject with http error when feedback submission fails', fakeAsync(() => {
    const onFailure = jasmine.createSpy('onFailure');

    feedbackBackendApiService.submitFeedbackAsync(payload).catch(onFailure);

    const req = httpTestingController.expectOne('/give_general_feedback');
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
    ).toBeTrue();
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

    serviceWithFailingHttp.submitFeedbackAsync(payload).catch(onFailure);
    flushMicrotasks();

    expect(onFailure).toHaveBeenCalledWith(error);
  }));

  it('should fetch feedback list for creator feedback tab', fakeAsync(() => {
    const response: FeedbackListResponse = {
      results: [
        {
          id: 'thread_1',
          category: 'lesson',
          description_preview: 'Problem with this lesson.',
          page_url: 'https://www.oppia.org/explore/exp123',
          status: 'open',
          created_on_msecs: 1000,
          rating: 3,
          has_screenshot: true,
          has_session_info: false,
        },
      ],
      cursor: 'next_cursor',
      more: true,
    };
    const onSuccess = jasmine.createSpy('onSuccess');

    feedbackBackendApiService
      .fetchCreatorFeedbackListAsync('exp123', 'cursor', 'open', 10, 20)
      .then(onSuccess);

    const req = httpTestingController.expectOne(
      request =>
        request.url === '/creator_feedback_handler/exp123' &&
        request.params.get('cursor') === 'cursor' &&
        request.params.get('status') === 'open' &&
        request.params.get('date_from_msecs') === '10' &&
        request.params.get('date_to_msecs') === '20'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(response);
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith(response);
  }));

  it('should omit unset filters when fetching creator feedback list', fakeAsync(() => {
    const response: FeedbackListResponse = {
      results: [],
      cursor: null,
      more: false,
    };
    const onSuccess = jasmine.createSpy('onSuccess');

    feedbackBackendApiService
      .fetchCreatorFeedbackListAsync('exp123', null, null, null, null)
      .then(onSuccess);

    const req = httpTestingController.expectOne(
      '/creator_feedback_handler/exp123'
    );
    expect(req.request.method).toEqual('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush(response);
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith(response);
  }));

  it('should fetch detailed feedback thread for creator feedback tab', fakeAsync(() => {
    const response: FeedbackThreadDetail = {
      id: 'thread_1',
      category: 'lesson',
      description: 'Problem with this lesson.',
      page_url: 'https://www.oppia.org/explore/exp123',
      language_code: 'en',
      status: 'open',
      created_on_msecs: 1000,
      rating: 3,
      target_type: 'exploration',
      target_id: 'exp123',
      user_id: 'user_id',
      session_info: null,
      can_edit_exploration: true,
      messages: [],
    };
    const onSuccess = jasmine.createSpy('onSuccess');

    feedbackBackendApiService
      .fetchCreatorFeedbackDetailAsync('exp123', 'thread_1')
      .then(onSuccess);

    const req = httpTestingController.expectOne(
      '/creator_feedback_handler/exp123/thread_1'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(response);
    flushMicrotasks();

    expect(onSuccess).toHaveBeenCalledWith(response);
  }));

  it('should add a creator message with status and screenshot', fakeAsync(() => {
    feedbackBackendApiService.addCreatorMessageAsync(
      'exp123',
      'thread_1',
      'Thanks for the report.',
      'fixed',
      {
        filename: 'reply.png',
        files: {
          'reply.png': 'aW1hZ2UtZGF0YQ==',
        },
      }
    );

    const req = httpTestingController.expectOne(
      '/creator_feedback_handler/exp123/thread_1'
    );
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      action: 'fixed',
      message: 'Thanks for the report.',
      screenshotFilename: 'reply.png',
      files: {
        'reply.png': 'aW1hZ2UtZGF0YQ==',
      },
    });
    req.flush(null);
    flushMicrotasks();
  }));

  it('should add a creator message with screenshot filename only', fakeAsync(() => {
    feedbackBackendApiService.addCreatorMessageAsync(
      'exp123',
      'thread_1',
      'Thanks for the report.',
      null,
      {
        filename: 'reply.png',
      }
    );

    const req = httpTestingController.expectOne(
      '/creator_feedback_handler/exp123/thread_1'
    );
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      action: null,
      message: 'Thanks for the report.',
      screenshotFilename: 'reply.png',
      files: null,
    });
    req.flush(null);
    flushMicrotasks();
  }));

  it('should add a creator status update without optional fields', fakeAsync(() => {
    feedbackBackendApiService.addCreatorMessageAsync(
      'exp123',
      'thread_1',
      null,
      'Compliment',
      null
    );

    const req = httpTestingController.expectOne(
      '/creator_feedback_handler/exp123/thread_1'
    );
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      action: 'Compliment',
      message: null,
      screenshotFilename: null,
      files: null,
    });
    req.flush(null);
    flushMicrotasks();
  }));

  it('should not add a creator update without optional fields', fakeAsync(() => {
    const onFailure = jasmine.createSpy('onFailure');

    feedbackBackendApiService
      .addCreatorMessageAsync('exp123', 'thread_1', null, null, null)
      .catch(onFailure);
    flushMicrotasks();

    expect(onFailure).toHaveBeenCalledWith(
      new Error(
        'At least one of message, status or screenshot must be provided.'
      )
    );
  }));
});
