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

require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('services/alerts.service.ts');

angular.module('oppia').factory('ExplorationRightsService', [
  '$http', 'AlertsService', 'ExplorationDataService', 'ACTIVITY_STATUS_PRIVATE',
  'ACTIVITY_STATUS_PUBLIC', 'ROLE_EDITOR', 'ROLE_OWNER', 'ROLE_VIEWER',
  'ROLE_VOICE_ARTIST',
  function(
      $http, AlertsService, ExplorationDataService,
      ACTIVITY_STATUS_PRIVATE, ACTIVITY_STATUS_PUBLIC, ROLE_EDITOR, ROLE_OWNER,
      ROLE_VIEWER, ROLE_VOICE_ARTIST) {
    return {
      init: function(
          ownerNames, editorNames, voiceArtistNames, viewerNames, status,
          clonedFrom, isCommunityOwned, viewableIfPrivate) {
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
      },
      clonedFrom: function() {
        return this._clonedFrom;
      },
      isCloned: function() {
        return Boolean(this._clonedFrom);
      },
      isPrivate: function() {
        return this._status === ACTIVITY_STATUS_PRIVATE;
      },
      isPublic: function() {
        return this._status === ACTIVITY_STATUS_PUBLIC;
      },
      isCommunityOwned: function() {
        return this._isCommunityOwned;
      },
      viewableIfPrivate: function() {
        return this._viewableIfPrivate;
      },
      makeCommunityOwned: function() {
        var that = this;
        var requestUrl = (
          '/createhandler/rights/' + ExplorationDataService.explorationId);

        return $http.put(requestUrl, {
          version: ExplorationDataService.data.version,
          make_community_owned: true
        }).then(function(response) {
          var data = response.data;
          AlertsService.clearWarnings();
          that.init(
            data.rights.owner_names, data.rights.editor_names,
            data.rights.voice_artist_names, data.rights.viewer_names,
            data.rights.status, data.rights.cloned_from,
            data.rights.community_owned, data.rights.viewable_if_private);
        });
      },
      setViewability: function(viewableIfPrivate) {
        var that = this;
        var requestUrl = (
          '/createhandler/rights/' + ExplorationDataService.explorationId);

        return $http.put(requestUrl, {
          version: ExplorationDataService.data.version,
          viewable_if_private: viewableIfPrivate
        }).then(function(response) {
          var data = response.data;
          AlertsService.clearWarnings();
          that.init(
            data.rights.owner_names, data.rights.editor_names,
            data.rights.voice_artist_names, data.rights.viewer_names,
            data.rights.status, data.rights.cloned_from,
            data.rights.community_owned, data.rights.viewable_if_private);
        });
      },
      saveRoleChanges: function(newMemberUsername, newMemberRole) {
        var that = this;
        var requestUrl = (
          '/createhandler/rights/' + ExplorationDataService.explorationId);

        return $http.put(requestUrl, {
          version: ExplorationDataService.data.version,
          new_member_role: newMemberRole,
          new_member_username: newMemberUsername
        }).then(function(response) {
          var data = response.data;
          AlertsService.clearWarnings();
          that.init(
            data.rights.owner_names, data.rights.editor_names,
            data.rights.voice_artist_names, data.rights.viewer_names,
            data.rights.status, data.rights.cloned_from,
            data.rights.community_owned, data.rights.viewable_if_private);
        });
      },
      removeRoleAsync: function(memberUsername) {
        var that = this;
        var requestUrl = (
          '/createhandler/rights/' + ExplorationDataService.explorationId);

        return $http.delete(requestUrl, {
          params: {
            username: memberUsername
          }
        }).then(function(response) {
          var data = response.data;
          AlertsService.clearWarnings();
          that.init(
            data.rights.owner_names, data.rights.editor_names,
            data.rights.voice_artist_names, data.rights.viewer_names,
            data.rights.status, data.rights.cloned_from,
            data.rights.community_owned, data.rights.viewable_if_private);
        });
      },
      assignVoiceArtistRoleAsync: function(newVoiceArtistUsername) {
        var that = this;
        var requestUrl = (
          '/voice_artist_management_handler/' + 'exploration/' +
          ExplorationDataService.explorationId);

        return $http.post(requestUrl, {
          username: newVoiceArtistUsername}).then(() => {
          AlertsService.clearWarnings();
          that.voiceArtistNames.push(newVoiceArtistUsername);
        });
      },
      removeVoiceArtistRoleAsync: function(voiceArtistUsername) {
        var that = this;
        var requestUrl = (
          '/voice_artist_management_handler/' + 'exploration/' +
          ExplorationDataService.explorationId);
        return $http.delete(requestUrl, {
          params: {
            voice_artist: voiceArtistUsername
          }
        }).then(function(response) {
          AlertsService.clearWarnings();
          that.voiceArtistNames.forEach((username, index) => {
            if (username === voiceArtistUsername) {
              that.voiceArtistNames.splice(index, 1);
            }
          });
        });
      },
      checkUserAlreadyHasRoles: function(username) {
        return [...this.ownerNames, ...this.editorNames, ...this.viewerNames,
          ...this.voiceArtistNames].includes(username);
      },
      getOldRole: function(username) {
        if (this.ownerNames.includes(username)) {
          return ROLE_OWNER;
        } else if (this.editorNames.includes(username)) {
          return ROLE_EDITOR;
        } else if (this.voiceArtistNames.includes(username)) {
          return ROLE_VOICE_ARTIST;
        } else {
          return ROLE_VIEWER;
        }
      },
      publish: function() {
        var that = this;
        var requestUrl = (
          '/createhandler/status/' + ExplorationDataService.explorationId);

        return $http.put(requestUrl, {
          make_public: true
        }).then(function(response) {
          var data = response.data;
          AlertsService.clearWarnings();
          that.init(
            data.rights.owner_names, data.rights.editor_names,
            data.rights.voice_artist_names, data.rights.viewer_names,
            data.rights.status, data.rights.cloned_from,
            data.rights.community_owned, data.rights.viewable_if_private);
        });
      },
      saveModeratorChangeToBackendAsync: async function(
          emailBody) {
        var that = this;
        var explorationModeratorRightsUrl = (
          '/createhandler/moderatorrights/' +
          ExplorationDataService.explorationId);

        return $http.put(explorationModeratorRightsUrl, {
          email_body: emailBody,
          version: ExplorationDataService.data.version
        }).then(function(response) {
          var data = response.data;
          AlertsService.clearWarnings();
          that.init(
            data.rights.owner_names, data.rights.editor_names,
            data.rights.voice_artist_names, data.rights.viewer_names,
            data.rights.status, data.rights.cloned_from,
            data.rights.community_owned, data.rights.viewable_if_private);
        });
      }
    };
  }
]);
