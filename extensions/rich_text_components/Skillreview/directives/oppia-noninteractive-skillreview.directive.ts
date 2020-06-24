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
 * @fileoverview Directive for the concept card rich-text component.
 */

require('components/concept-card/concept-card.directive.ts');
require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('services/context.service.ts');
require('services/html-escaper.service.ts');

angular.module('oppia').directive('oppiaNoninteractiveSkillreview', [
  'HtmlEscaperService',
  function(HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./skillreview.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', '$uibModal', 'ContextService', 'ENTITY_TYPE',
        function($attrs, $uibModal, ContextService, ENTITY_TYPE) {
          var ctrl = this;
          var skillId = HtmlEscaperService.escapedJsonToObj(
            $attrs.skillIdWithValue);
          ctrl.linkText = HtmlEscaperService.escapedJsonToObj(
            $attrs.textWithValue);
          ctrl.openConceptCard = function() {
            ContextService.setCustomEntityContext(ENTITY_TYPE.SKILL, skillId);
            // The catch at the end was needed according to this thread:
            // https://github.com/angular-ui/bootstrap/issues/6501, where in
            // AngularJS 1.6.3, $uibModalInstance.cancel() throws console error.
            // The catch prevents that when clicking outside as well as for
            // cancel.
            $uibModal.open({
              template: require(
                'components/concept-card/concept-card-modal.template.html'),
              backdrop: true,
              controller: [
                '$controller', '$scope', '$uibModalInstance',
                function(
                    $controller, $scope, $uibModalInstance) {
                  $controller('ConfirmOrCancelModalController', {
                    $scope: $scope,
                    $uibModalInstance: $uibModalInstance
                  });
                  $scope.skillIds = [skillId];
                  $scope.index = 0;
                  $scope.modalHeader = 'Concept Card';
                  $scope.isInTestMode = false;
                }
              ]
            }).result.then(function() {}, function(res) {
              ContextService.removeCustomEntityContext();
              if (!(res === 'cancel' || res === 'escape key press')) {
                throw new Error(res);
              }
            });
          };
        }
      ]
    };
  }
]);
