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
import {WindowRef} from 'services/contextual/window-ref.service';
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
  let windowRef: WindowRef;
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
      user_agent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36',
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

  const getGithubTransferUrlFromSpy = (githubTransferSpy: jasmine.Spy): URL => {
    return new URL(githubTransferSpy.calls.mostRecent().args[0] as string);
  };

  const getGithubIssueQueryParamsForUserAgent = (
    userAgent: string
  ): URLSearchParams => {
    component.feedbackDetailResponse = {
      ...mockDetailResponse,
      session_info: {
        ...feedbackSessionInfo,
        environment: {
          ...feedbackSessionInfo.environment,
          user_agent: userAgent,
        },
      },
    };

    return new URL(component.getGithubIssueUrl()).searchParams;
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
    windowRef = TestBed.inject(WindowRef);
    spyOnProperty(windowRef, 'nativeWindow').and.returnValue({
      location: {
        origin: 'https://www.oppia.org',
      },
    } as unknown as Window);
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
      lesson_metadata: {
        ...mockLessonMetadata,
        exploration_id: 'exp id',
      },
    };
    const url = component.getReportedLessonUrl();
    expect(url).toBe('/explore/exp%20id?v=1');
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
      lesson_metadata: {
        ...mockLessonMetadata,
        exploration_id: 'exp id',
        state_name: 'Introduction & review',
      },
    };
    const url = component.getReportedStateEditorUrl();
    expect(url).toBe('/create/exp%20id#/gui/Introduction%20%26%20review');
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

  it('should get fallback category labels', () => {
    const category: ReportAnIssueCategory | null = null;
    expect(component.getCategoryLabel(category)).toBe('Not provided');
    expect(component.getCategoryLabel('new_category')).toBe('new_category');
  });

  it('should get correct source label', () => {
    const source = ReportType.APP;
    expect(component.getSourceLabel(source)).toBe('App');
    expect(component.getSourceLabel('new_source')).toBe('new_source');
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

  it('should emit GitHub transfer URL for transferred status when no session logs and metadata', () => {
    const statusChangeSpy = spyOn(component.statusChange, 'emit');
    const githubTransferSpy = spyOn(component.githubTransfer, 'emit');
    component.feedbackDetailResponse = {
      ...mockDetailResponse,
      category: null,
      page_url: '',
    };

    component.onStatusOptionClick(FeedbackStatus.TRANSFERRED_TO_GITHUB);

    expect(statusChangeSpy).not.toHaveBeenCalled();
    expect(githubTransferSpy).toHaveBeenCalledTimes(1);

    const githubIssueUrl = getGithubTransferUrlFromSpy(githubTransferSpy);
    const queryParams = githubIssueUrl.searchParams;

    expect(githubIssueUrl.origin + githubIssueUrl.pathname).toBe(
      'https://github.com/oppia/oppia/issues/new'
    );
    expect(queryParams.get('template')).toBe('6_technical_feedback_report.yml');
    expect(queryParams.get('title')).toBe(
      '[BUG]: User feedback report: Not provided'
    );
    expect(queryParams.get('page-url')).toBe('Not provided');
    expect(queryParams.get('steps-to-reproduce')).toContain(
      'Use the report message and session logs to triage.'
    );
    expect(queryParams.get('screenshots-videos')).toBe(
      'No screenshot was attached to this report.'
    );
    expect(queryParams.get('device')).toBe('Desktop');
    expect(queryParams.get('operating-system')).toBe('Other');
    expect(queryParams.get('browsers')).toBe('Other');
    expect(queryParams.get('browser-version')).toBe('Not provided');
    expect(queryParams.get('additional-context')).toContain(
      'No session logs were attached to this report.'
    );
  });

  it('should emit GitHub transfer URL when session logs and metadata are present', () => {
    const statusChangeSpy = spyOn(component.statusChange, 'emit');
    const githubTransferSpy = spyOn(component.githubTransfer, 'emit');
    const formattedDate = 'Jan 15, 1970, 11:56:07 PM';
    spyOn(
      dateTimeFormatService,
      'getLocaleAbbreviatedDatetimeString'
    ).and.returnValue(formattedDate);
    component.feedbackDetailResponse = {
      ...mockDetailResponse,
      session_info: feedbackSessionInfo,
      lesson_metadata: mockLessonMetadata,
      screenshot_filename: 'screenshot',
      screenshot_entity_id: 'entity_id',
    };
    component.screenshotDataUrl = '/image/abc';

    component.onStatusOptionClick(FeedbackStatus.TRANSFERRED_TO_GITHUB);

    expect(statusChangeSpy).not.toHaveBeenCalled();
    expect(githubTransferSpy).toHaveBeenCalledTimes(1);

    const githubIssueUrl = getGithubTransferUrlFromSpy(githubTransferSpy);
    const queryParams = githubIssueUrl.searchParams;

    expect(queryParams.get('title')).toBe(
      '[BUG]: User feedback report: Other / Not Sure'
    );
    expect(queryParams.get('describe-the-bug')).toBe(
      [
        'Sample report',
        '',
        'Transferred from the Oppia Technical feedback dashboard.',
        'Report ID: report1',
        'Feedback report: https://www.oppia.org/technical-feedback-dashboard/' +
          'tech-external/report1',
        `Submitted: ${formattedDate}`,
        'Source: App',
        'Category: Other / Not Sure',
        'Platform: Web',
        'Dashboard: LEAP',
      ].join('\n')
    );
    expect(queryParams.get('steps-to-reproduce')).toContain(
      "Check exploration exp1, state 'state1',version '1'."
    );
    expect(queryParams.get('steps-to-reproduce')).toContain(
      'Learner answer at report time: answer1'
    );
    expect(queryParams.get('expected-behavior')).toBe(
      'The reported user-facing problem should not occur.'
    );
    expect(queryParams.get('screenshots-videos')).toContain(
      'Screenshot filename: screenshot'
    );
    expect(queryParams.get('screenshots-videos')).toContain(
      'Screenshot entity ID: entity_id'
    );
    expect(queryParams.get('screenshots-videos')).toContain(
      'Screenshot URL: https://www.oppia.org/image/abc'
    );
    expect(queryParams.get('device')).toBe('Desktop');
    expect(queryParams.get('operating-system')).toBe('Linux');
    expect(queryParams.get('browsers')).toBe('Chrome');
    expect(queryParams.get('browser-version')).toBe('150.0.0.0');
    expect(queryParams.get('additional-context')).toContain(
      '"user_agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"'
    );
    expect(queryParams.get('additional-context')).toContain(
      'Session logs included: Yes'
    );
  });

  it('should derive GitHub issue environment fields from common user agents', () => {
    const userAgentTestCases: {
      userAgent: string;
      expectedDevice: string;
      expectedOperatingSystem: string;
      expectedBrowser: string;
      expectedBrowserVersion: string;
    }[] = [
      {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 ' +
          'Edg/150.1.2.3',
        expectedDevice: 'Desktop',
        expectedOperatingSystem: 'Windows',
        expectedBrowser: 'Edge',
        expectedBrowserVersion: '150.1.2.3',
      },
      {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:150.0) ' +
          'Gecko/20100101 Firefox/150.0',
        expectedDevice: 'Desktop',
        expectedOperatingSystem: 'MacOS',
        expectedBrowser: 'Firefox',
        expectedBrowserVersion: '150.0',
      },
      {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 ' +
          'Mobile/15E148 Safari/604.1',
        expectedDevice: 'Mobile',
        expectedOperatingSystem: 'IOS',
        expectedBrowser: 'Safari',
        expectedBrowserVersion: '18.0',
      },
      {
        userAgent:
          'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36',
        expectedDevice: 'Mobile',
        expectedOperatingSystem: 'Android',
        expectedBrowser: 'Chrome',
        expectedBrowserVersion: '150.0.0.0',
      },
      {
        userAgent: 'unknown-user-agent-value',
        expectedDevice: 'Desktop',
        expectedOperatingSystem: 'Other',
        expectedBrowser: 'Other',
        expectedBrowserVersion: 'Not provided',
      },
    ];

    userAgentTestCases.forEach(testCase => {
      const queryParams = getGithubIssueQueryParamsForUserAgent(
        testCase.userAgent
      );

      expect(queryParams.get('device')).toBe(testCase.expectedDevice);
      expect(queryParams.get('operating-system')).toBe(
        testCase.expectedOperatingSystem
      );
      expect(queryParams.get('browsers')).toBe(testCase.expectedBrowser);
      expect(queryParams.get('browser-version')).toBe(
        testCase.expectedBrowserVersion
      );
    });
  });

  it('should return without performing any action when reply is sent', () => {
    expect(component.onReplySend()).toBeUndefined();
  });
});
