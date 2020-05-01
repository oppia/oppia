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
 * @fileoverview Controllers for the 'Welcome Guide' page.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'background-banner.directive.ts');

require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('welcomeGuidePage', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/welcome-guide-page/welcome-guide-page.directive.html'),
      controllerAs: '$ctrl',
      controller: ['UrlInterpolationService', function(
          UrlInterpolationService) {
        var ctrl = this;
        ctrl.$onInit = function() {
          ctrl.fractionImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/welcomeguide/fractions.png');
          ctrl.headerImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/welcomeguide/header.jpg');
          ctrl.thanksImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/general/classroom.png');
          ctrl.browserImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/welcomeguide/browser.png');
          ctrl.number1ImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/welcomeguide/number1.png');
          ctrl.number2ImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/welcomeguide/number2.png');
          ctrl.number3ImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/welcomeguide/number3.png');
          ctrl.number4ImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/welcomeguide/number4.png');
          ctrl.number5ImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/welcomeguide/number5.png');
        };
      }]
    };
  }]);
