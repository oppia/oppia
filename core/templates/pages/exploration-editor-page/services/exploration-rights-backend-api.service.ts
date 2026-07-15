// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Backend api service for Exploration Rights Service;
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

export interface ExplorationRightsBackendData {
  rights: {
    cloned_from: string;
    status: string;
    community_owned: boolean;
    owner_names: string[];
    editor_names: string[];
    voice_artist_names: string[];
    viewer_names: string[];
    viewable_if_private: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ExplorationRightsBackendApiService {
  constructor(private http: HttpClient) {}

  async makeCommunityOwnedPutData(
    explorationId: string,
    version: number,
    makeCommunityOwned: boolean
  ): Promise<ExplorationRightsBackendData> {
    const requestUrl = '/createhandler/rights/' + explorationId;

    return this.http
      .put<ExplorationRightsBackendData>(requestUrl, {
        version: version,
        make_community_owned: makeCommunityOwned,
      })
      .toPromise();
  }

  async saveRoleChangesPutData(
    explorationId: string,
    version: number,
    newMemberRole: string,
    newMemberUsername: string
  ): Promise<ExplorationRightsBackendData> {
    const requestUrl = '/createhandler/rights/' + explorationId;

    return this.http
      .put<ExplorationRightsBackendData>(requestUrl, {
        version: version,
        new_member_role: newMemberRole,
        new_member_username: newMemberUsername,
      })
      .toPromise();
  }

  async setViewabilityPutData(
    explorationId: string,
    version: number,
    viewableIfPrivate: boolean
  ): Promise<ExplorationRightsBackendData> {
    const requestUrl = '/createhandler/rights/' + explorationId;

    return this.http
      .put<ExplorationRightsBackendData>(requestUrl, {
        version: version,
        viewableIfPrivate: viewableIfPrivate,
      })
      .toPromise();
  }

  async publishPutData(
    explorationId: string,
    makePublic: boolean
  ): Promise<ExplorationRightsBackendData> {
    const requestUrl = '/createhandler/status/' + explorationId;

    return this.http
      .put<ExplorationRightsBackendData>(requestUrl, {
        make_public: makePublic,
      })
      .toPromise();
  }

  async saveModeratorChangeToBackendAsyncPutData(
    explorationId: string,
    version: number,
    emailBody: string
  ): Promise<ExplorationRightsBackendData> {
    const requestUrl = '/createhandler/moderatorrights/' + explorationId;

    return this.http
      .put<ExplorationRightsBackendData>(requestUrl, {
        email_body: emailBody,
        version: version,
      })
      .toPromise();
  }

  async removeRoleAsyncDeleteData(
    explorationId: string,
    memberUsername: string
  ): Promise<ExplorationRightsBackendData> {
    const requestUrl = '/createhandler/rights/' + explorationId;

    return this.http
      .delete<ExplorationRightsBackendData>(requestUrl, {
        params: {
          username: memberUsername,
        },
      })
      .toPromise();
  }

  async assignVoiceArtistRoleAsyncPostData(
    explorationId: string,
    newVoiceArtistUsername: string
  ): Promise<ExplorationRightsBackendData> {
    const requestUrl =
      '/voice_artist_management_handler/' + 'exploration/' + explorationId;

    return this.http
      .post<ExplorationRightsBackendData>(requestUrl, {
        username: newVoiceArtistUsername,
      })
      .toPromise();
  }

  async removeVoiceArtistRoleAsyncDeleteData(
    explorationId: string,
    voiceArtistUsername: string
  ): Promise<ExplorationRightsBackendData> {
    const requestUrl =
      '/voice_artist_management_handler/' + 'exploration/' + explorationId;

    return this.http
      .delete<ExplorationRightsBackendData>(requestUrl, {
        params: {
          voice_artist: voiceArtistUsername,
        },
      })
      .toPromise();
  }
}
