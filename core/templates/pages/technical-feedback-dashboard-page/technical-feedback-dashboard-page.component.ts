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
 * @fileoverview Component for Technical feedback dashboard.
 */
import {Component} from '@angular/core';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import './technical-feedback-dashboard-page.component.css';

@Component({
  selector: 'oppia-technical-feedback-dashboard-page',
  templateUrl: './technical-feedback-dashboard-page.component.html',
})
export class TechnicalFeedbackDashboardPageComponent {
  constructor(private feedbackBackendApiService: FeedbackBackendApiService) {}

  selectedReportId: string = '';

  async fetchListButton(): Promise<void> {
    let response =
      await this.feedbackBackendApiService.fetchPlatformFeedbackListAsync(
        'technical',
        'CORE',
        null,
        null,
        null,
        null
      );
    console.log(response);
  }

  async getDetailedViewButton(): Promise<void> {
    let detailedResponse =
      await this.feedbackBackendApiService.fetchPlatformFeedbackDetailAsync(
        'technical',
        'CORE',
        this.selectedReportId
      );
    console.log(detailedResponse);
  }

  async updateStatusButton(): Promise<void> {
    await this.feedbackBackendApiService.updatePlatformFeedbackStatusAsync(
      'technical',
      'CORE',
      this.selectedReportId,
      'fixed'
    );
  }
}
