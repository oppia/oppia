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
 * @fileoverview Type definitions for web user feedback APIs
 */

export enum FeedbackModalType {
  LESSON_FEEDBACK = 'lesson_feedback',
  LESSON_ISSUE = 'lesson_issue',
  SITE_ISSUE = 'site_issue',
}

export interface LessonFeedbackMetadata {
  explorationId: string;
  explorationVersion: number;
  stateName: string;
  stateIndex: number;
  learnerCurrentAnswer: string | null;
}

export interface LessonFeedbackMetadataBackendDict {
  exploration_id: string;
  exploration_version: number;
  state_name: string;
  state_index: number;
  learner_current_answer: string | null;
}

export interface SendALessonFeedbackBackendDict {
  feedback_text: string;
  exploration_context: LessonFeedbackMetadataBackendDict;
}

export class SendALessonFeedbackModel {
  constructor(
    public readonly feedbackText: string,
    public readonly explorationContext: LessonFeedbackMetadata
  ) {}

  static createForSubmission(params: {
    feedbackText: string;
    exploration_context: LessonFeedbackMetadata;
  }): SendALessonFeedbackModel {
    return new SendALessonFeedbackModel(
      params.feedbackText,
      params.exploration_context
    );
  }

  toBackendDict(): SendALessonFeedbackBackendDict {
    return {
      feedback_text: this.feedbackText,
      exploration_context: {
        exploration_id: this.explorationContext.explorationId,
        exploration_version: this.explorationContext.explorationVersion,
        state_name: this.explorationContext.stateName,
        state_index: this.explorationContext.stateIndex,
        learner_current_answer: this.explorationContext.learnerCurrentAnswer,
      },
    };
  }
}

export type ReportAnIssueCategory =
  | 'typo'
  | 'broken_layout_or_image'
  | 'confusing_or_incorrect_answer'
  | 'other_or_not_sure';

export type ReportType = 'lesson' | 'site';

export interface IssueReportBackendDict {
  source: ReportType;
  report_message: string;
  exploration_context: LessonFeedbackMetadataBackendDict | null;
  category: ReportAnIssueCategory | null;
  include_technical_logs: boolean;
  session_info: FeedbackSessionInfo | null;
  screenshot_filename: string | null;
}

export class IssueReportModel {
  constructor(
    public readonly source: ReportType,
    public readonly reportMessage: string,
    public readonly explorationContext: LessonFeedbackMetadata | null,
    public readonly category: ReportAnIssueCategory | null,
    public readonly includeTechnicalLogs: boolean,
    public readonly sessionInfo: FeedbackSessionInfo | null,
    public readonly screenshotFilename: string | null
  ) {}

  static createForSubmission(params: {
    source: ReportType;
    reportMessage: string;
    explorationContext: LessonFeedbackMetadata | null;
    category: ReportAnIssueCategory | null;
    includeTechnicalLogs: boolean;
    sessionInfo: FeedbackSessionInfo | null;
    screenshotFilename: string | null;
  }): IssueReportModel {
    return new IssueReportModel(
      params.source,
      params.reportMessage,
      params.explorationContext,
      params.category,
      params.includeTechnicalLogs,
      params.sessionInfo,
      params.screenshotFilename
    );
  }

  toBackendDict(): IssueReportBackendDict {
    return {
      source: this.source,
      report_message: this.reportMessage,
      exploration_context: this.explorationContext
        ? {
            exploration_id: this.explorationContext.explorationId,
            exploration_version: this.explorationContext.explorationVersion,
            state_name: this.explorationContext?.stateName,
            state_index: this.explorationContext.stateIndex,
            learner_current_answer:
              this.explorationContext.learnerCurrentAnswer,
          }
        : null,
      category: this.category,
      include_technical_logs: this.includeTechnicalLogs,
      // Strip session info if user didn't opt in.
      session_info:
        this.includeTechnicalLogs && this.sessionInfo ? this.sessionInfo : null,
      screenshot_filename: this.screenshotFilename,
    };
  }
}

export type FeedbackStatus =
  | 'open'
  | 'fixed'
  | 'ignored'
  | 'compliment'
  | 'not_actionable';

export interface FeedbackSessionInfo {
  console_logs_json: {
    error_message: string;
    log_level: 'error' | 'warn' | 'log' | 'info' | 'debug';
    timestamp_msecs: number;
    stack_trace?: string;
  }[];
  failed_requests_json: {
    url: string;
    method: string;
    status_code: number;
    timestamp_msecs: number;
    status_text?: string;
    error_message?: string;
  }[];
  navigation_history_json: {
    path: string;
    timestamp_msecs: number;
  }[];
  environment_json: {
    client_time_msecs: number;
    timezone_offset_mins: number;
    user_agent: string;
    viewport: {
      width: number;
      height: number;
    };
    page: {
      url: string;
      title: string;
    };
    locale: {
      language_code: string;
      direction: 'rtl' | 'ltr';
    };
  };
}

export interface FeedbackCaptchaConfigResponse {
  site_key: string | null;
}

export interface FeedbackSubmitResponse {
  id: string;
}
