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

class SuggestionThread {
  status: string;
  subject: string;
  summary: string;
  originalAuthorName: string;
  lastUpdated: number;
  messageCount: number;
  threadId: string;
  suggestion: Suggestion;
  messages: Array<{text: string}>;
  constructor(
      status: string, subject: string, summary: string,
      originalAuthorName: string, lastUpdated: number, messageCount: number,
      threadId: string, suggestion: Suggestion) {
    this.status = status;
    this.subject = subject;
    this.summary = summary;
    this.originalAuthorName = originalAuthorName;
    this.lastUpdated = lastUpdated;
    this.messageCount = messageCount;
    this.threadId = threadId;
    this.suggestion = suggestion;
    this.messages = [];
  }

  setMessages(messages: Array<{text: string}>): void {
    this.messages = messages;
  }

  isSuggestionHandled(): boolean {
    return this.suggestion.status !== 'review';
  }

  getSuggestionStateName(): string {
    return this.suggestion.stateName;
  }

  getSuggestionStatus(): string {
    return this.suggestion.status;
  }

  getReplacementHtmlFromSuggestion(): string {
    return this.suggestion.newValue.html;
  }

  isSuggestionThread(): boolean {
    return true;
  }

  getSuggestion(): Suggestion {
    return this.suggestion;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SuggestionThreadObjectFactory {
  constructor(private suggestionObjectFactory: SuggestionObjectFactory) {}
  // TODO(#7165): Replace 'any' with the exact type.
  createFromBackendDicts(
      suggestionThreadBackendDict: any,
      suggestionBackendDict: any): SuggestionThread {
    let suggestion;
    if (suggestionBackendDict.suggestion_type ===
        'edit_exploration_state_content') {
      suggestion = this.suggestionObjectFactory.createFromBackendDict(
        suggestionBackendDict);
    }
    return new SuggestionThread(
      suggestionThreadBackendDict.status, suggestionThreadBackendDict.subject,
      suggestionThreadBackendDict.summary,
      suggestionThreadBackendDict.original_author_username,
      suggestionThreadBackendDict.last_updated,
      suggestionThreadBackendDict.message_count,
      suggestionThreadBackendDict.thread_id, suggestion);
  }
}

angular.module('oppia').factory(
  'SuggestionThreadObjectFactory',
  downgradeInjectable(SuggestionThreadObjectFactory));
