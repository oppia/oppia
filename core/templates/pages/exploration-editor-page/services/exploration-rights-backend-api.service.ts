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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface ExplorationRightsBackendData {
  rights: {
    'cloned_from': string;
    'status': string;
    'community_owned': boolean;
    'owner_names': string[];
    'editor_names': string[];
    'voice_artist_names': string[];
    'viewer_names': string[];
    'viewable_if_private': boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationRightsBackendApiService {
  constructor(
    private http: HttpClient,
  ) { }

  async makeCommunityOwnedPutData(
      url: string, version: number, makeCommunityOwned: boolean):
    Promise<ExplorationRightsBackendData> {
    return this.http.put<ExplorationRightsBackendData>(url, {
      version: version,
      make_communityOwned: makeCommunityOwned
    }).toPromise();
  }

  async saveRoleChangesPutData(
      url: string, version: number, newMemberRole: string,
      newMemberUsername: string): Promise<ExplorationRightsBackendData> {
    return this.http.put<ExplorationRightsBackendData>(url, {
      version: version,
      new_member_role: newMemberRole,
      new_member_username: newMemberUsername
    }).toPromise();
  }

  async setViewabilityPutData(
      url: string, version: number, viewableIfPrivate: boolean
  ): Promise<ExplorationRightsBackendData> {
    return this.http.put<ExplorationRightsBackendData>(url, {
      version: version,
      viewableIfPrivate: viewableIfPrivate
    }).toPromise();
  }

  async publishPutData(
      url: string, makePublic: boolean
  ): Promise<ExplorationRightsBackendData> {
    return this.http.put<ExplorationRightsBackendData>(url, {
      make_public: makePublic
    }).toPromise();
  }

  async saveModeratorChangeToBackendAsyncPutData(
      url: string, version: number, emailBody: string
  ): Promise<ExplorationRightsBackendData> {
    return this.http.put<ExplorationRightsBackendData>(url, {
      email_body: emailBody,
      version: version
    }).toPromise();
  }

  async removeRoleAsyncDeleteData(
      url: string, memberUsername: string
  ): Promise<ExplorationRightsBackendData> {
    return this.http.delete<ExplorationRightsBackendData>(url, {
      params: {
        username: memberUsername
      }
    }).toPromise();
  }

  async assignVoiceArtistRoleAsyncPostData(
      url: string, newVoiceArtistUsername: string
  ): Promise<ExplorationRightsBackendData> {
    return this.http.post<ExplorationRightsBackendData>(url, {
      username: newVoiceArtistUsername
    }).toPromise();
  }

  async removeVoiceArtistRoleAsyncDeleteData(
      url: string, voiceArtistUsername: string
  ): Promise<ExplorationRightsBackendData> {
    return this.http.delete<ExplorationRightsBackendData>(url, {
      params: {
        voice_artist: voiceArtistUsername
      }
    }).toPromise();
  }
}

angular.module('oppia').factory(
  'ExplorationRightsBackendApiService',
  downgradeInjectable(ExplorationRightsBackendApiService));
