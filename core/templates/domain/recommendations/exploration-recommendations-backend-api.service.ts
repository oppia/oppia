// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Backend api service for exploration-recommendations.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {
  LearnerExplorationSummary,
  LearnerExplorationSummaryBackendDict,
} from 'domain/summary/learner-exploration-summary.model';

// Eslint disable is added because we need to use 'type' instead of 'interface'
// to create the 'RecommendationsUrlParams' type. This is done, because
// when using the interface style, TypeScript throws an error because
// this type and the type of the method's expected argument don't match
// exactly (even though they are compatible).
// This is the type used for params that are sent to the backend.
// This type has optional properties because they may not be present in the URL.
// If we send these params always, the request URL would have something like
// '?collection_id=null' and the backend would start looking for a collection
// with id "null" which is not correct.

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type RecommendationsUrlParams = {
  author_recommended_ids: string;
  collection_id?: string;
  story_id?: string;
  current_node_id?: string;
  include_system_recommendations: string;
};

export interface RecommendedExplorationSummariesBackendDict {
  summaries: LearnerExplorationSummaryBackendDict[];
}

@Injectable({
  providedIn: 'root',
})
export class ExplorationRecommendationsBackendApiService {
  constructor(private http: HttpClient) {}

  async getRecommendedSummaryDictsAsync(
    authorRecommendedExpIds: string[],
    includeSystemRecommendations: string,
    // 'collectionId', 'storyId' and 'currentNodeId' can be null
    // since they may not be present in the URL.
    collectionId: string | null,
    storyId: string | null,
    currentNodeId: string | null,
    explorationId: string
  ): Promise<LearnerExplorationSummary[]> {
    let recommendationsUrlParams: RecommendationsUrlParams = {
      author_recommended_ids: JSON.stringify(authorRecommendedExpIds),
      include_system_recommendations: includeSystemRecommendations,
    };

    if (collectionId !== null) {
      recommendationsUrlParams.collection_id = collectionId;
    }
    if (storyId !== null) {
      recommendationsUrlParams.story_id = storyId;
    }
    if (currentNodeId !== null) {
      recommendationsUrlParams.current_node_id = currentNodeId;
    }

    return this.http
      .get<RecommendedExplorationSummariesBackendDict>(
        '/explorehandler/recommendations/' + explorationId,
        {
          params: recommendationsUrlParams,
        } as Object
      )
      .toPromise()
      .then(backendDict =>
        backendDict.summaries.map(summaryDict =>
          LearnerExplorationSummary.createFromBackendDict(summaryDict)
        )
      );
  }
}
