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

import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {
  FeedbackStatus,
  ReportAnIssueCategory,
  ReportType,
  TECHNICAL_DASHBOARD_CARD_CONFIG,
} from 'domain/feedback/feedback.model';
import type {PlatformFeedbackDetailResponse} from 'domain/feedback/feedback.model';
import {WindowRef} from 'services/contextual/window-ref.service';

import {FeedbackDetailPageComponent} from './feedback-detail-page.component';

class MockWindowRef {
  nativeWindow = {
    open: jasmine.createSpy('open'),
  };
}

describe('FeedbackDetailPageComponent', () => {
  let component: FeedbackDetailPageComponent;
  let fixture: ComponentFixture<FeedbackDetailPageComponent>;
  let windowRef: MockWindowRef;

  const feedbackDetailResponse: PlatformFeedbackDetailResponse = {
    id: 'report-1',
    report_message: 'The submit button does not respond.',
    source: ReportType.APP,
    status: FeedbackStatus.OPEN,
    platform: 'web',
    destination_dashboard: 'CORE',
    page_url: 'https://www.oppia.org/learn/math',
    category: ReportAnIssueCategory.BROKEN_LAYOUT_OR_IMAGE,
    lesson_metadata: {
      exploration_id: 'exp_id',
      exploration_version: 3,
      state_name: 'Introduction',
      state_index: 1,
      learner_current_answer: '42',
    },
    include_technical_logs: true,
    session_info: {
      console_logs_json: [
        {
          error_message: 'TypeError: failed',
          log_level: 'error',
          timestamp_msecs: 1735689601000,
        },
      ],
      failed_requests_json: [
        {
          url: '/api/example',
          method: 'GET',
          status_code: 500,
          timestamp_msecs: 1735689602000,
        },
      ],
      navigation_history_json: [
        {
          path: '/learn/math',
          timestamp_msecs: 1735689603000,
        },
      ],
      environment_json: {
        client_time_msecs: 1735689604000,
        timezone_offset_mins: 0,
        user_agent: 'Chrome/120.0.0.0',
        viewport: {
          width: 1280,
          height: 720,
        },
        page: {
          url: 'https://www.oppia.org/learn/math',
          title: 'Oppia',
        },
        locale: {
          language_code: 'en',
          direction: 'ltr',
        },
      },
    },
    screenshot_filename: 'screenshot.png',
    screenshot_entity_id: 'screenshot-id',
    created_on_msecs: 1735689600000,
  };

  beforeEach(() => {
    windowRef = new MockWindowRef();

    TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [FeedbackDetailPageComponent],
      providers: [
        {
          provide: WindowRef,
          useValue: windowRef,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(FeedbackDetailPageComponent);
    component = fixture.componentInstance;
    component.feedbackDetailPageConfig = TECHNICAL_DASHBOARD_CARD_CONFIG;
    component.feedbackDetailResponse = feedbackDetailResponse;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build prefilled GitHub issue URL for feedback report', () => {
    const url = new URL(component.getGithubIssueUrl());

    expect(url.origin + url.pathname).toBe(
      'https://github.com/oppia/oppia/issues/new'
    );
    expect(url.searchParams.get('template')).toBe('1_bug_report_form.yml');
    expect(url.searchParams.get('title')).toBe(
      '[BUG]: User feedback report: Broken Layout / Image'
    );

    const bugDescription = url.searchParams.get('describe-the-bug') as string;
    expect(bugDescription).toContain('Report ID: report-1');
    expect(bugDescription).toContain('Source: App');
    expect(bugDescription).toContain('Platform: Web');
    expect(bugDescription).toContain('Dashboard: CORE');
    expect(bugDescription).toContain('The submit button does not respond.');
    expect(url.searchParams.get('page-url')).toBe(
      'https://www.oppia.org/learn/math'
    );
    expect(url.searchParams.get('screenshots-videos')).toBe(
      'Screenshot attached to feedback report: screenshot.png'
    );
    expect(url.searchParams.get('device')).toBe('Desktop');
    expect(url.searchParams.get('operating-system')).toBe('Other');
    expect(url.searchParams.get('browsers')).toBe('Other');
    expect(url.searchParams.get('browser-version')).toBe('Chrome/120.0.0.0');

    const stepsToReproduce = url.searchParams.get(
      'steps-to-reproduce'
    ) as string;
    expect(stepsToReproduce).toContain('exploration exp_id');
    expect(stepsToReproduce).toContain('Learner answer at report time: 42');

    const additionalContext = url.searchParams.get(
      'additional-context'
    ) as string;
    expect(additionalContext).toContain('Session logs included: Yes');
    expect(additionalContext).toContain('## Privacy warning');
    expect(additionalContext).toContain('WARNING: The session logs below');
    expect(additionalContext).toContain('"error_message": "TypeError: failed"');
    expect(additionalContext).toContain('"user_agent": "Chrome/120.0.0.0"');
  });

  it('should emit status and open GitHub issue for transferred status', () => {
    spyOn(component.statusChange, 'emit');

    component.onStatusChange(FeedbackStatus.TRANSFERRED_TO_GITHUB);

    expect(component.statusChange.emit).toHaveBeenCalledWith(
      FeedbackStatus.TRANSFERRED_TO_GITHUB
    );
    expect(windowRef.nativeWindow.open).toHaveBeenCalledWith(
      component.getGithubIssueUrl(),
      '_blank',
      'noopener'
    );
  });

  it('should not open GitHub issue for non-transferred status', () => {
    spyOn(component.statusChange, 'emit');

    component.onStatusChange(FeedbackStatus.FIXED);

    expect(component.statusChange.emit).toHaveBeenCalledWith(
      FeedbackStatus.FIXED
    );
    expect(windowRef.nativeWindow.open).not.toHaveBeenCalled();
  });
});
