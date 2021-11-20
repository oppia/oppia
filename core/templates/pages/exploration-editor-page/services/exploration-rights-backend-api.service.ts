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
 * @fileoverview A data service that stores data
 * about the rights for this exploration.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import AppConstants from 'assets/constants';
import { ExplorationDataService } from
  'pages/exploration-editor-page/services/exploration-data.service';
import { AlertsService } from 'services/alerts.service';

export interface ExplorationRightsBackendData {
  rights: {
    'editor_names': string[];
    'owner_names': string[];
    'voice_artist_names': string[];
    'viewer_names': string[];
    'status': string;
    'cloned_from': string;
    'community_owned': boolean;
    'viewable_if_private': boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationRightsService {
  ownerNames: string[];
  editorNames: string[];
  voiceArtistNames: string[];
  viewerNames: string[];
  private _status: string;
  private _clonedFrom: string;
  private _isCommunityOwned: boolean;
  private _viewableIfPrivate: boolean;

  constructor(
    private alertsService: AlertsService,
    private http: HttpClient,
    private explorationDataService: ExplorationDataService,
  ) {}

  init(
      ownerNames: string[], editorNames: string[], voiceArtistNames: string[],
      viewerNames: string[], status: string, clonedFrom: string,
      isCommunityOwned: boolean, viewableIfPrivate: boolean): void {
    this.ownerNames = ownerNames;
    this.editorNames = editorNames;
    this.voiceArtistNames = voiceArtistNames;
    this.viewerNames = viewerNames;
    this._status = status;
    this._clonedFrom = clonedFrom;
    this._isCommunityOwned = isCommunityOwned;
    this._viewableIfPrivate = viewableIfPrivate;
  }

  clonedFrom(): string {
    return this._clonedFrom;
  }

  isCloned(): boolean {
    return Boolean(this._clonedFrom);
  }

  isPublic(): boolean {
    return this._status === AppConstants.ACTIVITY_STATUS_PUBLIC;
  }

  isPrivate(): boolean {
    return this._status === AppConstants.ACTIVITY_STATUS_PRIVATE;
  }

  viewableIfPrivate(): boolean {
    return this._viewableIfPrivate;
  }

  isCommunityOwned(): boolean {
    return this._isCommunityOwned;
  }

  makeCommunityOwned(): Promise<void> {
    const requestUrl = (
      '/createhandler/rights/' + this.explorationDataService.explorationId);
    return this.http.put(requestUrl, {
      version: this.explorationDataService.data.version,
      make_community_owned: true
    }).toPromise().then((response: ExplorationRightsBackendData) => {
      let data = response;
      this.alertsService.clearWarnings();
      this.init(
        data.rights.owner_names, data.rights.editor_names,
        data.rights.voice_artist_names, data.rights.viewer_names,
        data.rights.status, data.rights.cloned_from,
        data.rights.community_owned, data.rights.viewable_if_private);
    });
  }

  saveRoleChanges(
      newMemberUsername: string,
      newMemberRole: string): Promise<void> {
    const requestUrl = (
      '/createhandler/rights/' + this.explorationDataService.explorationId);

    return this.http.put(requestUrl, {
      version: this.explorationDataService.data.version,
      new_member_role: newMemberRole,
      new_member_username: newMemberUsername
    }).toPromise().then((response: ExplorationRightsBackendData) => {
      let data = response;
      this.alertsService.clearWarnings();
      this.init(
        data.rights.owner_names, data.rights.editor_names,
        data.rights.voice_artist_names, data.rights.viewer_names,
        data.rights.status, data.rights.cloned_from,
        data.rights.community_owned, data.rights.viewable_if_private);
    });
  }

  setViewability(
      viewableIfPrivate: boolean): Promise<void> {
    const requestUrl = (
      '/createhandler/rights/' + this.explorationDataService.explorationId);

    return this.http.put(requestUrl, {
      version: this.explorationDataService.data.version,
      viewable_if_private: viewableIfPrivate
    }).toPromise().then((response: ExplorationRightsBackendData) => {
      let data = response;
      this.alertsService.clearWarnings();
      this.init(
        data.rights.owner_names, data.rights.editor_names,
        data.rights.voice_artist_names, data.rights.viewer_names,
        data.rights.status, data.rights.cloned_from,
        data.rights.community_owned, data.rights.viewable_if_private);
    });
  }

  publish(): Promise<void> {
    const requestUrl = (
      '/createhandler/status/' + this.explorationDataService.explorationId);

    return this.http.put(requestUrl, {
      make_public: true
    }).toPromise().then((response: ExplorationRightsBackendData) => {
      let data = response;
      this.alertsService.clearWarnings();
      this.init(
        data.rights.owner_names, data.rights.editor_names,
        data.rights.voice_artist_names, data.rights.viewer_names,
        data.rights.status, data.rights.cloned_from,
        data.rights.community_owned, data.rights.viewable_if_private);
    });
  }

  saveModeratorChangeToBackendAsync(emailBody: string): Promise<void> {
    const explorationModeratorRightsUrl = (
      '/createhandler/moderatorrights/' +
      this.explorationDataService.explorationId);

    return this.http.put(explorationModeratorRightsUrl, {
      email_body: emailBody,
      version: this.explorationDataService.data.version
    }).toPromise().then((response: ExplorationRightsBackendData) => {
      let data = response;
      this.alertsService.clearWarnings();
      this.init(
        data.rights.owner_names, data.rights.editor_names,
        data.rights.voice_artist_names, data.rights.viewer_names,
        data.rights.status, data.rights.cloned_from,
        data.rights.community_owned, data.rights.viewable_if_private);
    }).catch(() => {
      this.init(
        null, null, null, null,
        null, null, null, null);
    });
  }

  removeRoleAsync(memberUsername: string): Promise<void> {
    const requestUrl = (
      '/createhandler/rights/' + this.explorationDataService.explorationId);

    return this.http.delete(requestUrl, {
      params: {
        username: memberUsername
      }
    }).toPromise().then((response: ExplorationRightsBackendData) => {
      let data = response;
      this.alertsService.clearWarnings();
      this.init(
        data.rights.owner_names, data.rights.editor_names,
        data.rights.voice_artist_names, data.rights.viewer_names,
        data.rights.status, data.rights.cloned_from,
        data.rights.community_owned, data.rights.viewable_if_private);
    });
  }

  assignVoiceArtistRoleAsync(newVoiceArtistUsername: string): Promise<void> {
    const requestUrl = (
      '/voice_artist_management_handler/' + 'exploration/' +
      this.explorationDataService.explorationId);

    return this.http.post(requestUrl, {
      username: newVoiceArtistUsername}).toPromise().then(() => {
      this.alertsService.clearWarnings();
      this.voiceArtistNames.push(newVoiceArtistUsername);
    });
  }

  removeVoiceArtistRoleAsync(voiceArtistUsername: string): Promise<void> {
    const requestUrl = (
      '/voice_artist_management_handler/' + 'exploration/' +
      this.explorationDataService.explorationId);
    return this.http.delete(requestUrl, {
      params: {
        voice_artist: voiceArtistUsername
      }
    }).toPromise().then((response) => {
      this.alertsService.clearWarnings();
      this.voiceArtistNames.forEach((username, index) => {
        if (username === voiceArtistUsername) {
          this.voiceArtistNames.splice(index, 1);
        }
      });
    });
  }

  checkUserAlreadyHasRoles(username: string): boolean {
    return [...this.ownerNames, ...this.editorNames, ...this.viewerNames,
      ...this.voiceArtistNames].includes(username);
  }

  getOldRole(username: string): string {
    if (this.ownerNames.includes(username)) {
      return AppConstants.ROLE_OWNER;
    } else if (this.editorNames.includes(username)) {
      return AppConstants.ROLE_EDITOR;
    } else if (this.voiceArtistNames.includes(username)) {
      return AppConstants.ROLE_VOICE_ARTIST;
    } else {
      return AppConstants.ROLE_VIEWER;
    }
  }
}
angular.module('oppia').factory(
  'ExplorationRightsService', downgradeInjectable(ExplorationRightsService));
