// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the InteractiveMap response.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('interactions/uiLeafletRequires.ts');

require('domain/utilities/url-interpolation.service.ts');
require('services/html-escaper.service.ts');

angular.module('oppia').directive('oppiaResponseInteractiveMap', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./interactive-map-response.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$attrs', function($attrs) {
        var ctrl = this;
        ctrl.$onInit = function() {
          var _answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
          ctrl.mapOptions = {
            defaults: {
              zoomControl: false,
              attributionControl: false
            },
            center: {
              lat: _answer[0],
              lng: _answer[1],
              zoom: 8
            },
            mapMarkers: {
              mainMarker: {
                lat: _answer[0],
                lng: _answer[1],
                icon: {
                  iconUrl: UrlInterpolationService.getExtensionResourceUrl(
                    '/interactions/InteractiveMap/static/marker-icon.png'),
                  // The size of the icon image in pixels.
                  iconSize: [25, 41],
                  // The coordinates of the "tip" of the icon.
                  iconAnchor: [12, 41],
                  shadowUrl: UrlInterpolationService.getExtensionResourceUrl(
                    '/interactions/InteractiveMap/static/marker-shadow.png'),
                  // The size of the shadow image in pixels.
                  shadowSize: [41, 41],
                  // The coordinates of the "tip" of the shadow.
                  shadowAnchor: [13, 41],
                  // The URL to a retina sized version of the icon image.
                  // Used for Retina screen devices.
                  iconRetinaUrl: UrlInterpolationService
                    .getExtensionResourceUrl(
                      '/interactions/InteractiveMap/static/marker-icon-2x.png'),
                  shadowRetinaUrl: (
                    UrlInterpolationService.getExtensionResourceUrl(
                      '/interactions/InteractiveMap/static/marker-shadow.png'))
                }
              }
            }
          };
        };
      }]
    };
  }
]);
