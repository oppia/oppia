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
 * @fileoverview Factory for creating new frontend instances of feedback
   message domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class FeedbackMessageSummary {
  messageId: number;
  text: string;
  updatedStatus: string;
  suggestionHtml: string;
  currentContentHtml: string;
  description: string;
  authorUsername: string;
  authorPictureDataUrl: string;
  createdOn: Date;

  constructor(
      messageId: number, text: string, updatedStatus: string,
      suggestionHtml: string, currentContentHtml: string, description: string,
      authorUsername: string, authorPictureDataUrl: string, createdOn: Date) {
    this.messageId = messageId;
    this.text = text;
    this.updatedStatus = updatedStatus;
    this.suggestionHtml = suggestionHtml;
    this.currentContentHtml = currentContentHtml;
    this.description = description;
    this.authorUsername = authorUsername;
    this.authorPictureDataUrl = authorPictureDataUrl;
    this.createdOn = createdOn;
  }
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackMessageSummaryObjectFactory {
  createNewMessage(
      newMessageId: number, newMessageText: string, authorUsername: string,
      authorPictureDataUrl: string): FeedbackMessageSummary {
    return new FeedbackMessageSummary(
      newMessageId, newMessageText, null, null, null, null, authorUsername,
      authorPictureDataUrl, new Date());
  }
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'feedbackMessageSummaryBackendDict' is a dict with
  // underscore_cased keys which give tslint errors against underscore_casing
  // in favor of camelCasing.
  createFromBackendDict(
      feedbackMessageSummaryBackendDict: any): FeedbackMessageSummary {
    return new FeedbackMessageSummary(
      feedbackMessageSummaryBackendDict.message_id,
      feedbackMessageSummaryBackendDict.text,
      feedbackMessageSummaryBackendDict.updated_status,
      feedbackMessageSummaryBackendDict.suggestion_html,
      feedbackMessageSummaryBackendDict.current_content_html,
      feedbackMessageSummaryBackendDict.description,
      feedbackMessageSummaryBackendDict.author_username,
      feedbackMessageSummaryBackendDict.author_picture_data_url,
      feedbackMessageSummaryBackendDict.created_on);
  }
}

angular.module('oppia').factory(
  'FeedbackMessageSummaryObjectFactory',
  downgradeInjectable(FeedbackMessageSummaryObjectFactory));
