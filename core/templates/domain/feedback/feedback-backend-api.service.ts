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
  SendALessonFeedbackModel,
  IssueReportModel,
  FeedbackSubmitResponse,
} from './feedback.model';

interface FeedbackScreenshotSubmissionData {
  screenshotFilename: string | null;
  screenshotFile: Record<string, string> | null;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackBackendApiService {
  private lessonFeedbackUrl = '/feedback';
  private reportUrl = '/report';
  private captchaConfigUrl = '/feedback_captcha_config_handler';

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

  async submitLessonFeedbackAsync(
    payload: SendALessonFeedbackModel,
    captchaToken: string | null
  ): Promise<FeedbackSubmitResponse> {
    const requestPayload = {
      ...payload.toBackendDict(),
      ...(captchaToken ? {captcha_token: captchaToken} : {}),
    };
    try {
      return await this.http
        .post<FeedbackSubmitResponse>(this.lessonFeedbackUrl, requestPayload)
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

  async submitSiteAndLessonIssueReportAsync(
    payload: IssueReportModel,
    captchaToken: string | null
  ): Promise<FeedbackSubmitResponse> {
    try {
      const screenshotData = await this.getStagedScreenshotSubmissionDataAsync(
        payload.screenshotFilename
      );
      return await this.http
        .post<FeedbackSubmitResponse>(this.reportUrl, {
          ...payload.toBackendDict(),
          screenshot_file: screenshotData.screenshotFile,
          ...(captchaToken ? {captcha_token: captchaToken} : {}),
        })
        .toPromise();
      // We use unknown type because we are unsure of the type of error
      // that was thrown. Since the catch block cannot identify the
      // specific type of error, we are unable to further optimise the
      // code by introducing more types of errors.
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        return Promise.reject(error);
      } else {
        throw error;
      }
    }
  }
}
