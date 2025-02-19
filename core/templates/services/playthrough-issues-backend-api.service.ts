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
 * @fileoverview Service for fetching issues and playthroughs from the backend.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

export interface FetchIssuesResponseBackendDict {
  unresolved_issues: PlaythroughIssueBackendDict[];
}

import {
  PlaythroughIssue,
  PlaythroughIssueBackendDict,
} from 'domain/statistics/playthrough-issue.model';
import {ServicesConstants} from 'services/services.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

@Injectable({providedIn: 'root'})
export class PlaythroughIssuesBackendApiService {
  private cachedIssues: PlaythroughIssue[] = [];

  constructor(
    private httpClient: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async fetchIssuesAsync(
    explorationId: string,
    explorationVersion: number
  ): Promise<PlaythroughIssue[]> {
    if (this.cachedIssues.length !== 0) {
      return Promise.resolve(this.cachedIssues);
    }

    return new Promise((resolve, reject) => {
      this.httpClient
        .get<FetchIssuesResponseBackendDict>(
          this.getFetchIssuesUrl(explorationId),
          {
            params: {exp_version: explorationVersion.toString()},
          }
        )
        .toPromise()
        .then(
          response => {
            resolve(
              (this.cachedIssues = response.unresolved_issues.map(
                PlaythroughIssue.createFromBackendDict
              ))
            );
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async fetchPlaythroughAsync(
    explorationId: string,
    playthroughId: string
  ): Promise<PlaythroughIssue> {
    return new Promise((resolve, reject) => {
      this.httpClient
        .get<PlaythroughIssueBackendDict>(
          this.getFetchPlaythroughUrl(explorationId, playthroughId)
        )
        .toPromise()
        .then(
          response => {
            resolve(PlaythroughIssue.createFromBackendDict(response));
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async resolveIssueAsync(
    issueToResolve: PlaythroughIssue,
    explorationId: string,
    explorationVersion: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpClient
        .post(this.getResolveIssueUrl(explorationId), {
          exp_issue_dict: issueToResolve.toBackendDict(),
          exp_version: explorationVersion,
        })
        .toPromise()
        .then(
          () => {
            if (this.cachedIssues.length !== 0) {
              const issueIndex = this.cachedIssues.findIndex(issue =>
                angular.equals(issue, issueToResolve)
              );
              if (issueIndex !== -1) {
                this.cachedIssues.splice(issueIndex, 1);
                resolve();
              }
            }
            reject(
              'An issue which was not fetched from the backend ' +
                'has been resolved'
            );
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  private getFetchIssuesUrl(explorationId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      ServicesConstants.FETCH_ISSUES_URL,
      {
        exploration_id: explorationId,
      }
    );
  }

  private getFetchPlaythroughUrl(
    explorationId: string,
    playthroughId: string
  ): string {
    return this.urlInterpolationService.interpolateUrl(
      ServicesConstants.FETCH_PLAYTHROUGH_URL,
      {
        exploration_id: explorationId,
        playthrough_id: playthroughId,
      }
    );
  }

  private getResolveIssueUrl(explorationId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      ServicesConstants.RESOLVE_ISSUE_URL,
      {
        exploration_id: explorationId,
      }
    );
  }
}
