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

export interface LessonFeedbackBackendDict {
  feedback_text: string;
  lesson_metadata: LessonFeedbackMetadataBackendDict;
}

export class LessonFeedbackModel {
  constructor(
    public readonly feedbackText: string,
    public readonly explorationContext: LessonFeedbackMetadata
  ) {}

  static createForSubmission(params: {
    feedbackText: string;
    lesson_metadata: LessonFeedbackMetadata;
  }): LessonFeedbackModel {
    return new LessonFeedbackModel(params.feedbackText, params.lesson_metadata);
  }

  toBackendDict(): LessonFeedbackBackendDict {
    return {
      feedback_text: this.feedbackText,
      lesson_metadata: {
        exploration_id: this.explorationContext.explorationId,
        exploration_version: this.explorationContext.explorationVersion,
        state_name: this.explorationContext.stateName,
        state_index: this.explorationContext.stateIndex,
        learner_current_answer: this.explorationContext.learnerCurrentAnswer,
      },
    };
  }
}

export enum ReportAnIssueCategory {
  TYPO = 'typo',
  BROKEN_LAYOUT_OR_IMAGE = 'broken_layout_or_image',
  CONFUSING_OR_INCORRECT_ANSWER = 'confusing_or_incorrect_answer',
  OTHER_OR_NOT_SURE = 'other_or_not_sure',
}

export enum ReportType {
  LESSON = 'lesson',
  APP = 'app',
}

export type DashboardType = 'creator' | 'technical';

export enum TechnicalTeamType {
  TECH_EXTERNAL = 'tech-external',
  TECH_INTERNAL = 'tech-internal',
}

export interface PlatformFeedbackBackendDict {
  source: ReportType;
  report_message: string;
  page_url: string;
  lesson_metadata: LessonFeedbackMetadataBackendDict | null;
  category: ReportAnIssueCategory | null;
  include_technical_logs: boolean;
  session_info: FeedbackSessionInfo | null;
  screenshot_filename: string | null;
}

export class PlatformFeedbackModel {
  constructor(
    public readonly source: ReportType,
    public readonly reportMessage: string,
    public readonly pageUrl: string,
    public readonly explorationContext: LessonFeedbackMetadata | null,
    public readonly category: ReportAnIssueCategory | null,
    public readonly includeTechnicalLogs: boolean,
    public readonly sessionInfo: FeedbackSessionInfo | null,
    public readonly screenshotFilename: string | null
  ) {}

  static createForSubmission(params: {
    source: ReportType;
    reportMessage: string;
    pageUrl: string;
    explorationContext: LessonFeedbackMetadata | null;
    category: ReportAnIssueCategory | null;
    includeTechnicalLogs: boolean;
    sessionInfo: FeedbackSessionInfo | null;
    screenshotFilename: string | null;
  }): PlatformFeedbackModel {
    return new PlatformFeedbackModel(
      params.source,
      params.reportMessage,
      params.pageUrl,
      params.explorationContext,
      params.category,
      params.includeTechnicalLogs,
      params.sessionInfo,
      params.screenshotFilename
    );
  }

  toBackendDict(): PlatformFeedbackBackendDict {
    return {
      source: this.source,
      report_message: this.reportMessage,
      lesson_metadata: this.explorationContext
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
      page_url: this.pageUrl,
    };
  }
}

export enum FeedbackStatus {
  OPEN = 'open',
  FIXED = 'fixed',
  COMPLIMENT = 'compliment',
  NOT_ACTIONABLE = 'not_actionable',
  TRANSFERRED_TO_GITHUB = 'transferred_to_github',
}

export interface FeedbackSessionInfo {
  console_logs: {
    error_message: string;
    log_level: 'error' | 'warn' | 'log' | 'info' | 'debug';
    timestamp_msecs: number;
    stack_trace?: string;
  }[];
  failed_requests: {
    url: string;
    method: string;
    status_code: number;
    timestamp_msecs: number;
    status_text?: string;
    error_message?: string;
  }[];
  navigation_history: {
    path: string;
    timestamp_msecs: number;
  }[];
  environment: {
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

export interface PlatformFeedbackSummary {
  id: string;
  report_message_preview: string;
  status: FeedbackStatus;
  source: string;
  category: ReportAnIssueCategory | null;
}

export interface PlatformFeedbackBackendResponse {
  summaries: PlatformFeedbackSummary[];
  next_cursor: string | null;
  more: boolean;
}

export interface PlatformFeedbackDetailResponse {
  id: string;
  report_message: string;
  source: ReportType;
  status: FeedbackStatus;
  platform: 'web' | 'android';
  destination_dashboard: 'tech-external' | 'tech-internal' | 'curriculum';
  page_url: string;
  category: ReportAnIssueCategory | null;
  lesson_metadata: LessonFeedbackMetadataBackendDict | null;
  include_technical_logs: boolean;
  session_info: FeedbackSessionInfo | null;
  screenshot_filename: string | null;
  screenshot_entity_id: string | null;
  created_on_msecs: number;
}

export interface SuccessResponse {
  success: boolean;
}

export interface FeedbackFilterState {
  searchText: string | null;
  status: FeedbackStatus | null;
  technicalTeam: TechnicalTeamType;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

/** Configuration passed to FeedbackFilterBar to hide/show filters. */
export interface FeedbackFilterConfig {
  showTeamFilter: boolean;
  showDateRangeFilter: boolean;
  showSearchBar: boolean;
}

/** Configuration passed to FeedbackCard to control visibility. */
export interface FeedbackCardConfig {
  showCategory: boolean;
  showResponse: boolean;
  showScreenshot: boolean;
  showLessonMetadata: boolean;
  showSessionInfo: boolean;
}

export const TECHNICAL_DASHBOARD_FILTER_CONFIG: FeedbackFilterConfig = {
  showTeamFilter: true,
  showDateRangeFilter: true,
  showSearchBar: true,
};

export const TECHNICAL_DASHBOARD_CARD_CONFIG: FeedbackCardConfig = {
  showCategory: true,
  showResponse: false,
  showLessonMetadata: true,
  showScreenshot: true,
  showSessionInfo: true,
};

// Human readable labels for enums.
export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  [FeedbackStatus.OPEN]: 'Open',
  [FeedbackStatus.FIXED]: 'Fixed',
  [FeedbackStatus.NOT_ACTIONABLE]: 'Not Actionable',
  [FeedbackStatus.COMPLIMENT]: 'Compliment',
  [FeedbackStatus.TRANSFERRED_TO_GITHUB]: 'Transferred to GitHub',
};

export const TECHNICAL_TEAM_LABELS: Record<TechnicalTeamType, string> = {
  [TechnicalTeamType.TECH_EXTERNAL]: 'LEAP',
  [TechnicalTeamType.TECH_INTERNAL]: 'CORE',
};

export const CATEGORY_LABELS: Record<string, string> = {
  [ReportAnIssueCategory.TYPO]: 'Typo',
  [ReportAnIssueCategory.BROKEN_LAYOUT_OR_IMAGE]: 'Broken Layout / Image',
  [ReportAnIssueCategory.CONFUSING_OR_INCORRECT_ANSWER]:
    'Confusing / Incorrect Answer',
  [ReportAnIssueCategory.OTHER_OR_NOT_SURE]: 'Other / Not Sure',
};

export const SOURCE_LABELS: Record<string, string> = {
  [ReportType.LESSON]: 'Lesson',
  [ReportType.APP]: 'App',
};
