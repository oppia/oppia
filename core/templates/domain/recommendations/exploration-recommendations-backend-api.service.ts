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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import {
  IExplorationSummaryBackendDict,
  ExplorationSummary,
  ExplorationSummaryObjectFactory
} from 'domain/summary/exploration-summary-object.factory';

type IRecommendationsUrlParams = {
  'stringified_author_recommended_ids'?: string;
  'collection_id'?: string;
  'story_id'?: string;
  'current_node_id'?: string;
  'include_system_recommendations'?: string;
};

export interface IExplorationSummariesBackendDict {
  summaries: IExplorationSummaryBackendDict[];
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationRecommendationsBackendApiService {
  constructor(
    private http: HttpClient,
    private explorationSummaryObjectFactory:
    ExplorationSummaryObjectFactory) {}

  getRecommendedSummaryDicts(
      authorRecommendedExpIds: string[],
      includeSystemRecommendations: string,
      collectionId: string, storyId: string, currentNodeId: string,
      explorationId: string): Promise<ExplorationSummary[]> {
    let recommendationsUrlParams: IRecommendationsUrlParams = {
      stringified_author_recommended_ids: JSON.stringify(
        authorRecommendedExpIds),
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

    return this.http.get<IExplorationSummariesBackendDict>(
      '/explorehandler/recommendations/' + explorationId, {
        params: recommendationsUrlParams
      }).toPromise().then(backendDict => {
      return backendDict.summaries.map((
          summaryDict: IExplorationSummaryBackendDict) => {
        return this.explorationSummaryObjectFactory.createFromBackendDict(
          summaryDict);
      });
    });
  }
}

angular.module('oppia').factory(
  'ExplorationRecommendationsBackendApiService',
  downgradeInjectable(ExplorationRecommendationsBackendApiService));
