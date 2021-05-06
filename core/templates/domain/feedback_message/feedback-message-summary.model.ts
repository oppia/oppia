// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Frontend Model for feedback message summary.
 */

export interface FeedbackMessageSummaryBackendDict {
  'message_id': number;
  'text': string;
  'updated_status': string;
  'suggestion_html': string;
  'current_content_html': string;
  'description': string;
  'author_username': string;
  'author_picture_data_url': string;
  'created_on_msecs': number;
}

export class FeedbackMessageSummary {
  messageId: number;
  text: string;
  updatedStatus: string;
  suggestionHtml: string;
  currentContentHtml: string;
  description: string;
  authorUsername: string;
  authorPictureDataUrl: string;
  createdOnMsecs: number;

  constructor(
      messageId: number, text: string, updatedStatus: string,
      suggestionHtml: string, currentContentHtml: string, description: string,
      authorUsername: string, authorPictureDataUrl: string,
      createdOnMsecs: number) {
    this.messageId = messageId;
    this.text = text;
    this.updatedStatus = updatedStatus;
    this.suggestionHtml = suggestionHtml;
    this.currentContentHtml = currentContentHtml;
    this.description = description;
    this.authorUsername = authorUsername;
    this.authorPictureDataUrl = authorPictureDataUrl;
    this.createdOnMsecs = createdOnMsecs;
  }

  static createNewMessage(
      newMessageId: number, newMessageText: string, authorUsername: string,
      authorPictureDataUrl: string): FeedbackMessageSummary {
    // Date.now() returns number of milliseconds since 1970-01-01 UTC.
    let createdOnMsecs: number = new Date().getTime();
    return new FeedbackMessageSummary(
      newMessageId, newMessageText, null, null, null, null, authorUsername,
      authorPictureDataUrl, createdOnMsecs);
  }

  static createFromBackendDict(
      feedbackMessageSummaryBackendDict: FeedbackMessageSummaryBackendDict):
      FeedbackMessageSummary {
    return new FeedbackMessageSummary(
      feedbackMessageSummaryBackendDict.message_id,
      feedbackMessageSummaryBackendDict.text,
      feedbackMessageSummaryBackendDict.updated_status,
      feedbackMessageSummaryBackendDict.suggestion_html,
      feedbackMessageSummaryBackendDict.current_content_html,
      feedbackMessageSummaryBackendDict.description,
      feedbackMessageSummaryBackendDict.author_username,
      feedbackMessageSummaryBackendDict.author_picture_data_url,
      feedbackMessageSummaryBackendDict.created_on_msecs);
  }
}
