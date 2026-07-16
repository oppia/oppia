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
 * @fileoverview Unit tests for FeedbackDetailPageComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FeedbackDetailPageComponent} from './feedback-detail-page.component';
import {FeedbackSharedModule} from '../feedback-shared.module';
import {
  FeedbackStatus,
  PlatformFeedbackDetailResponse,
  ReportAnIssueCategory,
  ReportType,
} from 'domain/feedback/feedback.model';

describe('FeedbackDetailPageComponent', () => {
  let component: FeedbackDetailPageComponent;
  let fixture: ComponentFixture<FeedbackDetailPageComponent>;
  const mockDetailResponse: PlatformFeedbackDetailResponse = {
    id: 'report1',
    report_message: 'Sample report',
    source: ReportType.APP,
    status: FeedbackStatus.OPEN,
    platform: 'web',
    destination_dashboard: 'LEAP',
    page_url: '/learn/math',
    category: ReportAnIssueCategory.OTHER_OR_NOT_SURE,
    lesson_metadata: null,
    include_technical_logs: false,
    session_info: null,
    screenshot_filename: null,
    screenshot_entity_id: null,
    created_on_msecs: 1234567890,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackSharedModule, HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackDetailPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit status changes for non-GitHub statuses', () => {
    const statusChangeSpy = spyOn(component.statusChange, 'emit');
    const githubTransferSpy = spyOn(component.githubTransfer, 'emit');

    component.onStatusOptionClick(FeedbackStatus.FIXED);

    expect(statusChangeSpy).toHaveBeenCalledWith(FeedbackStatus.FIXED);
    expect(githubTransferSpy).not.toHaveBeenCalled();
  });

  it('should emit GitHub transfer URL for transferred status', () => {
    const statusChangeSpy = spyOn(component.statusChange, 'emit');
    const githubTransferSpy = spyOn(component.githubTransfer, 'emit');
    component.feedbackDetailResponse = mockDetailResponse;

    component.onStatusOptionClick(FeedbackStatus.TRANSFERRED_TO_GITHUB);

    expect(statusChangeSpy).not.toHaveBeenCalled();
    expect(githubTransferSpy).toHaveBeenCalledWith(
      jasmine.stringMatching(
        'https://github.com/oppia/oppia/issues/new?'
      ) as string
    );
  });

  it('should not add screenshot data URL to GitHub issue URL', () => {
    component.feedbackDetailResponse = {
      ...mockDetailResponse,
      screenshot_filename: 'report-screenshot.png',
      screenshot_entity_id: 'feedback-report-1',
    };
    component.screenshotDataUrl = 'data:image/png;base64,test-image-data';

    const githubIssueUrl = new URL(component.getGithubIssueUrl());
    const screenshotDetails =
      githubIssueUrl.searchParams.get('screenshots-videos');

    expect(screenshotDetails).toContain(
      'A screenshot was attached to the original feedback report.'
    );
    expect(screenshotDetails).toContain(
      'GitHub cannot load Oppia preview URLs directly.'
    );
    expect(screenshotDetails).toContain(
      'Screenshot filename: report-screenshot.png'
    );
    expect(screenshotDetails).toContain(
      'Screenshot entity ID: feedback-report-1'
    );
    expect(screenshotDetails).not.toContain(component.screenshotDataUrl);
  });

  it('should say when no screenshot is attached in GitHub issue URL', () => {
    component.feedbackDetailResponse = mockDetailResponse;

    const githubIssueUrl = new URL(component.getGithubIssueUrl());

    expect(githubIssueUrl.searchParams.get('screenshots-videos')).toBe(
      'No screenshot was attached to this report.'
    );
  });
});
