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

export type FeedbackCategory = 'platform' | 'lesson' | 'not_sure';

export type FeedbackSubmitCategory = 'platform' | 'lesson';

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

export interface FeedbackMessage {
  message_index: number;
  author_id: string | null;
  author_status: 'learner' | 'editor' | 'feedback_admin';
  text: string | null;
  created_on_msecs: number;
  screenshot_filename?: string | null;
  screenshot_url?: string | null;
  updated_status: FeedbackStatus | null;
}

export interface FeedbackSubmitPayload {
  category: FeedbackSubmitCategory;
  target_type: 'exploration' | 'general';
  target_id: string | null;
  description: string;
  page_url: string;
  language_code: string;
  rating: number;
  screenshot_filename: string | null;
  submit_anonymously: boolean;
  include_session_info: boolean;
  session_info: FeedbackSessionInfo | null;
  captcha_token: string | null;
  screenshot_file?: Record<string, string> | null;
}

export interface FeedbackSubmitResponse {
  thread_id: string;
}

export interface FeedbackCaptchaConfigResponse {
  site_key: string | null;
}

export interface FeedbackThreadSummary {
  id: string;
  category: FeedbackCategory;
  description_preview: string;
  page_url: string;
  status: FeedbackStatus;
  created_on_msecs: number;
  rating: number | null;
  has_screenshot: boolean;
  has_session_info: boolean;
}

export interface FeedbackThreadDetail {
  id: string;
  category: FeedbackCategory;
  description: string;
  page_url: string;
  language_code: string;
  status: FeedbackStatus;
  created_on_msecs: number;
  rating: number | null;
  target_type?: 'exploration' | null;
  target_id?: string | null;
  user_id?: string | null;
  session_info: FeedbackSessionInfo | null;
  can_edit_exploration?: boolean;
  messages: FeedbackMessage[];
}
