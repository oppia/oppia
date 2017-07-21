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

oppia.factory('FeedbackMessageObjectFactory', [function() {
    var FeedbackMessage = function(text, suggestionHtml, currentContentHtml,
        description,authorUsername, authorPictureDataUrl, createdOn) {
      this.text = text;
      this.suggestionHtml = suggestionHtml;
      this.currentContentHtml = currentContentHtml;
      this.description = description;
      this.authorUsername = authorUsername;
      this.authorPictureDataUrl = authorPictureDataUrl;
      this.createdOn = createdOn;
    };

    FeedbackMessage.createNewMessage = function(newMessage, authorUsername,
        authorPictureDataUrl) {
      return new FeedbackMessage(
        newMessage, null, null, null, authorUsername, authorPictureDataUrl,
        new Date());
    };

    FeedbackMessage.createFromBackendDicts = function(
      feedbackMessageBackendDicts) {
      var FeedbackMessages = [];
      for (index = 0; index < feedbackMessageBackendDicts.length; index++) {
        FeedbackMessages.push(new FeedbackMessage(
          feedbackMessageBackendDicts[index].text,
          feedbackMessageBackendDicts[index].suggestion_html,
          feedbackMessageBackendDicts[index].current_content_html,
          feedbackMessageBackendDicts[index].description,
          feedbackMessageBackendDicts[index].author_username,
          feedbackMessageBackendDicts[index].author_picture_data_url,
          feedbackMessageBackendDicts[index].created_on
        ));
      }

      return FeedbackMessages;
    };

    return FeedbackMessage;
  }
]);
