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
import { throwError } from 'rxjs';

import { PlaythroughIssueObjectFactory, PlaythroughIssue } from
  'domain/statistics/PlaythroughIssueObjectFactory.ts';
import { ServicesConstants } from 'services/services.constants.ts';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service.ts';

@Injectable({
  providedIn: 'root'
})
export class PlaythroughIssuesBackendApiService {
  private cachedIssues = null;

  constructor(
    private httpClient: HttpClient,
    private playthroughIssueObjectFactory: PlaythroughIssueObjectFactory,
    private urlInterpolationService: UrlInterpolationService) {}

  // TODO(#7165): This has been marked any since marking explorationVersion
  // to number throws an error. "Type 'number' is not assignable to type
  // 'string | string[]'" and if this is marked to string it throws an
  // error "TS2345: Argument of type '1' is not assignable to parameter
  // of type 'string'".
  fetchIssues(explorationId: string, explorationVersion: any
  ): Promise<PlaythroughIssue[]> {
    if (this.cachedIssues !== null) {
      return Promise.resolve(this.cachedIssues);
    } else {
      // TODO(#7165): Change `any` to a type describing the dict.
      return this.httpClient.get(
        this.getFullIssuesUrl(explorationId), {
          params: { exp_version: explorationVersion },
          observe: 'response'
        }).toPromise().then(
        (response: HttpResponse<any[]>) => {
          let unresolvedIssueBackendDicts = response.body;
          this.cachedIssues = unresolvedIssueBackendDicts.map(
            this.playthroughIssueObjectFactory.createFromBackendDict);
          return this.cachedIssues;
        });
    }
  }

  fetchPlaythrough(
      explorationId: string, playthroughId: string): Promise<PlaythroughIssue> {
    // TODO(#7165): Change `any` to a type describing the dict.
    return this.httpClient.get(
      this.getFullPlaythroughUrl(explorationId, playthroughId), {
        observe: 'response'
      }).toPromise().then((response: HttpResponse<any>) => {
      let playthroughBackendDict = response.body;
      return this.playthroughIssueObjectFactory.createFromBackendDict(
        playthroughBackendDict);
    });
  }

  resolveIssue(
      issueToResolve: PlaythroughIssue, explorationId: string,
      explorationVersion: number): Promise<any> {
    return this.httpClient.post(
      this.getFullResolveIssueUrl(explorationId), {
        exp_issue_dict: issueToResolve.toBackendDict(),
        exp_version: explorationVersion
      }).toPromise().then(() => {
      let issueIndex;
      if (this.cachedIssues !== null) {
        issueIndex = this.cachedIssues.findIndex(issue => {
          return angular.equals(issue, issueToResolve);
        });
      } else {
        issueIndex = -1;
      }
      if (issueIndex === -1) {
        let invalidIssueError = new Error(
          'An issue which was not fetched from the backend has been ' +
          'resolved');
        return throwError(invalidIssueError);
      } else {
        this.cachedIssues.splice(issueIndex, 1);
      }
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
  'PlaythroughIssuesBackendApiService', downgradeInjectable(
    PlaythroughIssuesBackendApiService));
