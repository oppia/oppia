// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service that decides where the learner lands when they leave
 * the lesson player.
 */

import {Injectable} from '@angular/core';
import {UrlService} from 'services/contextual/url.service';
import {LocalStorageService} from 'services/local-storage.service';

export interface PostSignInExitIntent {
  explorationId: string;
  // The page to send the learner to once their progress has been synced: the
  // topic page for curated lessons, the learner dashboard otherwise.
  destinationUrl: string;
  createdAtMsec: number;
}

export const LEARNER_DASHBOARD_URL = '/learner-dashboard';

// How long a sign-in started from the exit modal stays valid. After this, we
// treat the intent as stale so that an unrelated later visit to the lesson
// never triggers a surprise redirect.
export const POST_SIGN_IN_EXIT_INTENT_TTL_MSEC = 60 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class LessonExitService {
  constructor(
    private urlService: UrlService,
    private localStorageService: LocalStorageService
  ) {}

  isCuratedLesson(): boolean {
    try {
      return Boolean(
        this.urlService.getClassroomUrlFragmentFromLearnerUrl() &&
          this.urlService.getTopicUrlFragmentFromLearnerUrl() &&
          this.urlService.getStoryUrlFragmentFromLearnerUrl()
      );
    } catch (e) {
      return false;
    }
  }

  getExitUrl(): string {
    if (this.isCuratedLesson()) {
      return this.urlService.getLearnerTopicStoryUrl();
    }
    const collectionId = this.urlService.getCollectionIdFromExplorationUrl();
    if (collectionId) {
      return '/collection/' + encodeURIComponent(collectionId);
    }
    return '/community-library';
  }

  isExitModalHidden(username: string): boolean {
    return this.localStorageService.isLessonExitModalHidden(username);
  }

  hideExitModal(username: string): void {
    this.localStorageService.setLessonExitModalHidden(username, true);
  }

  saveSignInIntent(explorationId: string): void {
    const intent: PostSignInExitIntent = {
      explorationId: explorationId,
      destinationUrl: this.isCuratedLesson()
        ? this.urlService.getLearnerTopicStoryUrl()
        : LEARNER_DASHBOARD_URL,
      createdAtMsec: Date.now(),
    };
    this.localStorageService.setPostSignInExitIntent(JSON.stringify(intent));
  }

  consumeSignInIntent(explorationId: string): PostSignInExitIntent | null {
    const rawIntent = this.localStorageService.getPostSignInExitIntent();
    this.clearSignInIntent();
    if (!rawIntent) {
      return null;
    }
    try {
      const intent = JSON.parse(rawIntent) as PostSignInExitIntent;
      const isFresh =
        Date.now() - intent.createdAtMsec <= POST_SIGN_IN_EXIT_INTENT_TTL_MSEC;
      if (intent.explorationId === explorationId && isFresh) {
        return intent;
      }
    } catch (e) {}
    return null;
  }

  clearSignInIntent(): void {
    this.localStorageService.removePostSignInExitIntent();
  }
}
