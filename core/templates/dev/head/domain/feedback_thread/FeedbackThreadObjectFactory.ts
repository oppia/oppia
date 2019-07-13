// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
   thread domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class FeedbackThread {
  status: any;
  subject: any;
  summary: any;
  originalAuthorName: any;
  lastUpdated: any;
  messageCount: any;
  stateName: any;
  threadId: any;
  messages: any[];
  constructor(
      status, subject, summary, originalAuthorName, lastUpdated, messageCount,
      stateName, threadId) {
    this.status = status;
    this.subject = subject;
    this.summary = summary;
    this.originalAuthorName = originalAuthorName;
    this.lastUpdated = lastUpdated;
    this.messageCount = messageCount;
    this.stateName = stateName;
    this.threadId = threadId;
    this.messages = [];
  }

  setMessages(messages) {
    this.messages = messages;
  }

  isSuggestionThread() {
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackThreadObjectFactory {
  createFromBackendDict(feedbackThreadBackendDict) {
    return new FeedbackThread(
      feedbackThreadBackendDict.status, feedbackThreadBackendDict.subject,
      feedbackThreadBackendDict.summary,
      feedbackThreadBackendDict.original_author_username,
      feedbackThreadBackendDict.last_updated,
      feedbackThreadBackendDict.message_count,
      feedbackThreadBackendDict.state_name,
      feedbackThreadBackendDict.thread_id);
  }
}
var oppia = require('AppInit.ts').module;

oppia.factory(
  'FeedbackThreadObjectFactory',
  downgradeInjectable(FeedbackThreadObjectFactory));
