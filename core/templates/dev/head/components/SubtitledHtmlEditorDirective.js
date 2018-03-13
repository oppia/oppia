// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the subtitled html editor.
 */

oppia.directive('subtitledHtmlEditor', [
  'UrlInterpolationService', 'SubtitledHtmlObjectFactory',
  function(UrlInterpolationService, SubtitledHtmlObjectFactory){
    return {
      restrict: 'E',
      scope: {
        subtitledHtml: '=',
        getOnSaveFn: '&onSaveFn'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/subtitled_html_editor_directive.html'),
      controller: [
        '$scope', '$uibModal', 'EditabilityService',
        'COMPONENT_NAME_HTML', 'stateContentService',
        function(
            $scope, $uibModal, EditabilityService,
            COMPONENT_NAME_HTML, stateContentService) {
          $scope.subtitledHtmlEditorIsOpen = false;
          $scope.subtitledMemento = null;

          $scope.COMPONENT_NAME_HTML = COMPONENT_NAME_HTML;
          $scope.stateContentService = stateContentService;

          var openMarkAllAudioAsNeedingUpdateModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/forms/' +
                'mark_all_audio_as_needing_update_modal_directive.html'),
              backdrop: true,
              resolve: {},
              controller: 'MarkAllAudioAsNeedingUpdateController'
            }).result.then(function() {
              $scope.subtitledHtml.html.markAllAudioAsNeedingUpdate();
              $scope.subtitledMemento.html = angular.copy(
                $scope.subtitledHtml.html);
              $scope.getOnSaveFn()();
            });
          };

          $scope.saveThisSubtitledHtml = function() {
            $scope.subtitledHtmlEditorIsOpen = false;
            var contentHasChanged = (
              $scope.subtitledMemento.html.getHtml() !==
              $scope.subtitledHtml.html.getHtml());
            $scope.subtitledMemento.html = angular.copy(
               $scope.subtitledHtml.html);
            if (
              $scope.subtitledHtml.html.hasUnflaggedAudioTranslations() &&
              contentHasChanged) {
              openMarkAllAudioAsNeedingUpdateModal();
            }
            $scope.getOnSaveFn()();
          };


          $scope.onAudioTranslationsStartEditAction = function() {
            if ($scope.subtitledHtmlEditorIsOpen) {
              $scope.saveThisSubtitledHtml();
            }
          };

          $scope.onAudioTranslationsEdited = function() {
            $scope.getOnSaveFn()();
          };
        }
      ]
    };
  }]);
