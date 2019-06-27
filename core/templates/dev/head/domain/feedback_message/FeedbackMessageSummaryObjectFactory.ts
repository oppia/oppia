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

var oppia = require('AppInit.ts').module;

oppia.factory('FeedbackMessageSummaryObjectFactory', [function() {
  var FeedbackMessageSummary = function(
      messageId, text, updatedStatus, suggestionHtml, currentContentHtml,
      description, authorUsername, authorPictureDataUrl, createdOn) {
    this.messageId = messageId;
    this.text = text;
    this.updatedStatus = updatedStatus;
    this.suggestionHtml = suggestionHtml;
    this.currentContentHtml = currentContentHtml;
    this.description = description;
    this.authorUsername = authorUsername;
    this.authorPictureDataUrl = authorPictureDataUrl;
    this.createdOn = createdOn;
  };

  // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  FeedbackMessageSummary['createNewMessage'] = function(
  /* eslint-enable dot-notation */
      newMessageId, newMessageText, authorUsername, authorPictureDataUrl) {
    return new FeedbackMessageSummary(
      newMessageId, newMessageText, null, null, null, null, authorUsername,
      authorPictureDataUrl, new Date());
  };

  // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  FeedbackMessageSummary['createFromBackendDict'] = function(
  /* eslint-enable dot-notation */
      feedbackMessageSummaryBackendDict) {
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
  };

  return FeedbackMessageSummary;
}]);
