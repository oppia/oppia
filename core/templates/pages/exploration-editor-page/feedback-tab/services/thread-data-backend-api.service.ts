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

import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {AppConstants} from 'app.constants';
import {
  FeedbackThread,
  FeedbackThreadBackendDict,
  FeedbackThreadObjectFactory,
} from 'domain/feedback_thread/FeedbackThreadObjectFactory';
import {
  ThreadMessage,
  ThreadMessageBackendDict,
} from 'domain/feedback_message/ThreadMessage.model';
import {SuggestionThread} from 'domain/suggestion/suggestion-thread-object.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ExplorationEditorPageConstants} from 'pages/exploration-editor-page/exploration-editor-page.constants';
import {AlertsService} from 'services/alerts.service';
import {ContextService} from 'services/context.service';

export type SuggestionAndFeedbackThread = FeedbackThread | SuggestionThread;

export interface FeedbackThreads {
  feedbackThreads: FeedbackThread[];
}

interface FeedbackThreadData {
  feedback_thread_dicts: FeedbackThreadBackendDict[];
}

export interface ThreadMessages {
  messages: ThreadMessageBackendDict[];
}

@Injectable({
  providedIn: 'root',
})
export class ThreadDataBackendApiService {
  // Container for all of the threads related to this exploration.
  threadsById: Map<string, SuggestionAndFeedbackThread> = new Map<
    string,
    SuggestionAndFeedbackThread
  >();

  // Cached number of open threads requiring action.
  feedbackThreads: FeedbackThread[] | undefined;
  countOfOpenFeedbackThreads = 0;
  _feedbackThreadsInitializedEventEmitter = new EventEmitter();

  constructor(
    private alertsService: AlertsService,
    private contextService: ContextService,
    private feedbackThreadObjectFactory: FeedbackThreadObjectFactory,
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  getFeedbackThreadViewEventUrl(threadId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      '/feedbackhandler/thread_view_event/<thread_id>',
      {
        thread_id: threadId,
      }
    );
  }

  getSuggestionActionHandlerUrl(threadId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      '/suggestionactionhandler/exploration/<exploration_id>/<thread_id>',
      {
        exploration_id: this.contextService.getExplorationId(),
        thread_id: threadId,
      }
    );
  }

  getThreadHandlerUrl(threadId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      '/threadhandler/<thread_id>',
      {
        thread_id: threadId,
      }
    );
  }

  getThreadListHandlerUrl(): string {
    return this.urlInterpolationService.interpolateUrl(
      '/threadlisthandler/<exploration_id>',
      {
        exploration_id: this.contextService.getExplorationId(),
      }
    );
  }

  setFeedbackThreadFromBackendDict(
    threadBackendDict: FeedbackThreadBackendDict
  ): FeedbackThread {
    if (!threadBackendDict) {
      throw new Error('Missing input backend dict');
    }
    let thread =
      this.feedbackThreadObjectFactory.createFromBackendDict(threadBackendDict);
    this.threadsById.set(thread.threadId, thread);
    return thread;
  }

  // A 'null' value will be returned if threadId is invalid.
  getThread(threadId: string): SuggestionAndFeedbackThread | null {
    return this.threadsById.get(threadId) || null;
  }

  get onFeedbackThreadsInitialized(): EventEmitter<string> {
    return this._feedbackThreadsInitializedEventEmitter;
  }

  async getFeedbackThreadsAsync(useCache = true): Promise<FeedbackThread[]> {
    if (!this.feedbackThreads || !useCache) {
      const threads = this.http.get<FeedbackThreadData>(
        this.getThreadListHandlerUrl()
      );

      return threads.toPromise().then(
        (response: FeedbackThreadData) => {
          const feedbackThreadBackendDicts = response.feedback_thread_dicts;
          this.countOfOpenFeedbackThreads = feedbackThreadBackendDicts.filter(
            thread => thread?.status === 'open'
          ).length;

          this.feedbackThreads = feedbackThreadBackendDicts.map(dict =>
            this.setFeedbackThreadFromBackendDict(dict)
          );
          // Open Threads should be displayed first and older threads should be
          // Given priority over newer threads,
          // While addressed threads are sorted by last updated time.
          let openFeedbackThreads: FeedbackThread[] = [];
          let otherFeedbackThreads: FeedbackThread[] = [];
          for (let i = 0; i < this.feedbackThreads.length; i++) {
            if (this.feedbackThreads[i].status === 'open') {
              openFeedbackThreads.push(this.feedbackThreads[i]);
            } else {
              otherFeedbackThreads.push(this.feedbackThreads[i]);
            }
          }
          openFeedbackThreads.reverse();
          this.feedbackThreads =
            openFeedbackThreads.concat(otherFeedbackThreads);
          this._feedbackThreadsInitializedEventEmitter.emit();
          return this.feedbackThreads;
        },
        () => {
          this.feedbackThreads = [];
          this.countOfOpenFeedbackThreads = 0;
          this._feedbackThreadsInitializedEventEmitter.emit();
          return this.feedbackThreads;
        }
      );
    } else {
      return this.feedbackThreads;
    }
  }

  async getMessagesAsync(
    thread: SuggestionAndFeedbackThread
  ): Promise<ThreadMessage[]> {
    if (!thread) {
      throw new Error('Trying to update a non-existent thread');
    }
    let threadId = thread.threadId;

    return this.http
      .get<ThreadMessages>(this.getThreadHandlerUrl(threadId))
      .toPromise()
      .then((response: ThreadMessages) => {
        let threadMessageBackendDicts = response.messages;
        thread.setMessages(
          threadMessageBackendDicts.map(m =>
            ThreadMessage.createFromBackendDict(m)
          )
        );
        return thread.getMessages();
      });
  }

  async fetchMessagesAsync(threadId: string): Promise<ThreadMessages> {
    return this.http
      .get<ThreadMessages>(this.getThreadHandlerUrl(threadId))
      .toPromise();
  }

  getOpenThreadsCount(): number {
    return this.countOfOpenFeedbackThreads || 0;
  }

  async createNewThreadAsync(
    newSubject: string,
    newText: string
  ): Promise<void | FeedbackThread[]> {
    return this.http
      .post<void | FeedbackThread[]>(this.getThreadListHandlerUrl(), {
        subject: newSubject,
        text: newText,
      })
      .toPromise()
      .then(
        async () => {
          this.countOfOpenFeedbackThreads += 1;
          return this.getFeedbackThreadsAsync(false);
        },
        error => {
          this.alertsService.addWarning(
            'Error creating new thread: ' + error + '.'
          );
        }
      );
  }

  async markThreadAsSeenAsync(
    thread: SuggestionAndFeedbackThread
  ): Promise<void> {
    if (!thread) {
      throw new Error('Trying to update a non-existent thread');
    }
    let threadId = thread.threadId;

    return this.http
      .post(this.getFeedbackThreadViewEventUrl(threadId), {})
      .toPromise()
      .then();
  }

  async addNewMessageAsync(
    thread: SuggestionAndFeedbackThread,
    newMessage: string,
    newStatus: string
  ): Promise<ThreadMessage[]> {
    if (!thread) {
      throw new Error('Trying to update a non-existent thread');
    }
    let threadId = thread.threadId;
    let oldStatus = thread.status;
    let updatedStatus = oldStatus === newStatus ? null : newStatus;

    return this.http
      .post<ThreadMessages>(this.getThreadHandlerUrl(threadId), {
        updated_status: updatedStatus,
        updated_subject: null,
        text: newMessage,
      })
      .toPromise()
      .then((response: ThreadMessages) => {
        if (updatedStatus) {
          if (newStatus === ExplorationEditorPageConstants.STATUS_OPEN) {
            this.countOfOpenFeedbackThreads += 1;
          } else {
            this.countOfOpenFeedbackThreads +=
              oldStatus === ExplorationEditorPageConstants.STATUS_OPEN ? -1 : 0;
          }
        }
        thread.status = newStatus;
        let threadMessageBackendDicts = response.messages;
        thread.setMessages(
          threadMessageBackendDicts.map(m =>
            ThreadMessage.createFromBackendDict(m)
          )
        );
        return thread.messages;
      });
  }

  async resolveSuggestionAsync(
    thread: SuggestionAndFeedbackThread,
    action: string,
    commitMsg: string,
    reviewMsg: string
  ): Promise<ThreadMessage[]> {
    if (!thread) {
      throw new Error('Trying to update a non-existent thread');
    }
    let threadId = thread.threadId;

    return this.http
      .put(this.getSuggestionActionHandlerUrl(threadId), {
        action: action,
        review_message: reviewMsg,
        commit_message:
          action === AppConstants.ACTION_ACCEPT_SUGGESTION ? commitMsg : null,
      })
      .toPromise()
      .then(async () => {
        thread.status =
          action === AppConstants.ACTION_ACCEPT_SUGGESTION
            ? ExplorationEditorPageConstants.STATUS_FIXED
            : ExplorationEditorPageConstants.STATUS_IGNORED;

        return this.getMessagesAsync(thread);
      });
  }
}
