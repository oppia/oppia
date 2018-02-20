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
        subtitled: '=',
        getOnSaveFn: '&onSaveFn'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/subtitled_html_editor_directive.html'),
      controller: [
        '$scope', '$uibModal', 'EditabilityService',
        'COMPONENT_NAME_HTMLCONTENT',
        function(
        	$scope, $uibModal, EditabilityService, 
        	COMPONENT_NAME_HTMLCONTENT) {
          $scope.subtiledHtmlEditorIsOpen = false;
          $scope.subtitledMemento = null;

          var openMarkAllAudioAsNeedingUpdateModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/forms/' +
                'mark_all_audio_as_needing_update_modal_directive.html'),
              backdrop: true,
              resolve: {},
              controller: 'MarkAllAudioAsNeedingUpdateController'
            }).result.then(function() {
              $scope.subtitled.htmlContent.markAllAudioAsNeedingUpdate();
              $scope.subtitledMemento.htmlContent = angular.copy(
                $scope.subtitled.htmlContent);
              $scope.getOnSaveFn()();
            });
          };

          $scope.saveThisSubtitledHtml = function() {
            $scope.subtiledHtmlEditorIsOpen = false;
            var contentHasChanged = (
              $scope.subtitledMemento.htmlContent.getHtml() !==
              $scope.subtitled.htmlContent.getHtml());
            $scope.subtitledMemento.htmlContent = angular.copy(
            	$scope.subtitled.htmlContent);
            if (
            	$scope.subtitled.htmlContent.hasUnflaggedAudioTranslations() && 
            	contentHasChanged) {
              openMarkAllAudioAsNeedingUpdateModal();
            }
            $scope.getOnSaveFn()();
          };


          $scope.onAudioTranslationsStartEditAction = function() {
            if ($scope.subtiledHtmlEditorIsOpen) {
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
