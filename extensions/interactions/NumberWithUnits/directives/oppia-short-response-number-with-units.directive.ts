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
 * @fileoverview Directive for the NumberWithUnits short response.
 */

require('domain/objects/NumberWithUnitsObjectFactory.ts');
require('services/html-escaper.service.ts');

angular.module('oppia').directive('oppiaShortResponseNumberWithUnits', [
  'HtmlEscaperService', 'NumberWithUnitsObjectFactory',
  function(HtmlEscaperService, NumberWithUnitsObjectFactory) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./number-with-units-short-response.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$attrs', function($attrs) {
        var ctrl = this;
        ctrl.$onInit = function() {
          var answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
          ctrl.answer = (
            NumberWithUnitsObjectFactory.fromDict(answer).toString());
        };
      }]
    };
  }
]);
