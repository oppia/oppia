// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
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
    $scope.TRANSLATION_TIPS = {
      zh:
      [
        'Write fractions or numbers as they are, unless they are written out' +
        'in words. For instance, one-fifth would be (五分之一)',
        'When referring to Mr. Baker' +
        '(or, in general, Mr./Ms. followed by an occupation), ' +
        'leave it as Baker先生, since in certain cases Baker is the last name.',
        'Make sure to use the correct punctuation:',
        'Period = 。',
        'Comma for compound sentences or translation phrases = ，',
        'Comma for list of numbers or objects = 、',
        'Preserve bolding. If the original content has bold text,' +
        'make sure it is bold in Chinese as well.',
        'Make sure that you have selected the correct words' +
        '(e.g. words such as 再 and 在 ).'
      ],
      hi:
      [
        'Prefer simple Hindi words that are used in daily communication.' +
        ' Note that common English words (pen, paper, cake, etc.) can be' +
        ' written as transliterations (पेन, पेपर, केक). For harder words,' +
        ' include the English word in parentheses, e.g. अंश (Numerator),' +
        ' हर (Denominator), भिन्न (Fraction).',
        'Use respectful pronouns (like “आप” instead of “तुम/तू ”) and a' +
        ' corresponding respectful tone like “करिये, करेंगे”.',
        'Use the same voice (active or passive)' +
        ' as in the original English text.',
        'Preserve punctuation and bolding. If the original content has' +
        ' bold text, make sure it is bold in Hindi as well. If there' +
        ' are bullet points, double quotes, etc., make sure that the' +
        ' translated content also has bullet points and double quotes.',
        'If the original card has “components” (such as pictures,' +
        ' links, and equations), these need to be added to the' +
        ' translated content. You can use the “Copy tool” for this' +
        ' -- click on the Copy tool and then click on the component you want' +
        ' to carry over. Also, double-click on the image and translate the ' +
        ' alt text (and caption, if any).'
      ],
      bn:
      [
        'Use simple Bangla words that are used in daily communication.' +
        ' Note that common English words (pencil, etc.) can be written as' +
        ' transliterations (e.g পেন্সিল ).',
        'Use proper punctuation.',
        'Full stop = |',
        'Use the same voice (active or passive)' +
        ' as in the original English text.',
        'Preserve punctuation and bolding. If the original' +
        ' content has bold text, make sure it is bold in' +
        ' Bangla as well. If there are bullet points, double quotes,' +
        ' etc., make sure that the translated content also has bullet' +
        ' points and double quotes.'
      ],
      ar:
      [
        'In Oppia, we prefer to use simple words that can be easily' +
        ' understood by children. For example, we use “تابع قائلًا”' +
        ' instead of “أردف قائلًا”. Furthermore, the English words that' +
        ' are used in the Arab society regularly can be translated as' +
        ' follows; Arabic word (The regularly used English word). For' +
        ' example, we can translate the word cupcakes this way;' +
        ' كعك القوالب الصغيرة (cupcakes). ',
        'Use respectful ways and formal prefixes to address people.' +
        ' For example, use “سيدي” and “سيدتي”. ',
        'If the name has a meaning in Arabic, or in English, such' +
        ' as Baker or Crumb, always use words that indicate that they' +
        ' are names before writing the name itself. For example,' +
        ' you can use one of the following words depending on the' +
        ' context; “السيد، السيدة، العم، الجد، الجدة، الآنسة.”',
        'Use the same voice (active or passive) as in the' +
        ' original English Text',
        'Preserve punctuation and bolding. If the original' +
        ' content has bold text, make sure it is bold in Arabic' +
        ' as well. If there are bullet points, double quotes, etc.,' +
        ' make sure that the translated content also has' +
        ' bullet points and double quotes.',
        'Use the hyperlinks to different cards as shown in' +
        ' the original English Text.',
      ]
    };
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
  }
]);
