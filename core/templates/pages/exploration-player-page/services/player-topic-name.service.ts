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
 * @fileoverview Service that fetches the name of the topic a lesson belongs to
 * and shares the result between the new lesson player's header and navbar
 * breadcrumb, so that the topic data is requested from the backend only once
 * per lesson load.
 */

import {Injectable} from '@angular/core';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';

@Injectable({
  providedIn: 'root',
})
export class PlayerTopicNameService {
  // Maps a classroom/topic pair to the in-flight or settled request for the
  // topic name, so that concurrent callers share a single backend request.
  private topicNamePromises: Map<string, Promise<string>> = new Map();

  constructor(
    private topicViewerBackendApiService: TopicViewerBackendApiService
  ) {}

  async getTopicNameAsync(
    topicUrlFragment: string,
    classroomUrlFragment: string
  ): Promise<string> {
    const cacheKey = JSON.stringify([classroomUrlFragment, topicUrlFragment]);
    const cachedPromise = this.topicNamePromises.get(cacheKey);
    if (cachedPromise) {
      return cachedPromise;
    }

    const topicNamePromise = this.topicViewerBackendApiService
      .fetchTopicDataAsync(topicUrlFragment, classroomUrlFragment)
      .then(
        readOnlyTopic => readOnlyTopic.getTopicName(),
        error => {
          // Do not cache failures, so that a later call can retry.
          this.topicNamePromises.delete(cacheKey);
          throw error;
        }
      );
    this.topicNamePromises.set(cacheKey, topicNamePromise);
    return topicNamePromise;
  }
}
