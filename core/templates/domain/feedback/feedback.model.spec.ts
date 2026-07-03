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
 * @fileoverview Unit tests for web user feedback models.
 */

import {
  SendALessonFeedbackModel,
  IssueReportModel,
  FeedbackSessionInfo,
} from './feedback.model';

const feedbackSessionInfo: FeedbackSessionInfo = {
  console_logs_json: [
    {
      error_message: 'TypeError: Something went wrong',
      log_level: 'error',
      timestamp_msecs: 1234567890,
      stack_trace: 'Error stack trace',
    },
  ],
  failed_requests_json: [
    {
      url: '/createhandler/web_feedback',
      method: 'POST',
      status_code: 500,
      timestamp_msecs: 1234567891,
      status_text: 'Internal Server Error',
      error_message: 'Request failed',
    },
  ],
  navigation_history_json: [
    {
      path: '/learn/math',
      timestamp_msecs: 1234567892,
    },
  ],
  environment_json: {
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

describe('SendALessonFeedbackModel', () => {
  it('should create a new SendALessonFeedbackModel from arguments', () => {
    const feedback = SendALessonFeedbackModel.createForSubmission({
      feedbackText: 'text',
      exploration_context: {
        explorationId: 'test',
        explorationVersion: 1,
        stateName: 'intro',
        stateIndex: 1,
        learnerCurrentAnswer: 'test',
      },
    });

    expect(feedback.feedbackText).toEqual('text');
    expect(feedback.explorationContext).toEqual({
      explorationId: 'test',
      explorationVersion: 1,
      stateName: 'intro',
      stateIndex: 1,
      learnerCurrentAnswer: 'test',
    });
  });

  it('should convert to backend dict', () => {
    const feedback = SendALessonFeedbackModel.createForSubmission({
      feedbackText: 'text',
      exploration_context: {
        explorationId: 'test',
        explorationVersion: 1,
        stateName: 'intro',
        stateIndex: 1,
        learnerCurrentAnswer: 'test',
      },
    });

    expect(feedback.toBackendDict()).toEqual({
      feedback_text: 'text',
      exploration_context: {
        exploration_id: 'test',
        exploration_version: 1,
        state_name: 'intro',
        state_index: 1,
        learner_current_answer: 'test',
      },
    });
  });
});

describe('ReportAnIssueModel', () => {
  it('should create a new ReportAnIssueModel from arguments', () => {
    const feedback = IssueReportModel.createForSubmission({
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
      includeTechnicalLogs: true,
      sessionInfo: feedbackSessionInfo,
      screenshotFilename: null,
    });

    expect(feedback.source).toEqual('lesson');
    expect(feedback.reportMessage).toEqual('text');
    expect(feedback.explorationContext).toEqual({
      explorationId: 'test',
      explorationVersion: 1,
      stateName: 'intro',
      stateIndex: 1,
      learnerCurrentAnswer: 'test',
    });
    expect(feedback.category).toEqual('broken_layout_or_image');
    expect(feedback.includeTechnicalLogs).toEqual(true);
    expect(feedback.sessionInfo).toEqual(feedbackSessionInfo);
    expect(feedback.screenshotFilename).toEqual(null);
  });

  it('should convert to backend dict', () => {
    const feedback = IssueReportModel.createForSubmission({
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
      includeTechnicalLogs: true,
      sessionInfo: feedbackSessionInfo,
      screenshotFilename: null,
    });

    expect(feedback.toBackendDict()).toEqual({
      source: 'lesson',
      report_message: 'text',
      exploration_context: {
        exploration_id: 'test',
        exploration_version: 1,
        state_name: 'intro',
        state_index: 1,
        learner_current_answer: 'test',
      },
      category: 'broken_layout_or_image',
      include_technical_logs: true,
      session_info: feedbackSessionInfo,
      screenshot_filename: null,
    });
  });
});
