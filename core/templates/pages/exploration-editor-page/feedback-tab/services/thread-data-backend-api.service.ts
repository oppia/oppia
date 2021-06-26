// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for getting thread data from the backend for the
 * feedback tab of the exploration editor.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { downgradeInjectable } from '@angular/upgrade/static';

import { forkJoin } from 'rxjs';

import { AppConstants } from 'app.constants';
import { FeedbackThread, FeedbackThreadBackendDict, FeedbackThreadObjectFactory } from 'domain/feedback_thread/FeedbackThreadObjectFactory';
import { ThreadMessage, ThreadMessageBackendDict } from 'domain/feedback_message/ThreadMessage.model';
import { SuggestionBackendDict } from 'domain/suggestion/suggestion.model';
import { SuggestionThread, SuggestionThreadObjectFactory } from 'domain/suggestion/SuggestionThreadObjectFactory';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ExplorationEditorPageConstants } from 'pages/exploration-editor-page/exploration-editor-page.constants';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { SuggestionsService } from 'services/suggestions.service';

type SuggestionAndFeedbackThread = FeedbackThread | SuggestionThread;

interface NumberOfOpenThreads {
  'num_open_threads': number;
}

interface SuggestionAndFeedbackThreads {
  feedbackThreads: FeedbackThread[];
  suggestionThreads: SuggestionThread[];
}

interface SuggestionData {
  suggestions: SuggestionBackendDict[];
}

interface ThreadData {
  'feedback_thread_dicts': FeedbackThreadBackendDict[];
  'suggestion_thread_dicts': FeedbackThreadBackendDict[];
}

interface ThreadMessages {
  'messages': ThreadMessageBackendDict[];
}

@Injectable({
  providedIn: 'root'
})
export class ThreadDataBackendApiService {
  // Container for all of the threads related to this exploration.
  threadsById: Map<string, SuggestionAndFeedbackThread> = (
    new Map<string, SuggestionAndFeedbackThread>());

  // Cached number of open threads requiring action.
  openThreadsCount: number = 0;

  constructor(
    private alertsService: AlertsService,
    private contextService: ContextService,
    private feedbackThreadObjectFactory: FeedbackThreadObjectFactory,
    private http: HttpClient,
    private suggestionThreadObjectFactory: SuggestionThreadObjectFactory,
    private suggestionsService: SuggestionsService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  getFeedbackStatsHandlerUrl(): string {
    return this.urlInterpolationService.interpolateUrl(
      '/feedbackstatshandler/<exploration_id>', {
        exploration_id: this.contextService.getExplorationId()
      });
  }

  getFeedbackThreadViewEventUrl(threadId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      '/feedbackhandler/thread_view_event/<thread_id>', {
        thread_id: threadId
      });
  }

  getSuggestionActionHandlerUrl(threadId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      '/suggestionactionhandler/exploration/<exploration_id>/<thread_id>', {
        exploration_id: this.contextService.getExplorationId(),
        thread_id: threadId
      });
  }

  getSuggestionListHandlerUrl(): string {
    return '/suggestionlisthandler';
  }

  getThreadHandlerUrl(threadId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      '/threadhandler/<thread_id>', {
        thread_id: threadId
      });
  }

  getThreadListHandlerUrl(): string {
    return this.urlInterpolationService.interpolateUrl(
      '/threadlisthandler/<exploration_id>', {
        exploration_id: this.contextService.getExplorationId()
      });
  }

  setFeedbackThreadFromBackendDict(
      threadBackendDict: FeedbackThreadBackendDict): FeedbackThread {
    if (!threadBackendDict) {
      throw new Error('Missing input backend dict');
    }
    let thread = this.feedbackThreadObjectFactory.createFromBackendDict(
      threadBackendDict);
    this.threadsById.set(thread.threadId, thread);
    return thread;
  }

  setSuggestionThreadFromBackendDicts(
      threadBackendDict: FeedbackThreadBackendDict,
      suggestionBackendDict: SuggestionBackendDict): SuggestionThread {
    if (!threadBackendDict || !suggestionBackendDict) {
      throw new Error('Missing input backend dicts');
    }
    let thread = this.suggestionThreadObjectFactory.createFromBackendDicts(
      threadBackendDict, suggestionBackendDict);
    this.threadsById.set(thread.threadId, thread);
    return thread;
  }

  getThread(threadId: string): SuggestionAndFeedbackThread {
    return this.threadsById.get(threadId) || null;
  }

  async getThreadsAsync(): Promise<SuggestionAndFeedbackThreads> {
    let suggestions$ = this.http.get(this.getSuggestionListHandlerUrl(), {
      params: {
        target_type: 'exploration',
        target_id: this.contextService.getExplorationId()
      }
    });

    let threads$ = this.http.get(this.getThreadListHandlerUrl());

    return forkJoin([suggestions$, threads$])
      .toPromise()
      .then((response: [SuggestionData, ThreadData]) => {
        let [suggestionData, threadData] = response;
        let suggestionBackendDicts: SuggestionBackendDict[] = (
          suggestionData.suggestions);
        let feedbackThreadBackendDicts = threadData.feedback_thread_dicts;
        let suggestionThreadBackendDicts = threadData.suggestion_thread_dicts;

        let suggestionBackendDictsByThreadId = new Map(
          suggestionBackendDicts.map(dict => [
            this.suggestionsService.getThreadIdFromSuggestionBackendDict(dict),
            dict
          ]));

        return {
          feedbackThreads: feedbackThreadBackendDicts.map(
            dict => this.setFeedbackThreadFromBackendDict(dict)),
          suggestionThreads: suggestionThreadBackendDicts.map(
            dict => this.setSuggestionThreadFromBackendDicts(
              dict, suggestionBackendDictsByThreadId.get(
                (dict === null ? null : dict.thread_id))))
        };
      },
      async() => Promise.reject('Error on retrieving feedback threads.'));
  }

  async getMessagesAsync(thread: SuggestionAndFeedbackThread):
   Promise<ThreadMessage[]> {
    if (!thread) {
      throw new Error('Trying to update a non-existent thread');
    }
    let threadId = thread.threadId;

    return this.http.get(this.getThreadHandlerUrl(threadId)).toPromise()
      .then((response: ThreadMessages) => {
        let threadMessageBackendDicts = response.messages;
        thread.setMessages(threadMessageBackendDicts.map(
          m => ThreadMessage.createFromBackendDict(m)));
        return thread.getMessages();
      });
  }

  async getOpenThreadsCountAsync(): Promise<number> {
    return this.http.get(this.getFeedbackStatsHandlerUrl()).toPromise()
      .then((response: NumberOfOpenThreads) => {
        return this.openThreadsCount = response.num_open_threads;
      });
  }

  getOpenThreadsCount(): number {
    return this.openThreadsCount;
  }

  async createNewThreadAsync(newSubject: string, newText: string):
    Promise<void | SuggestionAndFeedbackThreads> {
    return this.http.post(this.getThreadListHandlerUrl(), {
      state_name: null,
      subject: newSubject,
      text: newText
    }).toPromise().then(async() => {
      this.openThreadsCount += 1;
      return this.getThreadsAsync();
    },
    error => {
      this.alertsService.addWarning(
        'Error creating new thread: ' + error + '.');
    });
  }

  async markThreadAsSeenAsync(
      thread: SuggestionAndFeedbackThread): Promise<void> {
    if (!thread) {
      throw new Error('Trying to update a non-existent thread');
    }
    let threadId = thread.threadId;

    return this.http.post(this.getFeedbackThreadViewEventUrl(threadId), {
      thread_id: threadId
    }).toPromise().then();
  }

  async addNewMessageAsync(
      thread: SuggestionAndFeedbackThread, newMessage: string,
      newStatus: string): Promise<ThreadMessage[]> {
    if (!thread) {
      throw new Error('Trying to update a non-existent thread');
    }
    let threadId = thread.threadId;
    let oldStatus = thread.status;
    let updatedStatus = (oldStatus === newStatus) ? null : newStatus;

    return this.http.post(this.getThreadHandlerUrl(threadId), {
      updated_status: updatedStatus,
      updated_subject: null,
      text: newMessage
    }).toPromise().then((response: ThreadMessages) => {
      if (updatedStatus) {
        if (newStatus === ExplorationEditorPageConstants.STATUS_OPEN) {
          this.openThreadsCount += 1;
        } else {
          this.openThreadsCount += (
            oldStatus === ExplorationEditorPageConstants.STATUS_OPEN ? -1 : 0);
        }
      }
      thread.status = newStatus;
      let threadMessageBackendDicts = response.messages;
      thread.setMessages(threadMessageBackendDicts.map(
        m => ThreadMessage.createFromBackendDict(m)));
      return thread.messages;
    });
  }

  async resolveSuggestionAsync(
      thread: SuggestionAndFeedbackThread, action: string, commitMsg: string,
      reviewMsg: string): Promise<ThreadMessage[]> {
    if (!thread) {
      throw new Error('Trying to update a non-existent thread');
    }
    let threadId = thread.threadId;

    return this.http.put(this.getSuggestionActionHandlerUrl(threadId), {
      action: action,
      review_message: reviewMsg,
      commit_message: (
        action === AppConstants.ACTION_ACCEPT_SUGGESTION ?
          commitMsg : null)
    }).toPromise().then(async() => {
      thread.status = (
        action === AppConstants.ACTION_ACCEPT_SUGGESTION ?
         ExplorationEditorPageConstants.STATUS_FIXED :
          ExplorationEditorPageConstants.STATUS_IGNORED);
      this.openThreadsCount -= 1;

      return this.getMessagesAsync(thread);
    });
  }
}

angular.module('oppia').factory(
  'ThreadDataBackendApiService',
  downgradeInjectable(ThreadDataBackendApiService));
