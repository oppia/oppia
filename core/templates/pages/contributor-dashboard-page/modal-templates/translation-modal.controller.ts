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
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-language.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('components/ck-editor-helpers/ck-editor-copy-content-service.ts');
require('services/image-local-storage.service.ts');
require('services/site-analytics.service.ts');

angular.module('oppia').controller('TranslationModalController', [
  '$controller', '$scope', '$uibModalInstance', 'AlertsService',
  'CkEditorCopyContentService', 'ContextService', 'ImageLocalStorageService',
  'SiteAnalyticsService', 'TranslateTextService', 'TranslationLanguageService',
  'opportunity', 'ENTITY_TYPE',
  function(
      $controller, $scope, $uibModalInstance, AlertsService,
      CkEditorCopyContentService, ContextService, ImageLocalStorageService,
      SiteAnalyticsService, TranslateTextService, TranslationLanguageService,
      opportunity, ENTITY_TYPE) {
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
    $scope.textToTranslate = '';
    $scope.imgCopyError = false;
    $scope.paragraphCopyerror = false;
    $scope.imgTextError = false;
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

    $scope.onContentClick = function($event) {
      $scope.paragraphCopyerror = false;
      var children = [];
      if ($event.target.localName === 'p') {
        [].forEach.call($event.target.children, function(child) {
          children.push(child);
        });
      }
      if ($event.target.localName === 'p' && !(children.some(
        child => child.localName === 'oppia-noninteractive-math'))) {
        $scope.paragraphCopyerror = true;
      } else {
        if ($scope.isCopyModeActive()) {
          $event.stopPropagation();
        }
        CkEditorCopyContentService.broadcastCopy($event.target);
      }
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

    $scope.suggestTranslatedText = function() {
      $scope.imgCopyError = false;
      $scope.imgTextError = false;
      $scope.originalElements = angular.element(
        $scope.textToTranslate);
      $scope.translatedElements = angular.element(
        $scope.activeWrittenTranslation.html);
      var translatedImageDetails = [];
      var translatedImageAltTxts = [];
      var translatedImageDescriptions = [];
      var states = [];
      var duplicateImgAltTextStates = [];
      var duplicateImgDescriptionStates = [];
      [].forEach.call($scope.translatedElements, function(ctl) {
        if (ctl.localName === 'oppia-noninteractive-image') {
          var altText = ctl.attributes['alt-with-value'].value;
          var descriptionText = ctl.attributes['caption-with-value'].value;
          translatedImageDetails.push(ctl.attributes['filepath-with-value']);
          translatedImageAltTxts.push(altText.substring(6, altText.length - 6));
          translatedImageDescriptions.push(
            descriptionText.substring(6, descriptionText.length - 6));
        }
      });
      [].forEach.call($scope.originalElements, function(ctlTranslated) {
        if (ctlTranslated.localName === 'oppia-noninteractive-image') {
          var rawAltText = ctlTranslated.attributes['alt-with-value'].value;
          var rawDescriptionText = ctlTranslated.attributes['caption-with-value'].value;
          var altText = rawAltText.substring(6, rawAltText.length - 6);
          var descriptionText = rawDescriptionText.substring(6, rawDescriptionText.length - 6);
          const found = translatedImageDetails.some(
            detail => detail.value === ctlTranslated.attributes[
              'filepath-with-value'].value);
          const altTextFound = translatedImageAltTxts.some(
            translatedAltText => (translatedAltText === altText
              && altText != ''));
          const descriptionTextFound = translatedImageDescriptions.some(
            translatedDescText => (translatedDescText === descriptionText
              && descriptionText != ''));
          states.push(found);
          duplicateImgAltTextStates.push(altTextFound);
          duplicateImgDescriptionStates.push(descriptionTextFound);
        }
      });
      const uncopiedImgLefts = states.some(state => state === false);
      const duplicateAltTexts = duplicateImgAltTextStates.some(state => state === true);
      const duplicateDescriptions = duplicateImgDescriptionStates.some(state => state === true);
      if (uncopiedImgLefts) {
        $scope.imgCopyError = true;
      } else if (duplicateAltTexts || duplicateDescriptions) {
        console.log("Duplicated err");
        $scope.imgTextError = true;
      } else {
        if (!$scope.uploadingTranslation && !$scope.loadingData) {
          SiteAnalyticsService
            .registerContributorDashboardSubmitSuggestionEvent('Translation');
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
              $scope.activeWrittenTranslation.html = '';
              $scope.uploadingTranslation = false;
            });
        }
        if (!$scope.moreAvailable) {
          $uibModalInstance.close();
        }
      }
    };
  }
]);
