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
 * @fileoverview Directive for the Collapsible rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('domain/utilities/UrlInterpolationService.ts');
require('services/HtmlEscaperService.ts');

var oppia = require('AppInit.ts').module;

oppia.directive('oppiaNoninteractiveCollapsible', [
  '$rootScope', '$sce', 'HtmlEscaperService', 'UrlInterpolationService',
  function($rootScope, $sce, HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/rich_text_components/Collapsible' +
        '/directives/collapsible_directive.html'),
      controllerAs: '$ctrl',
      controller: ['$attrs', function($attrs) {
        var ctrl = this;
        ctrl.heading = HtmlEscaperService.escapedJsonToObj(
          $attrs.headingWithValue);
        ctrl.content = HtmlEscaperService.escapedJsonToObj(
          $attrs.contentWithValue);
      }]
    };
  }
]);
