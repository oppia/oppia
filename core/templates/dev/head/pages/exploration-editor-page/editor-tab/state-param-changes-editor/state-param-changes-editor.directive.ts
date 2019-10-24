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
 * @fileoverview Directive for the param changes editor section of the
 * state editor.
 */

require('domain/utilities/url-interpolation.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-param-changes.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');

angular.module('oppia').directive('stateParamChangesEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/editor-tab/' +
        'state-param-changes-editor/state-param-changes-editor.directive.html'),
      controller: [
        '$scope', 'StateEditorService', 'StateParamChangesService',
        function($scope, StateEditorService, StateParamChangesService) {
          $scope.StateParamChangesService = StateParamChangesService;

          $scope.$on('stateEditorInitialized', function(evt, stateData) {
            StateParamChangesService.init(
              StateEditorService.getActiveStateName(), stateData.paramChanges);
          });
        }
      ]
    };
  }]);
