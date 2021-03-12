// // Copyright 2020 The Oppia Authors. All Rights Reserved.
// //
// // Licensed under the Apache License, Version 2.0 (the "License");
// // you may not use this file except in compliance with the License.
// // You may obtain a copy of the License at
// //
// //      http://www.apache.org/licenses/LICENSE-2.0
// //
// // Unless required by applicable law or agreed to in writing, software
// // distributed under the License is distributed on an "AS-IS" BASIS,
// // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// // See the License for the specific language governing permissions and
// // limitations under the License.

// /**
//  * @fileoverview Controller for the translation modal.
//  */

// require(
//   'components/common-layout-directives/common-elements/' +
//   'confirm-or-cancel-modal.controller.ts');

// require('pages/contributor-dashboard-page/services/translate-text.service.ts');
// require(
//   'pages/exploration-editor-page/translation-tab/services/' +
//   'translation-language.service.ts');
// require('services/alerts.service.ts');
// require('services/context.service.ts');
// require('components/ck-editor-helpers/ck-editor-copy-content-service.ts');
// require('services/image-local-storage.service.ts');
// require('services/site-analytics.service.ts');

// angular.module('oppia').controller('TranslationModalController', [
//   '$controller', '$scope', '$uibModalInstance', 'AlertsService',
//   'CkEditorCopyContentService', 'ContextService', 'ImageLocalStorageService',
//   'SiteAnalyticsService', 'TranslateTextService', 'TranslationLanguageService',
//   'opportunity', 'ENTITY_TYPE',
//   function(
//       $controller, $scope, $uibModalInstance, AlertsService,
//       CkEditorCopyContentService, ContextService, ImageLocalStorageService,
//       SiteAnalyticsService, TranslateTextService, TranslationLanguageService,
//       opportunity, ENTITY_TYPE) {
//     $controller('ConfirmOrCancelModalController', {
//       $scope: $scope,
//       $uibModalInstance: $uibModalInstance
//     });
//     // We need to set the context here so that the rte fetches
//     // images for the given ENTITY_TYPE and targetId.
//     ContextService.setCustomEntityContext(
//       ENTITY_TYPE.EXPLORATION, opportunity.id);

//     ContextService.setImageSaveDestinationToLocalStorage();
//     $scope.uploadingTranslation = false;
//     $scope.activeWrittenTranslation = {};
//     $scope.activeWrittenTranslation.html = '';
//     $scope.HTML_SCHEMA = {
//       type: 'html',
//       ui_config: {
//         hide_complex_extensions: 'true',
//         language: TranslationLanguageService.getActiveLanguageCode(),
//         languageDirection: (
//           TranslationLanguageService.getActiveLanguageDirection())
//       }
//     };
//     $scope.subheading = opportunity.subheading;
//     $scope.heading = opportunity.heading;
//     $scope.loadingData = true;
//     $scope.moreAvailable = false;
//     $scope.textToTranslate = '';
//     $scope.languageDescription = (
//       TranslationLanguageService.getActiveLanguageDescription());
//     TranslateTextService.init(
//       opportunity.id,
//       TranslationLanguageService.getActiveLanguageCode(),
//       function() {
//         var textAndAvailability = (
//           TranslateTextService.getTextToTranslate());
//         $scope.textToTranslate = textAndAvailability.text;
//         $scope.moreAvailable = textAndAvailability.more;
//         $scope.loadingData = false;
//       });

//     $scope.onContentClick = function($event) {
//       if ($scope.isCopyModeActive()) {
//         $event.stopPropagation();
//       }
//       CkEditorCopyContentService.broadcastCopy($event.target);
//     };

//     $scope.isCopyModeActive = function() {
//       return CkEditorCopyContentService.copyModeActive;
//     };

//     $scope.skipActiveTranslation = function() {
//       var textAndAvailability = (
//         TranslateTextService.getTextToTranslate());
//       $scope.textToTranslate = textAndAvailability.text;
//       $scope.moreAvailable = textAndAvailability.more;
//       $scope.activeWrittenTranslation.html = '';
//     };

//     $scope.suggestTranslatedText = function() {
//       if (!$scope.uploadingTranslation && !$scope.loadingData) {
//         SiteAnalyticsService.registerContributorDashboardSubmitSuggestionEvent(
//           'Translation');
//         $scope.uploadingTranslation = true;
//         var imagesData = ImageLocalStorageService.getStoredImagesData();
//         ImageLocalStorageService.flushStoredImagesData();
//         ContextService.resetImageSaveDestination();
//         TranslateTextService.suggestTranslatedText(
//           $scope.activeWrittenTranslation.html,
//           TranslationLanguageService.getActiveLanguageCode(),
//           imagesData, function() {
//             AlertsService.addSuccessMessage(
//               'Submitted translation for review.');
//             if ($scope.moreAvailable) {
//               var textAndAvailability = (
//                 TranslateTextService.getTextToTranslate());
//               $scope.textToTranslate = textAndAvailability.text;
//               $scope.moreAvailable = textAndAvailability.more;
//             }
//             $scope.activeWrittenTranslation.html = '';
//             $scope.uploadingTranslation = false;
//           }, () => {
//             $uibModalInstance.close();
//           });
//       }
//       if (!$scope.moreAvailable) {
//         $uibModalInstance.close();
//       }
//     };
//   }
// ]);

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
 * @fileoverview Component for the translation modal.
*/

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AlertsService } from 'services/alerts.service';
import { CkEditorCopyContentService } from 'components/ck-editor-helpers/ck-editor-copy-content-service';
import { ContextService } from 'services/context.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { TranslateTextService } from 'pages/contributor-dashboard-page/services/translate-text.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { AppConstants } from 'app.constants';

class UiConfig {
  'hide_complex_extensions': boolean;
  'startupFocusEnabled'?: boolean;
  'language'?: string;
  'languageDirection'?: string;
}
export class TranslationOpportunityDict {
  id: string;
  heading: string;
  subheading: string;
  progressPercentage: string;
  actionButtonTitle: string;
}

@Component({
  selector: 'translation-modal',
  templateUrl: './translation-modal.component.html',
  styleUrls: [],
  providers: []
})
export class TranslationModalContent {
  @Input() opportunity: TranslationOpportunityDict;
  activeWrittenTranslation: {html: string} = {html: ''};
  uploadingTranslation = false;
  subheading: string;
  heading: string;
  loadingData = true;
  moreAvailable = false;
  textToTranslate = '';
  languageDescription: string;
  HTML_SCHEMA: {
    'type': string;
    'ui_config': UiConfig;
  };

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly alertsService: AlertsService,
    private readonly ckEditorCopyContentService: CkEditorCopyContentService,
    private readonly contextService: ContextService,
    private readonly imageLocalStorageService: ImageLocalStorageService,
    private readonly siteAnalyticsService: SiteAnalyticsService,
    private readonly translateTextService: TranslateTextService,
    private readonly translationLanguageService: TranslationLanguageService) {}

  ngOnInit(): void {
    // We need to set the context here so that the rte fetches
    // images for the given ENTITY_TYPE and targetId.
    this.contextService.setCustomEntityContext(
      AppConstants.ENTITY_TYPE.EXPLORATION, this.opportunity.id);
    this.subheading = this.opportunity.subheading;
    this.heading = this.opportunity.heading;
    this.contextService.setImageSaveDestinationToLocalStorage();
    this.languageDescription = (
      this.translationLanguageService.getActiveLanguageDescription());
    this.translateTextService.init(
      this.opportunity.id,
      this.translationLanguageService.getActiveLanguageCode(),
      () => {
        const textAndAvailability = (
          this.translateTextService.getTextToTranslate());
        this.textToTranslate = textAndAvailability.text;
        this.moreAvailable = textAndAvailability.more;
        this.loadingData = false;
      });
    this.HTML_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: true,
        language: this.translationLanguageService.getActiveLanguageCode(),
        languageDirection: (
          this.translationLanguageService.getActiveLanguageDirection())
      }
    };
  }


  close(): void {
    this.activeModal.close();
  }

  getHtmlSchema(): {
    'type': string;
    'ui_config': UiConfig;
    } {
    return this.HTML_SCHEMA;
  }

  onContentClick(event: MouseEvent): void {
    if (this.isCopyModeActive()) {
      event.stopPropagation();
    }
    this.ckEditorCopyContentService.broadcastCopy(event.target as HTMLElement);
  }

  isCopyModeActive(): boolean {
    return this.ckEditorCopyContentService.copyModeActive;
  }

  skipActiveTranslation(): void {
    const textAndAvailability = (
      this.translateTextService.getTextToTranslate());
    this.textToTranslate = textAndAvailability.text;
    this.moreAvailable = textAndAvailability.more;
    this.activeWrittenTranslation.html = '';
  }

  suggestTranslatedText(): void {
    if (!this.uploadingTranslation && !this.loadingData) {
      this.siteAnalyticsService
        .registerContributorDashboardSubmitSuggestionEvent('Translation');
      this.uploadingTranslation = true;
      const imagesData = this.imageLocalStorageService.getStoredImagesData();
      this.imageLocalStorageService.flushStoredImagesData();
      this.contextService.resetImageSaveDestination();
      this.translateTextService.suggestTranslatedText(
        this.activeWrittenTranslation.html,
        this.translationLanguageService.getActiveLanguageCode(),
        imagesData, () => {
          this.alertsService.addSuccessMessage(
            'Submitted translation for review.');
          if (this.moreAvailable) {
            const textAndAvailability = (
              this.translateTextService.getTextToTranslate());
            this.textToTranslate = textAndAvailability.text;
            this.moreAvailable = textAndAvailability.more;
          }
          this.activeWrittenTranslation.html = '';
          this.uploadingTranslation = false;
        });
    }
    if (!this.moreAvailable) {
      this.close();
    }
  }
}

angular.module('oppia').directive(
  'translationModalComponent', downgradeComponent(
    {component: TranslationModalContent}));
