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
 * @fileoverview Directive for showing author/share footer
 * in collection player.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'sharing-links.directive.ts');

require('domain/utilities/UrlInterpolationService.ts');
require('services/contextual/UrlService.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('collectionFooter', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        twitterText: '@'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/collection-player-page/collection-footer/' +
        'collection-footer.directive.html'),
      controllerAs: '$ctrl',
      controller: ['UrlService', function(UrlService) {
        var ctrl = this;
        ctrl.collectionId = UrlService.getCollectionIdFromUrl();

        ctrl.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

        ctrl.getTwitterText = function() {
          return ctrl.twitterText;
        };
      }]
    };
  }]);
