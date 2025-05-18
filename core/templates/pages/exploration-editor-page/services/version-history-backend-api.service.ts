// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for fetching the version history data for any state
 * or the exploration metadata at a particular version of the exploration.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {
  ExplorationMetadata,
  ExplorationMetadataBackendDict,
  ExplorationMetadataObjectFactory,
} from 'domain/exploration/ExplorationMetadataObjectFactory';
import {
  State,
  StateBackendDict,
  StateObjectFactory,
} from 'domain/state/StateObjectFactory';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

interface StateVersionHistoryBackendResponse {
  last_edited_version_number: number | null;
  state_name_in_previous_version: string | null;
  state_dict_in_previous_version: StateBackendDict | null;
  last_edited_committer_username: string;
}

export interface StateVersionHistoryResponse {
  lastEditedVersionNumber: number | null;
  stateNameInPreviousVersion: string | null;
  stateInPreviousVersion: State | null;
  lastEditedCommitterUsername: string;
}

interface MetadataVersionHistoryBackendResponse {
  last_edited_version_number: number | null;
  last_edited_committer_username: string;
  metadata_dict_in_previous_version: ExplorationMetadataBackendDict | null;
}

export interface MetadataVersionHistoryResponse {
  lastEditedVersionNumber: number | null;
  lastEditedCommitterUsername: string;
  metadataInPreviousVersion: ExplorationMetadata | null;
}

@Injectable({
  providedIn: 'root',
})
export class VersionHistoryBackendApiService {
  STATE_VERSION_HISTORY_URL_TEMPLATE =
    '/version_history_handler/state/<exploration_id>/<state_name>/<version>';

  METADATA_VERSION_HISTORY_URL_TEMPLATE =
    '/version_history_handler/metadata/<exploration_id>/<version>';

  constructor(
    private explorationMetadataObjectFactory: ExplorationMetadataObjectFactory,
    private http: HttpClient,
    private stateObjectFactory: StateObjectFactory,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async fetchStateVersionHistoryAsync(
    explorationId: string,
    stateName: string,
    version: number
  ): Promise<StateVersionHistoryResponse | null> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.STATE_VERSION_HISTORY_URL_TEMPLATE,
      {
        exploration_id: explorationId,
        state_name: stateName,
        version: version.toString(),
      }
    );

    return this.http
      .get<StateVersionHistoryBackendResponse>(url)
      .toPromise()
      .then(response => {
        let stateInPreviousVersion: State | null = null;
        if (response.state_dict_in_previous_version) {
          stateInPreviousVersion =
            this.stateObjectFactory.createFromBackendDict(
              response.state_name_in_previous_version,
              response.state_dict_in_previous_version
            );
        }
        return {
          lastEditedVersionNumber: response.last_edited_version_number,
          stateNameInPreviousVersion: response.state_name_in_previous_version,
          stateInPreviousVersion: stateInPreviousVersion,
          lastEditedCommitterUsername: response.last_edited_committer_username,
        };
      })
      .catch(error => {
        return null;
      });
  }

  async fetchMetadataVersionHistoryAsync(
    explorationId: string,
    version: number
  ): Promise<MetadataVersionHistoryResponse | null> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.METADATA_VERSION_HISTORY_URL_TEMPLATE,
      {
        exploration_id: explorationId,
        version: version.toString(),
      }
    );
    return this.http
      .get<MetadataVersionHistoryBackendResponse>(url)
      .toPromise()
      .then(response => {
        let metadataInPreviousVersion: ExplorationMetadata | null = null;
        if (response.metadata_dict_in_previous_version) {
          metadataInPreviousVersion =
            this.explorationMetadataObjectFactory.createFromBackendDict(
              response.metadata_dict_in_previous_version
            );
        }
        return {
          lastEditedVersionNumber: response.last_edited_version_number,
          lastEditedCommitterUsername: response.last_edited_committer_username,
          metadataInPreviousVersion: metadataInPreviousVersion,
        };
      })
      .catch(error => {
        return null;
      });
  }
}
