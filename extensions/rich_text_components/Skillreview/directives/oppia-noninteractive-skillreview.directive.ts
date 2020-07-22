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

require(
  'rich_text_components/Skillreview/directives/' +
  'oppia-noninteractive-skillreview-concept-card-modal.controller.ts');

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
          ctrl.openConceptCard = function(event) {
            // The default onclick behaviour for an element inside CKEditor
            // is to open the customize RTE modal. Since this RTE has a custom
            // onclick listener attached, the default behaviour is to open the
            // concept card modal. To correct this, check if the element is
            // inside the context of a CKEditor instance. If so, prevent
            // the opening of the concept card and allow the customize RTE
            // modal to get triggered. If the element is not inside a CKEditor
            // instance, then open the concept card modal. To determine if the
            // RTE is inside a CKEditor instance, check if the offsetParent
            // element contains the data attribute ckeWidgetId.
            if (event.currentTarget.offsetParent.dataset.ckeWidgetId) {
              return;
            }
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
              resolve: {
                skillId: () => skillId
              },
              controller: (
                'OppiaNoninteractiveSkillreviewConceptCardModalController')
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
