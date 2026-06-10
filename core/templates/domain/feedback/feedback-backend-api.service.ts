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
 * @fileoverview Backend API service for web feedback submission and triage.
 */

import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {
  ImageLocalStorageService,
  ImagesData,
} from 'services/image-local-storage.service';
import {
  FeedbackCaptchaConfigResponse,
  FeedbackListResponse,
  FeedbackSubmitPayload,
  FeedbackSubmitResponse,
  FeedbackThreadDetail,
} from './feedback.model';

interface FeedbackScreenshotSubmissionData {
  screenshotFilename: string | null;
  screenshotFile: Record<string, string> | null;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackBackendApiService {
  private submitFeedbackUrl = '/give_general_feedback';
  private captchaConfigUrl = '/feedback_captcha_config_handler';
  private creatorFeedbackListUrl = '/creator_feedback_handler/<exploration_id>';
  private creatorFeedbackDetailUrl =
    '/creator_feedback_handler/<exploration_id>/<thread_id>';

  constructor(
    private http: HttpClient,
    private imageLocalStorageService: ImageLocalStorageService,
    private imageUploadHelperService: ImageUploadHelperService
  ) {}

  private getStagedScreenshotData(filename: string): ImagesData | null {
    const rawImageData =
      this.imageLocalStorageService.getRawImageData(filename);
    if (rawImageData === null) {
      return null;
    }
    return {
      filename,
      imageBlob:
        this.imageUploadHelperService.convertImageDataToImageFile(rawImageData),
    };
  }

  async fetchCaptchaConfigAsync(): Promise<FeedbackCaptchaConfigResponse> {
    return this.http
      .get<FeedbackCaptchaConfigResponse>(this.captchaConfigUrl)
      .toPromise();
  }

  async getStagedScreenshotSubmissionDataAsync(
    screenshotFilename: string | null
  ): Promise<FeedbackScreenshotSubmissionData> {
    if (screenshotFilename === null) {
      return {
        screenshotFilename: null,
        screenshotFile: null,
      };
    }
    const imageData = this.getStagedScreenshotData(screenshotFilename);
    if (imageData === null) {
      throw new Error('No staged feedback screenshot found.');
    }

    return {
      screenshotFilename,
      screenshotFile:
        await this.imageLocalStorageService.getFilenameToBase64MappingAsync([
          imageData,
        ]),
    };
  }

  // Feedback-submission-modal.

  async submitFeedbackAsync(
    payload: FeedbackSubmitPayload
  ): Promise<FeedbackSubmitResponse> {
    try {
      return await this.http
        .post<FeedbackSubmitResponse>(this.submitFeedbackUrl, payload)
        .toPromise();
      // We use unknown type because we are unsure of the type of error
      // that was thrown. Since the catch block cannot identify the
      // specific type of error, we are unable to further optimise the
      // code by introducing more types of errors.
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        return Promise.reject(error);
      }
      throw error;
    }
  }

  // Creator-feedback-tab.

  async fetchCreatorFeedbackListAsync(
    explorationId: string,
    cursor: string | null,
    status: string | null,
    dateFromMsecs: number | null,
    dateToMsecs: number | null
  ): Promise<FeedbackListResponse> {
    const params: {[key: string]: string} = {};
    if (cursor) {
      params.cursor = cursor;
    }
    if (status) {
      params.status = status;
    }
    if (dateFromMsecs !== null) {
      params.date_from_msecs = String(dateFromMsecs);
    }
    if (dateToMsecs !== null) {
      params.date_to_msecs = String(dateToMsecs);
    }
    const url = this.creatorFeedbackListUrl.replace(
      '<exploration_id>',
      explorationId
    );
    return this.http.get<FeedbackListResponse>(url, {params}).toPromise();
  }

  async fetchCreatorFeedbackDetailAsync(
    explorationId: string,
    threadId: string
  ): Promise<FeedbackThreadDetail> {
    const url = this.creatorFeedbackDetailUrl
      .replace('<exploration_id>', explorationId)
      .replace('<thread_id>', threadId);
    return this.http.get<FeedbackThreadDetail>(url).toPromise();
  }

  async addCreatorMessageAsync(
    explorationId: string,
    threadId: string,
    message: string | null = null,
    status: string | null = null,
    screenshot: {
      filename: string | null;
      files?: Record<string, string> | null;
    } | null = null
  ): Promise<void> {
    if (message === null && status === null && screenshot === null) {
      throw new Error(
        'At least one of message, status or screenshot must be provided.'
      );
    }
    const url = this.creatorFeedbackDetailUrl
      .replace('<exploration_id>', explorationId)
      .replace('<thread_id>', threadId);
    await this.http
      .put<void>(url, {
        action: status,
        message,
        screenshotFilename: screenshot?.filename ?? null,
        files: screenshot?.files ?? null,
      })
      .toPromise();
  }

  // Feedback-admin dashboard.
  // Not part of Milestone-1, will be added in Milestone-2.
  // 1->fetchFeedbackAdminListAsync.
  // 2->fetchFeedbackAdminDetailAsync.
  // 3->addFeedbackAdminMessageAsync.
  // 4->deleteFeedbackAsync.
}
