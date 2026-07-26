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

import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {
  ImageLocalStorageService,
  ImagesData,
} from 'services/image-local-storage.service';
import {
  FeedbackCaptchaConfigResponse,
  LessonFeedbackModel,
  PlatformFeedbackModel,
  FeedbackSubmitResponse,
  PlatformFeedbackBackendResponse,
  DashboardType,
  FeedbackFilterState,
  PlatformFeedbackDetailResponse,
  SuccessResponse,
} from './feedback.model';

interface FeedbackScreenshotSubmissionData {
  screenshotFilename: string | null;
  screenshotFile: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackBackendApiService {
  private lessonFeedbackUrl = '/feedback';
  private reportUrl = '/platform-feedback';
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
    const screenshotFile =
      await this.imageLocalStorageService.getFilenameToBase64MappingAsync([
        imageData,
      ]);
    return {
      screenshotFilename,
      screenshotFile: screenshotFile[screenshotFilename],
    };
  }

  async submitLessonFeedbackAsync(
    payload: LessonFeedbackModel,
    captchaToken: string | null
  ): Promise<FeedbackSubmitResponse> {
    const requestPayload = {
      ...payload.toBackendDict(),
      ...(captchaToken ? {captcha_token: captchaToken} : {}),
    };
    return await this.http
      .post<FeedbackSubmitResponse>(this.lessonFeedbackUrl, requestPayload)
      .toPromise();
  }

  async submitSiteAndLessonIssueReportAsync(
    payload: PlatformFeedbackModel,
    captchaToken: string | null
  ): Promise<FeedbackSubmitResponse> {
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
  }

  private async fetchPlatformFeedbackListAsync(
    dashboardType: DashboardType,
    dashboardId: string,
    cursor: string | null,
    statusFilter: string | null,
    dateFromMsecs: number | null,
    dateToMsecs: number | null
  ): Promise<PlatformFeedbackBackendResponse> {
    let params = new HttpParams();
    if (cursor) {
      params = params.set('cursor', cursor);
    }
    if (statusFilter) {
      params = params.set('status', statusFilter);
    }
    if (dateFromMsecs) {
      params = params.set('date_from_msecs', String(dateFromMsecs));
    }
    if (dateToMsecs) {
      params = params.set('date_to_msecs', String(dateToMsecs));
    }

    const url = [
      this.reportUrl,
      encodeURIComponent(dashboardType),
      encodeURIComponent(dashboardId),
    ].join('/');
    return await this.http
      .get<PlatformFeedbackBackendResponse>(url, {
        params,
      })
      .toPromise();
  }

  async fetchTechnicalDashboardFeedbackListAsync(
    filterState: FeedbackFilterState,
    cursor: string | null
  ): Promise<PlatformFeedbackBackendResponse> {
    const dateFromMsecs = filterState.dateRange.start?.getTime() ?? null;
    const dateToMsecs = filterState.dateRange.end?.getTime() ?? null;
    return await this.fetchPlatformFeedbackListAsync(
      'technical',
      filterState.technicalTeam,
      cursor,
      filterState.status,
      dateFromMsecs,
      dateToMsecs
    );
  }

  async fetchCreatorDashboardFeedbackListAsync(
    explorationId: string,
    filterState: FeedbackFilterState,
    cursor: string | null = null
  ): Promise<PlatformFeedbackBackendResponse> {
    const dateFromMsecs = filterState.dateRange.start?.getTime() ?? null;
    const dateToMsecs = filterState.dateRange.end?.getTime() ?? null;

    return await this.fetchPlatformFeedbackListAsync(
      'creator',
      explorationId,
      cursor,
      filterState.status,
      dateFromMsecs,
      dateToMsecs
    );
  }

  async fetchPlatformFeedbackDetailAsync(
    dashboardType: DashboardType,
    dashboardId: string,
    reportId: string
  ): Promise<PlatformFeedbackDetailResponse> {
    const url = [
      this.reportUrl,
      encodeURIComponent(dashboardType),
      encodeURIComponent(dashboardId),
      encodeURIComponent(reportId),
    ].join('/');
    return await this.http.get<PlatformFeedbackDetailResponse>(url).toPromise();
  }

  async updatePlatformFeedbackStatusAsync(
    dashboardType: DashboardType,
    dashboardId: string,
    reportId: string,
    newStatus: string
  ): Promise<SuccessResponse> {
    const url = [
      this.reportUrl,
      encodeURIComponent(dashboardType),
      encodeURIComponent(dashboardId),
      encodeURIComponent(reportId),
    ].join('/');
    return await this.http
      .post<SuccessResponse>(url, {
        status: newStatus,
      })
      .toPromise();
  }
}
