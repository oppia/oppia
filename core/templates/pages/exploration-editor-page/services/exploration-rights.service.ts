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
import AppConstants from 'assets/constants';
import { ExplorationDataService } from
  'pages/exploration-editor-page/services/exploration-data.service';
import { AlertsService } from 'services/alerts.service';
import { ExplorationRightsBackendApiService } from './exploration-rights-backend-api.service';
import { ExplorationRightsBackendData } from './exploration-rights-backend-api.service';

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
    private explorationDataService: ExplorationDataService,
    private explorationRightsBackendApiService:
      ExplorationRightsBackendApiService
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
    return this.explorationRightsBackendApiService
      .makeCommunityOwnedPutData(
        this.explorationDataService.explorationId,
        this.explorationDataService.data.version, true)
      .then((response: ExplorationRightsBackendData) => {
        this.alertsService.clearWarnings();
        this.init(
          response.rights.owner_names, response.rights.editor_names,
          response.rights.voice_artist_names, response.rights.viewer_names,
          response.rights.status, response.rights.cloned_from,
          response.rights.community_owned, response.rights.viewable_if_private);
      });
  }

  saveRoleChanges(
      newMemberUsername: string, newMemberRole: string): Promise<void> {
    return this.explorationRightsBackendApiService.saveRoleChangesPutData(
      this.explorationDataService.explorationId,
      this.explorationDataService.data.version,
      newMemberRole, newMemberUsername)
      .then((response: ExplorationRightsBackendData) => {
        this.alertsService.clearWarnings();
        this.init(
          response.rights.owner_names, response.rights.editor_names,
          response.rights.voice_artist_names, response.rights.viewer_names,
          response.rights.status, response.rights.cloned_from,
          response.rights.community_owned, response.rights.viewable_if_private);
      }, (response) => {
        this.alertsService.addWarning(response.error.error);
      });
  }

  setViewability(
      viewableIfPrivate: boolean): Promise<void> {
    return this.explorationRightsBackendApiService.setViewabilityPutData(
      this.explorationDataService.explorationId,
      this.explorationDataService.data.version, viewableIfPrivate).then(
      (response: ExplorationRightsBackendData) => {
        this.alertsService.clearWarnings();
        this.init(
          response.rights.owner_names, response.rights.editor_names,
          response.rights.voice_artist_names, response.rights.viewer_names,
          response.rights.status, response.rights.cloned_from,
          response.rights.community_owned, response.rights.viewable_if_private);
      });
  }

  publish(): Promise<void> {
    return this.explorationRightsBackendApiService.publishPutData(
      this.explorationDataService.explorationId, true).then(
      (response: ExplorationRightsBackendData) => {
        this.alertsService.clearWarnings();
        this.init(
          response.rights.owner_names, response.rights.editor_names,
          response.rights.voice_artist_names, response.rights.viewer_names,
          response.rights.status, response.rights.cloned_from,
          response.rights.community_owned, response.rights.viewable_if_private);
      });
  }

  saveModeratorChangeToBackendAsync(emailBody: string): Promise<void> {
    return this.explorationRightsBackendApiService
      .saveModeratorChangeToBackendAsyncPutData(
        this.explorationDataService.explorationId,
        this.explorationDataService.data.version, emailBody).then(
        (response: ExplorationRightsBackendData) => {
          this.alertsService.clearWarnings();
          this.init(
            response.rights.owner_names, response.rights.editor_names,
            response.rights.voice_artist_names, response.rights.viewer_names,
            response.rights.status, response.rights.cloned_from,
            response.rights.community_owned, response.rights.viewable_if_private
          );
        }).catch(() => {
        this.init(
          null, null, null, null,
          null, null, null, null);
      });
  }

  removeRoleAsync(memberUsername: string): Promise<void> {
    return this.explorationRightsBackendApiService.removeRoleAsyncDeleteData(
      this.explorationDataService.explorationId, memberUsername).then(
      (response: ExplorationRightsBackendData) => {
        this.alertsService.clearWarnings();
        this.init(
          response.rights.owner_names, response.rights.editor_names,
          response.rights.voice_artist_names, response.rights.viewer_names,
          response.rights.status, response.rights.cloned_from,
          response.rights.community_owned, response.rights.viewable_if_private);
      });
  }

  assignVoiceArtistRoleAsync(newVoiceArtistUsername: string): Promise<void> {
    return this.explorationRightsBackendApiService
      .assignVoiceArtistRoleAsyncPostData(
        this.explorationDataService.explorationId,
        newVoiceArtistUsername).then((response) => {
        this.alertsService.clearWarnings();
        this.voiceArtistNames.push(newVoiceArtistUsername);
      }, (response) => {
        this.alertsService.addWarning(
          'Could not assign voice artist to private activity.');
      });
  }

  removeVoiceArtistRoleAsync(voiceArtistUsername: string): Promise<void> {
    return this.explorationRightsBackendApiService
      .removeVoiceArtistRoleAsyncDeleteData(
        this.explorationDataService.explorationId, voiceArtistUsername).then(
        (response) => {
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
