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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ThreadMessage } from 'domain/feedback_message/ThreadMessage.model';
import { ThreadMessageSummary } from 'domain/feedback_message/ThreadMessageSummary.model';

export interface FeedbackThreadBackendDict {
  'status': string;
  'subject': string;
  'summary': string;
  'original_author_username': string;
  'last_updated_msecs': number;
  'message_count': number;
  'state_name': string;
  'thread_id': string;
  'last_nonempty_message_author': string;
  'last_nonempty_message_text': string;
}

export class FeedbackThread {
  status: string;
  subject: string;
  summary: string;
  originalAuthorName: string;
  lastUpdatedMsecs: number;
  messageCount: number;
  stateName: string;
  threadId: string;
  lastNonemptyMessageSummary: ThreadMessageSummary;
  messages: ThreadMessage[] = [];

  constructor(
      status: string, subject: string, summary: string,
      originalAuthorName: string, lastUpdatedMsecs: number,
      messageCount: number, stateName: string, threadId: string,
      lastNonemptyMessageSummary: ThreadMessageSummary) {
    this.status = status;
    this.subject = subject;
    this.summary = summary;
    this.originalAuthorName = originalAuthorName;
    this.lastUpdatedMsecs = lastUpdatedMsecs;
    this.messageCount = messageCount;
    this.stateName = stateName;
    this.threadId = threadId;
    this.lastNonemptyMessageSummary = lastNonemptyMessageSummary;
  }

  setMessages(messages: ThreadMessage[]): void {
    this.messages = messages;
    // Since messages have been updated, we need to update all of our other
    // message-related fields to maintain consistency between them.
    this.messageCount = messages.length;
    let nonemptyMessages = messages.filter(m => m.hasText());
    if (nonemptyMessages.length > 0) {
      let i = nonemptyMessages.length - 1;
      this.lastNonemptyMessageSummary = nonemptyMessages[i].summary;
    }
  }

  getMessages(): ThreadMessage[] {
    return this.messages;
  }

  isSuggestionThread(): boolean {
    return false;
  }
}

@Injectable({providedIn: 'root'})
export class FeedbackThreadObjectFactory {
  createFromBackendDict(
      feedbackThreadBackendDict: FeedbackThreadBackendDict): FeedbackThread {
    return new FeedbackThread(
      feedbackThreadBackendDict.status, feedbackThreadBackendDict.subject,
      feedbackThreadBackendDict.summary,
      feedbackThreadBackendDict.original_author_username,
      feedbackThreadBackendDict.last_updated_msecs,
      feedbackThreadBackendDict.message_count,
      feedbackThreadBackendDict.state_name,
      feedbackThreadBackendDict.thread_id,
      new ThreadMessageSummary(
        feedbackThreadBackendDict.last_nonempty_message_author,
        feedbackThreadBackendDict.last_nonempty_message_text));
  }
}

angular.module('oppia').factory(
  'FeedbackThreadObjectFactory',
  downgradeInjectable(FeedbackThreadObjectFactory));
