// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
import { ExplorationDataService } from
  'pages/exploration-editor-page/services/exploration-data.service';
import { AlertsService } from 'services/alerts.service';
import { HttpClient } from '@angular/common/http';
import constants from 'assets/constants';

export interface ExplorationRightsBackendResponse {
  rights: {
    'editor_names': string[],
    'owner_names': string[],
    'voice_artist_names': string[],
    'viewer_names': string[],
    'status': string,
    'cloned_from': string,
    'community_owned': boolean,
    'viewable_if_private': boolean
  }
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationRightsService {
  ownerNames: string[] = undefined;
  editorNames: string[] = undefined;
  voiceArtistNames: string[] = undefined;
  viewerNames: string[] = undefined;
  _status: string = undefined;
  _clonedFrom: string = undefined;
  _isCommunityOwned: boolean = undefined;
  _viewableIfPrivate: boolean = undefined;
  constructor(
    private alertsService: AlertsService,
    private explorationDataService: ExplorationDataService,
    private httpClient: HttpClient
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
    // This is null if the exploration was not cloned from anything,
    // otherwise it is the exploration ID of the source exploration.
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
  isPrivate(): boolean {
    return this._status === constants.ACTIVITY_STATUS_PRIVATE;
  }
  isPublic(): boolean {
    return this._status === constants.ACTIVITY_STATUS_PUBLIC;
  }
  isCommunityOwned(): boolean {
    return this._isCommunityOwned;
  }
  viewableIfPrivate(): boolean {
    return this._viewableIfPrivate;
  }
  makeCommunityOwned(callback: () => void): Promise<void> {
    let requestUrl = (
      '/createhandler/rights/' + this.explorationDataService.explorationId);
    return this.httpClient.put(requestUrl, {
      version: this.explorationDataService.data.version,
      make_community_owned: true
    }).toPromise().then((response: ExplorationRightsBackendResponse) => {
      let data = response;
      this.alertsService.clearWarnings();
      this.init(
        data.rights.owner_names, data.rights.editor_names,
        data.rights.voice_artist_names, data.rights.viewer_names,
        data.rights.status, data.rights.cloned_from,
        data.rights.community_owned, data.rights.viewable_if_private);
      callback();
    });
  }

  setViewability(
      viewableIfPrivate: boolean, callback: () => void): Promise<void> {
    let requestUrl = (
      '/createhandler/rights/' + this.explorationDataService.explorationId);

    return this.httpClient.put(requestUrl, {
      version: this.explorationDataService.data.version,
      viewable_if_private: viewableIfPrivate
    }).toPromise().then((response: ExplorationRightsBackendResponse) => {
      let data = response;
      this.alertsService.clearWarnings();
      this.init(
        data.rights.owner_names, data.rights.editor_names,
        data.rights.voice_artist_names, data.rights.viewer_names,
        data.rights.status, data.rights.cloned_from,
        data.rights.community_owned, data.rights.viewable_if_private);
      callback();
    });
  }
  saveRoleChanges(
      newMemberUsername: string,
      newMemberRole: string,
      callback: () => void): Promise<void> {
    let requestUrl = (
      '/createhandler/rights/' + this.explorationDataService.explorationId);

    return this.httpClient.put(requestUrl, {
      version: this.explorationDataService.data.version,
      new_member_role: newMemberRole,
      new_member_username: newMemberUsername
    }).toPromise().then((response: ExplorationRightsBackendResponse) => {
      let data = response;
      this.alertsService.clearWarnings();
      this.init(
        data.rights.owner_names, data.rights.editor_names,
        data.rights.voice_artist_names, data.rights.viewer_names,
        data.rights.status, data.rights.cloned_from,
        data.rights.community_owned, data.rights.viewable_if_private);
      callback();
    });
  }
  publish(): Promise<void> {
    let requestUrl = (
      '/createhandler/status/' + this.explorationDataService.explorationId);

    return this.httpClient.put(requestUrl, {
      make_public: true
    }).toPromise().then((response: ExplorationRightsBackendResponse) => {
      let data = response;
      this.alertsService.clearWarnings();
      this.init(
        data.rights.owner_names, data.rights.editor_names,
        data.rights.voice_artist_names, data.rights.viewer_names,
        data.rights.status, data.rights.cloned_from,
        data.rights.community_owned, data.rights.viewable_if_private);
    });
  }
  saveModeratorChangeToBackend(emailBody: string, callback: () => void): void {
    let explorationModeratorRightsUrl = (
      '/createhandler/moderatorrights/' +
      this.explorationDataService.explorationId);

    this.httpClient.put(explorationModeratorRightsUrl, {
      email_body: emailBody,
      version: this.explorationDataService.data.version
    }).toPromise().then((response: ExplorationRightsBackendResponse) => {
      let data = response;
      this.alertsService.clearWarnings();
      this.init(
        data.rights.owner_names, data.rights.editor_names,
        data.rights.voice_artist_names, data.rights.viewer_names,
        data.rights.status, data.rights.cloned_from,
        data.rights.community_owned, data.rights.viewable_if_private);
      callback();
    })['catch'](() => {
      this.init(
        undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined);
    });
  }
}

angular.module('oppia').factory(
  'ExplorationRightsService', downgradeInjectable(ExplorationRightsService));
