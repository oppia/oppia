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

oppia.factory('ExplorationRightsService', [
  '$http', 'ExplorationDataService', 'AlertsService', 'ACTIVITY_STATUS_PRIVATE',
  'ACTIVITY_STATUS_PUBLIC',
  function($http, ExplorationDataService, AlertsService,
      ACTIVITY_STATUS_PRIVATE, ACTIVITY_STATUS_PUBLIC) {
    return {
      init: function(
          ownerNames, editorNames, translatorNames, viewerNames, status,
          clonedFrom, isCommunityOwned, viewableIfPrivate) {
        this.ownerNames = ownerNames;
        this.editorNames = editorNames;
        this.translatorNames = translatorNames;
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
      isPrivate: function() {
        return this._status === ACTIVITY_STATUS_PRIVATE;
      },
      isPublic: function() {
        return this._status === ACTIVITY_STATUS_PUBLIC;
      },
      isCloned: function() {
        return Boolean(this._clonedFrom);
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
            data.rights.translator_names, data.rights.viewer_names,
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
            data.rights.translator_names, data.rights.viewer_names,
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
            data.rights.translator_names, data.rights.viewer_names,
            data.rights.status, data.rights.cloned_from,
            data.rights.community_owned, data.rights.viewable_if_private);
        });
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
            data.rights.translator_names, data.rights.viewer_names,
            data.rights.status, data.rights.cloned_from,
            data.rights.community_owned, data.rights.viewable_if_private);
        });
      },
      saveModeratorChangeToBackend: function(emailBody) {
        var that = this;
        var explorationModeratorRightsUrl = (
          '/createhandler/moderatorrights/' +
          ExplorationDataService.explorationId);

        $http.put(explorationModeratorRightsUrl, {
          email_body: emailBody,
          version: ExplorationDataService.data.version
        }).then(function(response) {
          var data = response.data;
          AlertsService.clearWarnings();
          that.init(
            data.rights.owner_names, data.rights.editor_names,
            data.rights.translator_names, data.rights.viewer_names,
            data.rights.status, data.rights.cloned_from,
            data.rights.community_owned, data.rights.viewable_if_private);
        });
      }
    };
  }
]);
