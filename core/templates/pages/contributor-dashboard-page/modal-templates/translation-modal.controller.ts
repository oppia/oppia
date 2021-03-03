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
    $scope.hasImgCopyError = false;
    $scope.hasParagraphCopyError = false;
    $scope.hasImgTextError = false;
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
      $scope.hasParagraphCopyError = false;
      var paragraphChildrenElements = [];

      // All the child elements are copied into paragraphChildrenElements
      // if the copied snippet is a paragraph.
      // Checks whether there are any mathematical equations are copied
      // as mathematical equations are also wrapped by <p> elements.
      // If there are no mathematical equations copied, shows the paragraph
      // copy error. Fixes issue #11683
      if ($event.target.localName === 'p') {
        paragraphChildrenElements = Array.from($event.target.children);
        if (!(paragraphChildrenElements
          .some(child => child.localName === 'oppia-noninteractive-math'))) {
            $scope.hasParagraphCopyError = true;
          } else {
            $scope.copyContent($event);
          }
      } else {
        $scope.copyContent($event);
      }
    };

    $scope.copyContent = function($event) {
      if ($scope.isCopyModeActive()) {
        $event.stopPropagation();
      }
      CkEditorCopyContentService.broadcastCopy($event.target);
    }

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

    $scope.hasTranslationErrors = function(data, behaviour) {
      return data.some(state => state === behaviour);
    }

    $scope.suggestTranslatedText = function() {
      $scope.hasImgCopyError = false;
      $scope.hasImgTextError = false;
      $scope.originalElements = angular.element(
        $scope.textToTranslate);
      $scope.translatedElements = angular.element(
        $scope.activeWrittenTranslation.html);
      var foundTranslatedImageFilePaths = [];
      var foundTranslatedImageAltTxts = [];
      var foundTranslatedImageDescriptions = [];
      var copiedImgStates = [];
      var duplicateImgAltTextStates = [];
      var duplicateImgDescriptionStates = [];
      const textWrapperLength = 6;
      [].forEach.call($scope.translatedElements, function(element) {
        if (element.localName === 'oppia-noninteractive-image') {
          var altText = element.attributes['alt-with-value'].value;
          var descriptionText = element.attributes['caption-with-value'].value;
          foundTranslatedImageFilePaths.push(element.attributes['filepath-with-value']);
          foundTranslatedImageAltTxts.push(altText.substring(textWrapperLength, altText.length - textWrapperLength));
          foundTranslatedImageDescriptions.push(
            descriptionText.substring(textWrapperLength, descriptionText.length - textWrapperLength));
        }
      });
      [].forEach.call($scope.originalElements, function(element) {
        if (element.localName === 'oppia-noninteractive-image') {
          var rawAltText = element.attributes['alt-with-value'].value;
          var rawDescriptionText = element.attributes[
            'caption-with-value'].value;
          var altText = rawAltText.substring(
            textWrapperLength, rawAltText.length - textWrapperLength);
          var descriptionText = rawDescriptionText.substring(
            textWrapperLength, rawDescriptionText.length - textWrapperLength);
          const found = foundTranslatedImageFilePaths.some(
            detail => detail.value === element.attributes[
              'filepath-with-value'].value);
          const altTextFound = foundTranslatedImageAltTxts.some(
            translatedAltText => (
              translatedAltText === altText && altText !== ''));
          const descriptionTextFound = foundTranslatedImageDescriptions.some(
            translatedDescText => (
              translatedDescText === descriptionText && descriptionText !== '')
          );
          copiedImgStates.push(found);
          duplicateImgAltTextStates.push(altTextFound);
          duplicateImgDescriptionStates.push(descriptionTextFound);
        }
      });
      const hasUncopiedImgs = $scope.hasTranslationErrors(copiedImgStates, false);
      const hasDuplicateAltTexts = $scope.hasTranslationErrors(duplicateImgAltTextStates, true);
      const hasDuplicateDescriptions = $scope.hasTranslationErrors(duplicateImgDescriptionStates, true);
      if (hasUncopiedImgs) {
        $scope.hasImgCopyError = true;
      } else if (hasDuplicateAltTexts || hasDuplicateDescriptions) {
        $scope.hasImgTextError = true;
      } else {
        if (!$scope.uploadingTranslation && !$scope.loadingData) {
          SiteAnalyticsService.
            registerContributorDashboardSubmitSuggestionEvent('Translation');
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
            }, () => {
              $uibModalInstance.close();
            }
          );
        }
        if (!$scope.moreAvailable) {
          $uibModalInstance.close();
        }
      }
    };
  }
]);
