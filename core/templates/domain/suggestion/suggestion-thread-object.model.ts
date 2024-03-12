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
 * @fileoverview Factory for creating new frontend instances of suggestion
   thread domain objects.
 */

import {
  SuggestionBackendDict,
  Suggestion,
} from 'domain/suggestion/suggestion.model';
import {ThreadMessage} from 'domain/feedback_message/ThreadMessage.model';
import {ThreadMessageSummary} from 'domain/feedback_message/ThreadMessageSummary.model';
import {FeedbackThreadBackendDict} from 'domain/feedback_thread/FeedbackThreadObjectFactory';

export class SuggestionThread {
  status: string;
  subject: string;
  summary: string;
  originalAuthorName: string;
  lastUpdatedMsecs: number;
  messageCount: number;
  threadId: string;
  // A suggestion only exists for the type 'edit_exploration_state_content' and
  // null otherwise.
  suggestion: Suggestion | null;
  lastNonemptyMessageSummary: ThreadMessageSummary;
  messages: ThreadMessage[] = [];

  constructor(
    status: string,
    subject: string,
    summary: string,
    originalAuthorName: string,
    lastUpdatedMsecs: number,
    messageCount: number,
    threadId: string,
    lastNonemptyMessageSummary: ThreadMessageSummary,
    suggestion: Suggestion | null
  ) {
    this.status = status;
    this.subject = subject;
    this.summary = summary;
    this.originalAuthorName = originalAuthorName;
    this.lastUpdatedMsecs = lastUpdatedMsecs;
    this.messageCount = messageCount;
    this.threadId = threadId;
    this.lastNonemptyMessageSummary = lastNonemptyMessageSummary;
    this.suggestion = suggestion;
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

  isSuggestionHandled(): boolean | null {
    return this.suggestion ? this.suggestion.status !== 'review' : null;
  }

  getSuggestionStateName(): string | null {
    return this.suggestion ? this.suggestion.stateName : null;
  }

  setSuggestionStatus(status: string): void {
    if (this.suggestion) {
      this.suggestion.status = status;
    }
  }

  getSuggestionStatus(): string | null {
    return this.suggestion ? this.suggestion.status : null;
  }

  getReplacementHtmlFromSuggestion(): string | null {
    return this.suggestion ? this.suggestion.newValue.html : null;
  }

  isSuggestionThread(): boolean {
    return true;
  }

  getSuggestion(): Suggestion | null {
    return this.suggestion;
  }

  private static createEditExplorationStateContentSuggestionFromBackendDict(
    suggestionBackendDict: SuggestionBackendDict
  ): Suggestion | null {
    if (
      suggestionBackendDict.suggestion_type !== 'edit_exploration_state_content'
    ) {
      return null;
    }
    return Suggestion.createFromBackendDict(suggestionBackendDict);
  }

  static createFromBackendDicts(
    feedbackThreadBackendDict: FeedbackThreadBackendDict,
    suggestionBackendDict: SuggestionBackendDict
  ): SuggestionThread {
    return new SuggestionThread(
      feedbackThreadBackendDict.status,
      feedbackThreadBackendDict.subject,
      feedbackThreadBackendDict.summary,
      feedbackThreadBackendDict.original_author_username,
      feedbackThreadBackendDict.last_updated_msecs,
      feedbackThreadBackendDict.message_count,
      feedbackThreadBackendDict.thread_id,
      new ThreadMessageSummary(
        feedbackThreadBackendDict.last_nonempty_message_author,
        feedbackThreadBackendDict.last_nonempty_message_text
      ),
      this.createEditExplorationStateContentSuggestionFromBackendDict(
        suggestionBackendDict
      )
    );
  }
}
