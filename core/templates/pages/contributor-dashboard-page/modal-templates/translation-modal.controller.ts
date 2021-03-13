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

export class TranslationError {
  constructor(
    private _triedToCopyText: boolean,
    private _hasUncopiedImgs: boolean,
    private _hasDuplicateAltTexts: boolean,
    private _hasDuplicateDescriptions: boolean) {}

  get hasDuplicateDescriptions(): boolean {
    return this._hasDuplicateDescriptions;
  }
  set hasDuplicateDescriptions(value: boolean) {
    this._hasDuplicateDescriptions = value;
  }
  get hasDuplicateAltTexts(): boolean {
    return this._hasDuplicateAltTexts;
  }
  set hasDuplicateAltTexts(value: boolean) {
    this._hasDuplicateAltTexts = value;
  }
  get hasUncopiedImgs(): boolean {
    return this._hasUncopiedImgs;
  }
  set hasUncopiedImgs(value: boolean) {
    this._hasUncopiedImgs = value;
  }
  get triedToCopyText(): boolean {
    return this._triedToCopyText;
  }
  set triedToCopyText(value: boolean) {
    this._triedToCopyText = value;
  }
}

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
    $scope.previousTranslationAvailable = false;
    $scope.textToTranslate = '';
    $scope.hasImgCopyError = false;
    $scope.triedToCopyText = false;
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
      const paragraphCopyValidation = $scope.validateParagraphCopy($event);
      if (paragraphCopyValidation.triedToCopyText) {
        return $scope.triedToCopyText = true;
      }
      $scope.triedToCopyText = false;
      return $scope.copyContent($event);
    };

    $scope.validateParagraphCopy = function($event) {
      // Mathematical equations are also wrapped by <p> elements.
      // Hence, math elements should be allowed to be copied.
      // It is related to issue 11683.
      const paragraphChildrenElements: HTMLElement[] = (
        $event.target.localName === 'p') ? Array.from(
          $event.target.children) : [];
      const triedTextCopy = $event.target.localName === 'p' && !(
        paragraphChildrenElements.some(
          child => child.localName === 'oppia-noninteractive-math'));
      return new TranslationError(triedTextCopy, false, false, false);
    };

    $scope.copyContent = function($event) {
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

    $scope.findImgAttributes = function(elements, type) {
      const textWrapperLength = 6;
      let attributes = Array.from(elements, function(element: HTMLElement) {
        if (element.localName === 'oppia-noninteractive-image') {
          const attribute = element.attributes[type].value;
          return attribute.substring(
            textWrapperLength, attribute.length - textWrapperLength);
        }
      });
      return attributes.filter(attribute => attribute);
    };

    $scope.findAvailableElements = function(
        originalElements, translatedElements, isRawImage) {
      let states = isRawImage ? Array.from(
        originalElements, function(originalElement) {
          return translatedElements.some(
            translatedElement => (translatedElement === originalElement));
        }) : Array.from(
          originalElements, function(originalElement) {
            return translatedElements.some(
              translatedElement => (
                translatedElement === originalElement
                && originalElement !== ''));
          });
      return states;
    };

    $scope.getTexts = function(rawText) {
      const foundImageFilePaths = $scope.findImgAttributes(
        rawText, 'filepath-with-value');
      const foundImageAltTxts = $scope.findImgAttributes(
        rawText, 'alt-with-value');
      const foundImageDescriptions = $scope.findImgAttributes(
        rawText, 'caption-with-value');

      return {
        foundImageFilePaths,
        foundImageAltTxts,
        foundImageDescriptions
      };
    };

    $scope.validateImages = function(textToTranslate,
      translatedText): TranslationError {
      const translatedElements = $scope.getTexts(translatedText);
      const originalElements = $scope.getTexts(textToTranslate);

      const copiedImgStates = $scope.findAvailableElements(
        originalElements.foundImageFilePaths,
        translatedElements.foundImageFilePaths, true);
      const duplicateImgAltTextStates = $scope.findAvailableElements(
        originalElements.foundImageAltTxts,
        translatedElements.foundImageAltTxts, false);
      const duplicateImgDescriptionStates = $scope.findAvailableElements(
        originalElements.foundImageDescriptions,
        translatedElements.foundImageDescriptions, false);

      const hasUncopiedImgs = copiedImgStates.some(state => state === false);
      const hasDuplicateAltTexts = duplicateImgAltTextStates.some(
        state => state === true);
      const hasDuplicateDescriptions = duplicateImgDescriptionStates.some(
        state => state === true);

      return new TranslationError(
        false, hasUncopiedImgs, hasDuplicateAltTexts,
        hasDuplicateDescriptions);
    };

    $scope.returnToPreviousTranslation = function() {
      var textAndAvailability = (
        TranslateTextService.getPreviousTextToTranslate());
      $scope.textToTranslate = textAndAvailability.text;
      $scope.previousTranslationAvailable = textAndAvailability.more;
    };

    $scope.suggestTranslatedText = function() {
      $scope.hasImgCopyError = false;
      $scope.hasImgTextError = false;
      const originalElements = angular.element(
        $scope.textToTranslate);
      const translatedElements = angular.element(
        $scope.activeWrittenTranslation.html);

      let translationValidators = $scope.validateImages(
        originalElements, translatedElements);

      if (translationValidators.hasUncopiedImgs) {
        $scope.hasImgCopyError = true;
      } else if (translationValidators.hasDuplicateAltTexts ||
        translationValidators.hasDuplicateDescriptions) {
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
      }
    };
  }
]);
