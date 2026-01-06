// Copyright 2017 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied
// See the License for the specific language governing permissions and
// limitations under the License

/**
 * @fileoverview Service to send changes to an exploration to the backend
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {tap} from 'rxjs/operators';

import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AppConstants} from 'app.constants';
import {ExplorationBackendDict} from './exploration.model';
import {ExplorationChange} from './exploration-draft.model';

@Injectable({
  providedIn: 'root',
})
export class EditableExplorationBackendApiService {
  constructor(
    private httpClient: HttpClient,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  private async _fetchExplorationAsync(
    explorationId: string,
    applyDraft: boolean
  ): Promise<ExplorationBackendDict> {
    return this.httpClient
      .get<ExplorationBackendDict>(
        this._getExplorationUrl(explorationId, applyDraft)
      )
      .toPromise();
  }

  private async _updateExplorationAsync(
    explorationId: string,
    explorationVersion: number,
    commitMessage: string,
    changeList: ExplorationChange[]
  ): Promise<ExplorationBackendDict> {
    const putData = {
      version: explorationVersion,
      commit_message: commitMessage,
      change_list: changeList,
    };

    return this.httpClient
      .put<ExplorationBackendDict>(
        this._getExplorationUrl(explorationId, false),
        putData
      )
      .pipe(
        tap(() =>
          this.readOnlyExplorationBackendApiService.deleteExplorationFromCache(
            explorationId
          )
        )
      )
      .toPromise();
  }

  private async _deleteExplorationAsync(explorationId: string): Promise<void> {
    return this.httpClient
      .delete<void>(this._getExplorationUrl(explorationId, false))
      .pipe(
        tap(() =>
          this.readOnlyExplorationBackendApiService.deleteExplorationFromCache(
            explorationId
          )
        )
      )
      .toPromise();
  }

  private _getExplorationUrl(
    explorationId: string,
    applyDraft: boolean
  ): string {
    if (applyDraft) {
      return this.urlInterpolationService.interpolateUrl(
        AppConstants.EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE,
        {
          exploration_id: explorationId,
          apply_draft: JSON.stringify(applyDraft),
        }
      );
    }
    return this.urlInterpolationService.interpolateUrl(
      AppConstants.EDITABLE_EXPLORATION_DATA_URL_TEMPLATE,
      {
        exploration_id: explorationId,
      }
    );
  }

  async fetchExplorationAsync(
    explorationId: string
  ): Promise<ExplorationBackendDict> {
    return this._fetchExplorationAsync(explorationId, false);
  }

  async fetchApplyDraftExplorationAsync(
    explorationId: string
  ): Promise<ExplorationBackendDict> {
    return this._fetchExplorationAsync(explorationId, true);
  }

  async updateExplorationAsync(
    explorationId: string,
    explorationVersion: number,
    commitMessage: string,
    changeList: ExplorationChange[]
  ): Promise<ExplorationBackendDict> {
    return this._updateExplorationAsync(
      explorationId,
      explorationVersion,
      commitMessage,
      changeList
    );
  }

  async recordMostRecentlyReachedCheckpointAsync(
    explorationId: string,
    mostRecentlyReachedCheckpointExpVersion: number,
    mostRecentlyReachedCheckpointStateName: string,
    isUserLoggedIn: boolean,
    uniqueProgressUrlId: string | null = null
  ): Promise<void> {
    if (isUserLoggedIn) {
      const requestUrl = '/explorehandler/checkpoint_reached/' + explorationId;
      return this.httpClient
        .put<void>(requestUrl, {
          most_recently_reached_checkpoint_exp_version:
            mostRecentlyReachedCheckpointExpVersion,
          most_recently_reached_checkpoint_state_name:
            mostRecentlyReachedCheckpointStateName,
        })
        .toPromise();
    }

    if (!isUserLoggedIn && uniqueProgressUrlId) {
      const requestUrl =
        '/explorehandler/checkpoint_reached_by_logged_out_user/' +
        explorationId;
      return this.httpClient
        .put<void>(requestUrl, {
          unique_progress_url_id: uniqueProgressUrlId,
          most_recently_reached_checkpoint_exp_version:
            mostRecentlyReachedCheckpointExpVersion,
          most_recently_reached_checkpoint_state_name:
            mostRecentlyReachedCheckpointStateName,
        })
        .toPromise();
    }
    return Promise.resolve();
  }

  async recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner(
    explorationId: string,
    mostRecentlyReachedCheckpointExpVersion: number,
    mostRecentlyReachedCheckpointStateName: string
  ): Promise<{unique_progress_url_id: string}> {
    const requestUrl =
      '/explorehandler/checkpoint_reached_by_logged_out_user/' + explorationId;
    return this.httpClient
      .post<{unique_progress_url_id: string}>(requestUrl, {
        most_recently_reached_checkpoint_exp_version:
          mostRecentlyReachedCheckpointExpVersion,
        most_recently_reached_checkpoint_state_name:
          mostRecentlyReachedCheckpointStateName,
      })
      .toPromise();
  }

  async changeLoggedOutProgressToLoggedInProgressAsync(
    explorationId: string,
    uniqueProgressUrlId: string
  ): Promise<void> {
    const requestUrl =
      '/sync_logged_out_and_logged_in_progress/' + explorationId;
    return this.httpClient
      .post<void>(requestUrl, {
        unique_progress_url_id: uniqueProgressUrlId,
      })
      .toPromise();
  }

  async resetExplorationProgressAsync(explorationId: string): Promise<void> {
    const requestUrl = '/explorehandler/restart/' + explorationId;
    return this.httpClient
      .put<void>(requestUrl, {
        most_recently_reached_checkpoint_state_name: null,
      })
      .toPromise();
  }

  async recordLearnerHasViewedLessonInfoModalOnce(): Promise<void> {
    const requestUrl = '/userinfohandler/data';
    return this.httpClient
      .put<void>(requestUrl, {
        user_has_viewed_lesson_info_modal_once: true,
      })
      .toPromise();
  }

  async deleteExplorationAsync(explorationId: string): Promise<void> {
    return this._deleteExplorationAsync(explorationId);
  }
}
