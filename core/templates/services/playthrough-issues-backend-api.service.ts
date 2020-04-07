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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { PlaythroughIssue, PlaythroughIssueObjectFactory } from
  'domain/statistics/PlaythroughIssueObjectFactory.ts';
import { ServicesConstants } from 'services/services.constants.ts';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service.ts';

@Injectable({ providedIn: 'root' })
export class PlaythroughIssuesBackendApiService {
  private cachedIssues = null;

  constructor(
    private httpClient: HttpClient,
    private playthroughIssueObjectFactory: PlaythroughIssueObjectFactory,
    private urlInterpolationService: UrlInterpolationService) {}

  fetchIssues(
      explorationId: string,
      explorationVersion: number): Promise<PlaythroughIssue[]> {
    if (this.cachedIssues !== null) {
      return Promise.resolve(this.cachedIssues);
    }
    return this.httpClient.get(this.getFullIssuesUrl(explorationId), {
      params: { exp_version: explorationVersion.toString() },
      observe: 'response'
    }).toPromise().then(
      // TODO(#7165): Change `any` to a type describing the dict.
      (response: HttpResponse<any[]>) => {
        let unresolvedIssueBackendDicts = response.body;
        this.cachedIssues = unresolvedIssueBackendDicts.map(
          this.playthroughIssueObjectFactory.createFromBackendDict);
        return this.cachedIssues;
      });
  }

  fetchPlaythrough(
      explorationId: string, playthroughId: string): Promise<PlaythroughIssue> {
    return this.httpClient.get(
      this.getFullPlaythroughUrl(explorationId, playthroughId), {
        observe: 'response'
      }
    ).toPromise().then(
      // TODO(#7165): Change `any` to a type describing the dict.
      (response: HttpResponse<any>) => {
        let playthroughBackendDict = response.body;
        return this.playthroughIssueObjectFactory.createFromBackendDict(
          playthroughBackendDict);
      });
  }

  resolveIssue(
      issueToResolve: PlaythroughIssue, explorationId: string,
      explorationVersion: number): Promise<void> {
    return this.httpClient.post(this.getFullResolveIssueUrl(explorationId), {
      exp_issue_dict: issueToResolve.toBackendDict(),
      exp_version: explorationVersion
    }).toPromise().then(
      () => {
        if (this.cachedIssues !== null) {
          const issueIndex = this.cachedIssues.findIndex(
            issue => angular.equals(issue, issueToResolve));
          if (issueIndex !== -1) {
            this.cachedIssues.splice(issueIndex, 1);
            return;
          }
        }
        throw Error(
          'An issue which was not fetched from the backend has been resolved');
      });
  }

  private getFullIssuesUrl(explorationId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      ServicesConstants.FETCH_ISSUES_URL, {
        exploration_id: explorationId
      });
  }

  private getFullPlaythroughUrl(
      explorationId: string, playthroughId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      ServicesConstants.FETCH_PLAYTHROUGH_URL, {
        exploration_id: explorationId,
        playthrough_id: playthroughId
      });
  }

  private getFullResolveIssueUrl(explorationId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      ServicesConstants.RESOLVE_ISSUE_URL, {
        exploration_id: explorationId
      });
  }
}

angular.module('oppia').factory(
  'PlaythroughIssuesBackendApiService',
  downgradeInjectable(PlaythroughIssuesBackendApiService));
