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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { Suggestion, SuggestionObjectFactory } from
  'domain/suggestion/SuggestionObjectFactory';
import { ThreadMessage } from
  'domain/feedback_message/ThreadMessageObjectFactory';
import { ThreadMessageSummary, ThreadMessageSummaryObjectFactory } from
  'domain/feedback_message/ThreadMessageSummaryObjectFactory';

export class SuggestionThread {
  status: string;
  subject: string;
  summary: string;
  originalAuthorName: string;
  lastUpdatedMsecs: number;
  messageCount: number;
  threadId: string;
  suggestion: Suggestion;
  lastNonemptyMessageSummary: ThreadMessageSummary;
  messages: ThreadMessage[] = [];

  constructor(
      status: string, subject: string, summary: string,
      originalAuthorName: string, lastUpdatedMsecs: number,
      messageCount: number, threadId: string,
      lastNonemptyMessageSummary: ThreadMessageSummary,
      suggestion: Suggestion) {
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

  getSuggestion(): Suggestion {
    return this.suggestion;
  }
}

@Injectable({providedIn: 'root'})
export class SuggestionThreadObjectFactory {
  constructor(
    private suggestionObjectFactory: SuggestionObjectFactory,
    private threadMessageSummaryObjectFactory:
      ThreadMessageSummaryObjectFactory) {}

  private createEditExplorationStateContentSuggestionFromBackendDict(
      suggestionBackendDict: any): Suggestion {
    if (suggestionBackendDict.suggestion_type !==
        'edit_exploration_state_content') {
      return null;
    }
    return this.suggestionObjectFactory.createFromBackendDict(
      suggestionBackendDict);
  }

  // TODO(#7165): Replace 'any' with the exact type.
  createFromBackendDicts(
      suggestionThreadBackendDict: any,
      suggestionBackendDict: any): SuggestionThread {
    return new SuggestionThread(
      suggestionThreadBackendDict.status, suggestionThreadBackendDict.subject,
      suggestionThreadBackendDict.summary,
      suggestionThreadBackendDict.original_author_username,
      suggestionThreadBackendDict.last_updated_msecs,
      suggestionThreadBackendDict.message_count,
      suggestionThreadBackendDict.thread_id,
      this.threadMessageSummaryObjectFactory.createNew(
        suggestionThreadBackendDict.last_nonempty_message_author,
        suggestionThreadBackendDict.last_nonempty_message_text),
      this.createEditExplorationStateContentSuggestionFromBackendDict(
        suggestionBackendDict));
  }
}

angular.module('oppia').factory(
  'SuggestionThreadObjectFactory',
  downgradeInjectable(SuggestionThreadObjectFactory));
