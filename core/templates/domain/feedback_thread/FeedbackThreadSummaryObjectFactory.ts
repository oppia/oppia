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
 * @fileoverview Factory for creating new frontend instances of feedback thread
   domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

interface IFeedbackThreadSummaryBackendDict {
  'status': string;
  'original_author_id': string;
  'last_updated_msecs': number;
  'last_message_text': string;
  'total_message_count': number;
  'last_message_is_read': boolean;
  'second_last_message_is_read': boolean;
  'author_last_message': string;
  'author_second_last_message': string;
  'exploration_title': string;
  'exploration_id': string;
  'thread_id': string;
}

export class FeedbackThreadSummary {
  status: string;
  originalAuthorId: string;
  lastUpdatedMsecs: number;
  lastMessageText: string;
  totalMessageCount: number;
  lastMessageRead: boolean;
  secondLastMessageRead: boolean;
  authorLastMessage: string;
  authorSecondLastMessage: string;
  explorationTitle: string;
  explorationId: string;
  threadId: string;

  constructor(
      status: string, originalAuthorId: string, lastUpdatedMsecs: number,
      lastMessageText: string, totalMessageCount: number,
      lastMessageRead: boolean, secondLastMessageRead: boolean,
      authorLastMessage: string, authorSecondLastMessage: string,
      explorationTitle: string, explorationId: string, threadId: string) {
    this.status = status;
    this.originalAuthorId = originalAuthorId;
    this.lastUpdatedMsecs = lastUpdatedMsecs;
    this.lastMessageText = lastMessageText;
    this.totalMessageCount = totalMessageCount;
    this.lastMessageRead = lastMessageRead;
    this.secondLastMessageRead = secondLastMessageRead;
    this.authorLastMessage = authorLastMessage;
    this.authorSecondLastMessage = authorSecondLastMessage;
    this.explorationTitle = explorationTitle;
    this.explorationId = explorationId;
    this.threadId = threadId;
  }

  markTheLastTwoMessagesAsRead(): void {
    if (this.authorSecondLastMessage) {
      this.secondLastMessageRead = true;
    }
    this.lastMessageRead = true;
  }

  appendNewMessage(lastMessageText: string, authorLastMessage: string): void {
    this.lastMessageText = lastMessageText;
    this.lastUpdatedMsecs = new Date().getTime();
    this.authorSecondLastMessage = this.authorLastMessage;
    this.authorLastMessage = authorLastMessage;
    this.totalMessageCount += 1;
    this.lastMessageRead = true;
    this.secondLastMessageRead = true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackThreadSummaryObjectFactory {
  create(
      status: string, originalAuthorId: string, lastUpdatedMsecs: number,
      lastMessageText: string, totalMessageCount: number,
      lastMessageRead: boolean, secondLastMessageRead: boolean,
      authorLastMessage: string, authorSecondLastMessage: string,
      explorationTitle: string, explorationId: string,
      threadId: string): FeedbackThreadSummary {
    return new FeedbackThreadSummary(status, originalAuthorId, lastUpdatedMsecs,
      lastMessageText, totalMessageCount, lastMessageRead,
      secondLastMessageRead, authorLastMessage, authorSecondLastMessage,
      explorationTitle, explorationId, threadId);
  }

  createFromBackendDict(
      feedbackThreadSummaryBackendDict: IFeedbackThreadSummaryBackendDict):
      FeedbackThreadSummary {
    return new FeedbackThreadSummary(
      feedbackThreadSummaryBackendDict.status,
      feedbackThreadSummaryBackendDict.original_author_id,
      feedbackThreadSummaryBackendDict.last_updated_msecs,
      feedbackThreadSummaryBackendDict.last_message_text,
      feedbackThreadSummaryBackendDict.total_message_count,
      feedbackThreadSummaryBackendDict.last_message_is_read,
      feedbackThreadSummaryBackendDict.second_last_message_is_read,
      feedbackThreadSummaryBackendDict.author_last_message,
      feedbackThreadSummaryBackendDict.author_second_last_message,
      feedbackThreadSummaryBackendDict.exploration_title,
      feedbackThreadSummaryBackendDict.exploration_id,
      feedbackThreadSummaryBackendDict.thread_id);
  }
}

angular.module('oppia').factory(
  'FeedbackThreadSummaryObjectFactory',
  downgradeInjectable(FeedbackThreadSummaryObjectFactory));
