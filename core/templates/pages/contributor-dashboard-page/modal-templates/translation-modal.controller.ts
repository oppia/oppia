// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the translation modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('pages/contributor-dashboard-page/services/translate-text.service.ts');
require('pages/contributor-dashboard-page/services/translated-text-backend-api.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-language.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('components/ck-editor-helpers/ck-editor-copy-content-service.ts');
require('services/image-local-storage.service.ts');
require('services/site-analytics.service.ts');

angular.module('oppia').controller('TranslationModalController', [
  '$controller', '$scope', '$scope', '$uibModalInstance', 'AlertsService',
  'CkEditorCopyContentService', 'ContextService', 'ImageLocalStorageService',
  'SiteAnalyticsService', 'TranslateTextService', 'TranslationLanguageService',
  'opportunity', 'ENTITY_TYPE', 'TranslatedTextBackendApiService','TRANSLATION_TIPS',
  function(
      $controller, $scope, $rootScope, $uibModalInstance, AlertsService,
      CkEditorCopyContentService, ContextService, ImageLocalStorageService,
      SiteAnalyticsService, TranslateTextService, TranslationLanguageService,
      opportunity, ENTITY_TYPE, TranslatedTextBackendApiService, 
      TRANSLATION_TIPS) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    // We need to set the context here so that the rte fetches
    // images for the given ENTITY_TYPE and targetId.
    ContextService.setCustomEntityContext(
      ENTITY_TYPE.EXPLORATION, opportunity.id);

    ContextService.setImageSaveDestinationToLocalStorage();
    $scope.uploadingTranslation = false;
    $scope.activeWrittenTranslation = {};
    $scope.activeWrittenTranslation.html = '';
    $scope.activeLanguageCode =
      TranslationLanguageService.getActiveLanguageCode();
    $scope.HTML_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: 'true',
        language: TranslationLanguageService.getActiveLanguageCode(),
        languageDirection: (
          TranslationLanguageService.getActiveLanguageDirection())
      }
    };
    $scope.subheading = opportunity.subheading;
    $scope.heading = opportunity.heading;
    $scope.loadingData = true;
    $scope.moreAvailable = false;
    $scope.previousTranslationAvailable = false;
    $scope.textToTranslate = '';
    $scope.viewCompletedTranslationsModalOpen = false;
    $scope.translationsList=[];
    $scope.contentList=[];
    $scope.loadingTranslatedText = true;
    $scope.noTranslationComplete= true;
    $scope.TRANSLATION_TIPS = TRANSLATION_TIPS;
    $scope.languageDescription = (
      TranslationLanguageService.getActiveLanguageDescription());
    TranslateTextService.init(
      opportunity.id,
      TranslationLanguageService.getActiveLanguageCode(),
      function() {
        var textAndAvailability = (
          TranslateTextService.getTextToTranslate());
        $scope.textToTranslate = textAndAvailability.text;
        $scope.moreAvailable = textAndAvailability.more;
        $scope.loadingData = false;
      });
    TranslatedTextBackendApiService.getTranslationsAndContent(
      opportunity.id,
      TranslationLanguageService.getActiveLanguageCode()).then(
      () => {
        var TranslatedTextAndContent = (
          TranslatedTextBackendApiService.getTranslationsAndContentLists());
        $scope.translationsList = TranslatedTextAndContent.translationsList;
        $scope.contentList = TranslatedTextAndContent.contentList;
        if($scope.translationsList.length > 0){
          $scope.noTranslationComplete =  false;
        }
        $scope.loadingTranslatedText = false;  
        $rootScope.$applyAsync();
      }
    )
    
    $scope.onContentClick = function($event) {
      if ($scope.isCopyModeActive()) {
        $event.stopPropagation();
      }
      CkEditorCopyContentService.broadcastCopy($event.target);
    };

    $scope.isCopyModeActive = function() {
      return CkEditorCopyContentService.copyModeActive;
    };

    $scope.skipActiveTranslation = function() {
      var textAndAvailability = (
        TranslateTextService.getTextToTranslate());
      $scope.textToTranslate = textAndAvailability.text;
      $scope.moreAvailable = textAndAvailability.more;
      $scope.activeWrittenTranslation.html = '';
    };

    $scope.returnToPreviousTranslation = function() {
      var textAndAvailability = (
        TranslateTextService.getPreviousTextToTranslate());
      $scope.textToTranslate = textAndAvailability.text;
      $scope.previousTranslationAvailable = textAndAvailability.more;
    };

    $scope.suggestTranslatedText = function() {
      if (!$scope.uploadingTranslation && !$scope.loadingData) {
        SiteAnalyticsService.registerContributorDashboardSubmitSuggestionEvent(
          'Translation');
        $scope.uploadingTranslation = true;
        var imagesData = ImageLocalStorageService.getStoredImagesData();
        ImageLocalStorageService.flushStoredImagesData();
        ContextService.resetImageSaveDestination();
        TranslateTextService.suggestTranslatedText(
          $scope.activeWrittenTranslation.html,
          TranslationLanguageService.getActiveLanguageCode(),
          imagesData, function() {
            AlertsService.addSuccessMessage(
              'Submitted translation for review.');
            if ($scope.moreAvailable) {
              var textAndAvailability = (
                TranslateTextService.getTextToTranslate());
              $scope.textToTranslate = textAndAvailability.text;
              $scope.moreAvailable = textAndAvailability.more;
            }
            $scope.previousTranslationAvailable = true;
            $scope.activeWrittenTranslation.html = '';
            $scope.uploadingTranslation = false;
          }, () => {
            $uibModalInstance.close();
          });
      }
      if (!$scope.moreAvailable) {
        $uibModalInstance.close();
      }
    };

    $scope.toggleViewCompletedTranslationsModal= function(){
      $scope.viewCompletedTranslationsModalOpen =
        !$scope.viewCompletedTranslationsModalOpen;
    }
  }
]);
