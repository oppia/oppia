// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Backend Api Service for the Oppia moderator page.
 */

import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {ThreadMessageBackendDict} from 'domain/feedback_message/ThreadMessage.model';

export interface CommitMessage {
  commit_message: string;
  commit_type: string;
  exploration_id: string;
  last_updated: number;
  post_commit_community_owned: boolean;
  post_commit_is_private: boolean;
  post_commit_status: string;
  username: string;
  version: number;
}

export interface ExplorationDict {
  category: string;
  title: string;
}

export interface ActivityIdTypeDict {
  id: string;
  type: string;
}

export interface RecentCommitResponse {
  results: CommitMessage[];
  cursor: string;
  more: boolean;
  exp_ids_to_exp_data: ExplorationDict[];
}

export interface RecentFeedbackMessages {
  results: ThreadMessageBackendDict[];
  cursor: string;
  more: boolean;
}

export interface FeaturedActivityResponse {
  featured_activity_references: ActivityIdTypeDict[];
}

@Injectable({
  providedIn: 'root',
})
export class ModeratorPageBackendApiService {
  constructor(private httpClient: HttpClient) {}

  async saveFeaturedActivityReferencesAsync(
    activityReferencesToSave: ActivityIdTypeDict[]
  ): Promise<Object> {
    return this.httpClient
      .post(
        '/moderatorhandler/featured',
        {
          featured_activity_reference_dicts: activityReferencesToSave,
        },
        {}
      )
      .toPromise();
  }

  async getRecentCommitsAsync(): Promise<RecentCommitResponse> {
    let options = {
      params: new HttpParams().set('query_type', 'all_non_private_commits'),
    };
    return this.httpClient
      .get<RecentCommitResponse>(
        '/recentcommitshandler/recent_commits',
        options
      )
      .toPromise();
  }

  async getRecentFeedbackMessagesAsync(): Promise<RecentFeedbackMessages> {
    return this.httpClient
      .get<RecentFeedbackMessages>('/recent_feedback_messages')
      .toPromise();
  }

  async getFeaturedActivityReferencesAsync(): Promise<FeaturedActivityResponse> {
    return this.httpClient
      .get<FeaturedActivityResponse>('/moderatorhandler/featured')
      .toPromise();
  }
}
