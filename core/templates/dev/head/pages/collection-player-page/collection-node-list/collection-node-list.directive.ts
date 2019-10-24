// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for creating a list of collection nodes which link to
 * playing the exploration in each node.
 */

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('collectionNodeList', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getCollectionId: '&collectionId',
        getCollectionNodes: '&collectionNodes'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection-player-page/collection-node-list/' +
        'collection-node-list.directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {}]
    };
  }]);
