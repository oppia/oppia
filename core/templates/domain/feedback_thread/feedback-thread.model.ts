// Copyright 2024 The Oppia Authors.
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
 * @fileoverview Model for creating new frontend instances of feedback
 * thread domain objects.
 */

import { ThreadMessage } from 'domain/feedback_message/ThreadMessage.model';
import { ThreadMessageSummary } from 'domain/feedback_message/ThreadMessageSummary.model';

export interface FeedbackThreadBackendDict {
  status: string;
  subject: string;
  summary: string;
  original_author_username: string;
  last_updated_msecs: number;
  message_count: number;
  state_name: string;
  thread_id: string;
  last_nonempty_message_author: string;
  last_nonempty_message_text: string;
}

export class FeedbackThread {
  constructor(
    public status: string,
    public subject: string,
    public summary: string,
    public originalAuthorName: string,
    public lastUpdatedMsecs: number,
    public messageCount: number,
    public stateName: string,
    public threadId: string,
    public lastNonemptyMessageSummary: ThreadMessageSummary,
    private messages: ThreadMessage[] = []
  ) {}

  static createFromBackendDict(
    backendDict: FeedbackThreadBackendDict
  ): FeedbackThread {
    return new FeedbackThread(
      backendDict.status,
      backendDict.subject,
      backendDict.summary,
      backendDict.original_author_username,
      backendDict.last_updated_msecs,
      backendDict.message_count,
      backendDict.state_name,
      backendDict.thread_id,
      new ThreadMessageSummary(
        backendDict.last_nonempty_message_author,
        backendDict.last_nonempty_message_text
      )
    );
  }

  setMessages(messages: ThreadMessage[]): void {
    this.messages = messages;
    this.messageCount = messages.length;

    const nonemptyMessages = messages.filter(m => m.hasText());
    if (nonemptyMessages.length > 0) {
      this.lastNonemptyMessageSummary =
        nonemptyMessages[nonemptyMessages.length - 1].summary;
    }
  }

  getMessages(): ThreadMessage[] {
    return this.messages;
  }

  isSuggestionThread(): boolean {
    return false;
  }
}
