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
require('domain/utilities/url-interpolation.service.ts');
require('services/context.service.ts');
require('services/html-escaper.service.ts');

angular.module('oppia').directive('oppiaNoninteractiveConcept', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/rich_text_components/Concept/directives/concept.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', '$uibModal', 'ContextService', 'ENTITY_TYPE',
        function($attrs, $uibModal, ContextService, ENTITY_TYPE) {
          var ctrl = this;
          var skillSummary = HtmlEscaperService.escapedJsonToObj(
            $attrs.skillSummaryWithValue);
          ctrl.skillDescription = skillSummary.description;

          ctrl.openConceptCard = function() {
            var skillId = skillSummary.id;
            var skillDescription = ctrl.skillDescription;
            var removeCustomEntityContext =
              ContextService.removeCustomEntityContext;
            ContextService.setCustomEntityContext(ENTITY_TYPE.SKILL, skillId);
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/concept-card/concept-card-modal.template.html'
              ),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function(
                    $scope, $uibModalInstance) {
                  $scope.skillIds = [skillId];
                  $scope.index = 0;
                  $scope.currentSkill = skillDescription;
                  $scope.isInTestMode = false;

                  $scope.closeModal = function() {
                    removeCustomEntityContext();
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });
          };
        }]
    };
  }
]);
