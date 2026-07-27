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
import {DateTimeFormatService} from 'services/date-time-format.service';
import {FeedbackSharedModule} from '../feedback-shared.module';
import {
  FeedbackStatus,
  PlatformFeedbackDetailResponse,
  LessonFeedbackMetadataBackendDict,
  ReportAnIssueCategory,
  FeedbackSessionInfo,
  ReportType,
} from 'domain/feedback/feedback.model';

describe('FeedbackDetailPageComponent', () => {
  let component: FeedbackDetailPageComponent;
  let fixture: ComponentFixture<FeedbackDetailPageComponent>;
  let dateTimeFormatService: DateTimeFormatService;
  const mockDetailResponse: PlatformFeedbackDetailResponse = {
    id: 'report1',
    report_message: 'Sample report',
    source: ReportType.APP,
    status: FeedbackStatus.OPEN,
    platform: 'web',
    destination_dashboard: 'tech-external',
    page_url: '/learn/math',
    category: ReportAnIssueCategory.OTHER_OR_NOT_SURE,
    lesson_metadata: null,
    include_technical_logs: false,
    session_info: null,
    screenshot_filename: null,
    screenshot_entity_id: null,
    created_on_msecs: 1234567890,
  };
  const mockLessonMetadata: LessonFeedbackMetadataBackendDict = {
    exploration_id: 'exp1',
    exploration_version: 1,
    state_name: 'state1',
    state_index: 1,
    learner_current_answer: 'answer1',
  };

  const feedbackSessionInfo: FeedbackSessionInfo = {
    console_logs: [
      {
        error_message: 'TypeError: Something went wrong',
        log_level: 'error',
        timestamp_msecs: 1234567890,
        stack_trace: 'Error stack trace',
      },
    ],
    failed_requests: [
      {
        url: '/createhandler/web_feedback',
        method: 'POST',
        status_code: 500,
        timestamp_msecs: 1234567891,
        status_text: 'Internal Server Error',
        error_message: 'Request failed',
      },
    ],
    navigation_history: [
      {
        path: '/learn/math',
        timestamp_msecs: 1234567892,
      },
    ],
    environment: {
      client_time_msecs: 1234567893,
      timezone_offset_mins: -330,
      user_agent: 'Mozilla/5.0 Chrome/136.0',
      viewport: {
        width: 1920,
        height: 1080,
      },
      page: {
        url: 'http://localhost:8181/explore/test',
        title: 'Test Exploration',
      },
      locale: {
        language_code: 'en',
        direction: 'ltr',
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackSharedModule, HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeedbackDetailPageComponent);
    component = fixture.componentInstance;
    dateTimeFormatService = TestBed.inject(DateTimeFormatService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get correct Platform label', () => {
    expect(component.getPlatformLabel(mockDetailResponse.platform)).toBe('Web');
    expect(component.getPlatformLabel('android')).toBe('Android');
  });

  it('should format date correctly', () => {
    const timestamp = mockDetailResponse.created_on_msecs;
    const formattedDate = 'Jan 15, 1970, 11:56:07 PM';

    spyOn(
      dateTimeFormatService,
      'getLocaleAbbreviatedDatetimeString'
    ).and.returnValue(formattedDate);

    const result = component.formatDate(timestamp);

    expect(
      dateTimeFormatService.getLocaleAbbreviatedDatetimeString
    ).toHaveBeenCalledWith(timestamp);
    expect(result).toBe(formattedDate);
  });

  it('should return early the Reported Lesson URL if no lesson metadata', () => {
    component.feedbackDetailResponse = mockDetailResponse;
    const url = component.getReportedLessonUrl();
    expect(url).toBe(null);
  });

  it('should construct and return the Reported Lesson URL', () => {
    component.feedbackDetailResponse = {
      ...mockDetailResponse,
      source: ReportType.LESSON,
      lesson_metadata: mockLessonMetadata,
    };
    const url = component.getReportedLessonUrl();
    expect(url).toBe('/explore/exp1?v=1');
  });

  it('should return early the Reported state editor URL if no lesson metadata', () => {
    component.feedbackDetailResponse = mockDetailResponse;
    const url = component.getReportedStateEditorUrl();
    expect(url).toBe(null);
  });

  it('should construct and return the Reported state editor URL', () => {
    component.feedbackDetailResponse = {
      ...mockDetailResponse,
      source: ReportType.LESSON,
      lesson_metadata: mockLessonMetadata,
    };
    const url = component.getReportedStateEditorUrl();
    expect(url).toBe('/create/exp1#/gui/state1');
  });

  it('should get sessionInfo when sessionInfo is not null', () => {
    component.feedbackDetailResponse = mockDetailResponse;
    expect(component.sessionInfo).toBe(null);
    component.feedbackDetailResponse = {
      ...mockDetailResponse,
      session_info: feedbackSessionInfo,
    };
    expect(component.sessionInfo).toBe(feedbackSessionInfo);
  });

  it('should get correct category label', () => {
    const category = ReportAnIssueCategory.BROKEN_LAYOUT_OR_IMAGE;
    expect(component.getCategoryLabel(category)).toBe('Broken Layout / Image');
  });

  it('should get correct category label for null category', () => {
    const category = null;
    expect(component.getCategoryLabel(category)).toBe('Not provided');
  });

  it('should get correct source label', () => {
    const source = ReportType.APP;
    expect(component.getSourceLabel(source)).toBe('App');
  });

  it('should get correct destination label', () => {
    let destinationDashboard: 'tech-external' | 'tech-internal' | 'curriculum' =
      'tech-external';
    expect(component.getDestinationLabel(destinationDashboard)).toBe('LEAP');
    destinationDashboard = 'tech-internal';
    expect(component.getDestinationLabel(destinationDashboard)).toBe('CORE');
    destinationDashboard = 'curriculum';
    expect(component.getDestinationLabel(destinationDashboard)).toBe('Creator');
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
});
