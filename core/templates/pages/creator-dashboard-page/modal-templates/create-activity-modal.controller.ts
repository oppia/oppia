// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the Create Exploration/Collection modal.
 */

require('components/entity-creation-services/collection-creation.service.ts');
require('components/entity-creation-services/exploration-creation.service.ts');
require('services/user.service.ts');
require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').controller('CreateActivityModalController', [
  '$rootScope', '$scope', '$uibModalInstance', 'CollectionCreationService',
  'ExplorationCreationService', 'UrlInterpolationService',
  'UserService', function(
      $rootScope, $scope, $uibModalInstance, CollectionCreationService,
      ExplorationCreationService, UrlInterpolationService,
      UserService) {
    UserService.getUserInfoAsync().then(function(userInfo) {
      $scope.canCreateCollections = (
        userInfo.canCreateCollections());
      // TODO(#8521): Remove the use of $rootScope.$apply()
      // once the controller is migrated to angular.
      $rootScope.$applyAsync();
    });

    $scope.chooseExploration = function() {
      ExplorationCreationService.createNewExploration();
      $uibModalInstance.close();
    };

    $scope.chooseCollection = function() {
      CollectionCreationService.createNewCollection();
      $uibModalInstance.close();
    };

    $scope.explorationImgUrl = (
      UrlInterpolationService.getStaticImageUrl(
        '/activity/exploration.svg'));

    $scope.collectionImgUrl = (
      UrlInterpolationService.getStaticImageUrl(
        '/activity/collection.svg'));
  }
]);
