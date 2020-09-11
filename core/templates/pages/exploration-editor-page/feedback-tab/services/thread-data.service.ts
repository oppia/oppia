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
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
// Import cloneDeep from 'lodash/cloneDeep';
import {FeedbackThread, FeedbackThreadBackendDict, FeedbackThreadObjectFactory }
  from 'domain/feedback_thread/FeedbackThreadObjectFactory';
import { SuggestionThread, SuggestionThreadObjectFactory } from
  'domain/suggestion/SuggestionThreadObjectFactory';
import { ThreadMessage, ThreadMessageObjectFactory } from
  'domain/feedback_message/ThreadMessageObjectFactory';
import { SuggestionBackendDict } from
  'domain/suggestion/SuggestionObjectFactory';
import { HttpClient } from '@angular/common/http';
import { AlertsService } from 'services/alerts.service.ts';
import { ContextService } from 'services/context.service.ts';
import { SuggestionsService } from 'services/suggestions.service.ts';
import { UrlInterpolationService }
  from 'domain/utilities/url-interpolation.service.ts';
import { ExplorationEditorPageConstants } from
  'pages/exploration-editor-page/exploration-editor-page.constants';

const ACTION_ACCEPT_SUGGESTION =
ExplorationEditorPageConstants.ACTION_ACCEPT_SUGGESTION;
const STATUS_FIXED = ExplorationEditorPageConstants.STATUS_FIXED;
const STATUS_IGNORED = ExplorationEditorPageConstants.STATUS_IGNORED;
const STATUS_OPEN = ExplorationEditorPageConstants.STATUS_OPEN;

type AnyThread = FeedbackThread | SuggestionThread;

interface SuggestionAndFeedbackThreads {
  feedbackThreads: FeedbackThread[];
  suggestionThreads: SuggestionThread[];
}

@Injectable({
  providedIn: 'root'
})
export class ThreadDataService {
  constructor(
    private http: HttpClient,
    private feedbackThreadObjectFactory: FeedbackThreadObjectFactory,
    private urlInterpolationService: UrlInterpolationService,
    private contextService: ContextService,
    private suggestionsService: SuggestionsService,
    private alertsService: AlertsService,
    private threadMessageObjectFactory: ThreadMessageObjectFactory,
    private suggestionThreadObjectFactory: SuggestionThreadObjectFactory
  ) {}
    // Container for all of the threads related to this exploration.
    private threadsById = new Map<string, AnyThread>();

    // Cached number of open threads requiring action.
    private openThreadsCount: number = 0;

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

    getThread(threadId: string): AnyThread {
      return this.threadsById.get(threadId) || null;
    }

    getThreadsAsync(): Promise<SuggestionAndFeedbackThreads> {
      // TODO(#8016): Move this this.http call
      // to a backend-api.service with unit
      // tests.
      let suggestionsPromise = this.http.get(
        this.getSuggestionListHandlerUrl(), {
          params: {
            target_type: 'exploration',
            target_id: this.contextService.getExplorationId()
          }
        });
      // TODO(#8016): Move this
      // this.http call to a backend-api.service with unit
      // tests.
      let threadsPromise = this.http.get(this.getThreadListHandlerUrl());

      return Promise.all([suggestionsPromise, threadsPromise])
        .then(response => {
          let [suggestionData, threadData] = response.map(r => r.data);
          let suggestionBackendDicts: SuggestionBackendDict[] = (
            suggestionData.suggestions);
          let feedbackThreadBackendDicts = threadData.feedback_thread_dicts;
          let suggestionThreadBackendDicts =
          threadData.suggestion_thread_dicts;

          let suggestionBackendDictsByThreadId = new Map(
            suggestionBackendDicts.map(dict => [
              this.suggestionsService.getThreadIdFromSuggestionBackendDict(
                dict),
              dict
            ]));

          return {
            feedbackThreads: feedbackThreadBackendDicts.map(
              dict => this.setFeedbackThreadFromBackendDict(dict)),
            suggestionThreads: suggestionThreadBackendDicts.map(
              dict => this.setSuggestionThreadFromBackendDicts(
                dict, suggestionBackendDictsByThreadId.get(dict.thread_id)))
          };
        }, (err) => {
          throw ('Error on retrieving feedback threads.');
        });
    }

    getMessagesAsync(
        thread: AnyThread): Promise<void | ThreadMessage[]> {
      if (!thread) {
        throw new Error('Trying to update a non-existent thread');
      }
      let threadId = thread.threadId;
      // TODO(#8016): Move this this.http call
      // to a backend-api.service with unit
      // tests.
      return this.http.get(this.getThreadHandlerUrl(threadId)).toPromise()
        .then(response => {
          let threadMessageBackendDicts = response.body.messages;
          thread.setMessages(threadMessageBackendDicts.map(
            m => this.threadMessageObjectFactory.createFromBackendDict(m)));
          // $rootScope.$apply();
          return thread.getMessages();
        }, (errorResponse) => {
          this.errorCallback(errorResponse.error.error);
        });
    }

    getOpenThreadsCountAsync(): Promise<number> {
      // TODO(#8016): Move this this.http call
      // to a backend-api.service with unit
      // tests.
      return this.http.get(this.getFeedbackStatsHandlerUrl()).toPromise()
        .then(response => {
          // $rootScope.$apply();
          return this.openThreadsCount = response.body.num_open_threads;
        }, (errorResponse) => {
          this.errorCallback(errorResponse.error.error);
        });
    }

    getOpenThreadsCount(): number {
      return this.openThreadsCount;
    }

    createNewThreadAsync(
        newSubject: string,
        newText: string): Promise<void | SuggestionAndFeedbackThreads> {
      // TODO(#8016): Move this this.http call
      // to a backend-api.service with unit
      // tests.
      return this.http.post(this.getThreadListHandlerUrl(), {
        state_name: null,
        subject: newSubject,
        text: newText
      }).toPromise().then(() => {
        this.openThreadsCount += 1;
        // $rootScope.$apply();
        return this.getThreadsAsync();
      },
      error => {
        this.alertsService.addWarning(
          'Error creating new thread: ' + error + '.');
      });
    }

    markThreadAsSeenAsync(thread: AnyThread): Promise<void> {
      if (!thread) {
        throw new Error('Trying to update a non-existent thread');
      }
      let threadId = thread.threadId;
      // TODO(#8016): Move this this.http call
      // to a backend-api.service with unit
      // tests.
      return this.http.post(this.getFeedbackThreadViewEventUrl(threadId), {
        thread_id: threadId
      });
    }

    addNewMessageAsync(
        thread: AnyThread, newMessage: string,
        newStatus: string): Promise<void | ThreadMessage[]> {
      if (!thread) {
        throw new Error('Trying to update a non-existent thread');
      }
      let threadId = thread.threadId;
      let oldStatus = thread.status;
      let updatedStatus = (oldStatus === newStatus) ? null : newStatus;
      // TODO(#8016): Move this this.http call
      // to a backend-api.service with unit
      // tests.
      return this.http.post(this.getThreadHandlerUrl(threadId), {
        updated_status: updatedStatus,
        updated_subject: null,
        text: newMessage
      }).toPromise().then((response) => {
        if (updatedStatus) {
          this.openThreadsCount += (newStatus === STATUS_OPEN) ? 1 : -1;
        }
        thread.status = newStatus;
        let threadMessageBackendDicts = response.body.messages;
        thread.setMessages(threadMessageBackendDicts.map(
          m => this.threadMessageObjectFactory.createFromBackendDict(m)));
        // $rootScope.$apply();
        return thread.messages;
      }, (errorResponse) => {
        this.errorCallback(errorResponse.error.error);
      });
    }

    resolveSuggestionAsync(
        thread: AnyThread, action: string, commitMsg: string,
        reviewMsg: string): Promise<void | ThreadMessage[]> {
      if (!thread) {
        throw new Error('Trying to update a non-existent thread');
      }
      let threadId = thread.threadId;
      // TODO(#8016): Move this this.http call
      // to a backend-api.service with unit
      // tests.
      return this.http.put(this.getSuggestionActionHandlerUrl(threadId), {
        action: action,
        review_message: reviewMsg,
        commit_message: action === ACTION_ACCEPT_SUGGESTION ?
        commitMsg : null
      }).toPromise().then(() => {
        thread.status =
          action === ACTION_ACCEPT_SUGGESTION ?
          STATUS_FIXED : STATUS_IGNORED;
        this.openThreadsCount -= 1;
        // TODO(#8678): Update the cache with the message
        // instead of fetching the messages every time from the backend.
        // $rootScope.$apply();
        return this.getMessagesAsync(thread);
      }, (errorResponse) => {
        this.errorCallback(errorResponse.error.error);
      });
    }
}

angular.module('oppia').factory(
  'ThreadDataService',
  downgradeInjectable(ThreadDataService));
