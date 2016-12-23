// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for displaying and editing a collection details.
 * Edit options include: changing the title, objective, and category, and also
 * adding a new exploration.
 */

oppia.directive('collectionPermissionsEditor', [function() {
  return {
    restrict: 'E',
    templateUrl: 'inline/collection_permissions_editor_directive',
    controller: [
      '$scope', 'CollectionRightsBackendApiService',
      function(
          $scope, CollectionRightsBackendApiService) {
        $scope.ROLES = [{
          name: 'Manager (can edit permissions)',
          value: 'owner'
        }, {
          name: 'Collaborator (can make changes)',
          value: 'editor'
        }, {
          name: 'Playtester (can give feedback)',
          value: 'viewer'
        }];

        $scope.isPrivate = GLOBALS.isPrivate;
        var CollectionId = GLOBALS.collectionId;
        var CollectionVersion = GLOBALS.collectionVersion;

        $scope.owners = GLOBALS.owners;
        $scope.editors = GLOBALS.editors;
        $scope.viewers = GLOBALS.viewers;

        $scope.isRolesFormOpen = false;

        $scope.openEditRolesForm = function() {
          $scope.isRolesFormOpen = true;
          $scope.newMemberUsername = '';
          $scope.newMemberRole = $scope.ROLES[0];
        };

        $scope.closeEditRolesForm = function() {
          $scope.isRolesFormOpen = false;
          $scope.newMemberUsername = '';
          $scope.newMemberRole = $scope.ROLES[0];
        };

        $scope.editRole = function(newMemberUsername, newMemberRole) {
          $scope.isRolesFormOpen = false;
          if (newMemberRole === $scope.ROLES[0].value) {
            var newRights =
              CollectionRightsBackendApiService.SetCollectionOwner(
                CollectionId, CollectionVersion, newMemberUsername);
            newRights.then(function(data) {
              $scope.owners = data.rights.owner_names;
              $scope.editors = data.rights.editor_names;
              $scope.viewers = data.rights.viewer_names;
            });
          } else if (newMemberRole === $scope.ROLES[1].value) {
            var newRights =
              CollectionRightsBackendApiService.SetCollectionEditor(
                CollectionId, CollectionVersion, newMemberUsername);
            newRights.then(function(data) {
              $scope.owners = data.rights.owner_names;
              $scope.editors = data.rights.editor_names;
              $scope.viewers = data.rights.viewer_names;
            });
          } else if (newMemberRole === $scope.ROLES[2].value) {
            var newRights =
              CollectionRightsBackendApiService.SetCollectionPlaytester(
                CollectionId, CollectionVersion, newMemberUsername);
            newRights.then(function(data) {
              $scope.owners = data.rights.owner_names;
              $scope.editors = data.rights.editor_names;
              $scope.viewers = data.rights.viewer_names;
            });
          }
        };
      }
    ]
  };
}]);
