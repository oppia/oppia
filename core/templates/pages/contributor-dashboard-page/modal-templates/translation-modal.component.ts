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

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AlertsService } from 'services/alerts.service';
import { CkEditorCopyContentService } from 'components/ck-editor-helpers/ck-editor-copy-content-service';
import { ContextService } from 'services/context.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { TranslateTextService } from 'pages/contributor-dashboard-page/services/translate-text.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';

@Component({
  selector: 'translation-modal',
  templateUrl: './translation-modal.directive.html',
  styleUrls: []
})
export class TranslationModalContent {
  activeWrittenTranslation: {html: string} = {html: ''};
  uploadingTranslation = false;
  subheading;
  heading;
  loadingData = true;
  moreAvailable = false;
  textToTranslate = '';
  languageDescription;
  HTML_SCHEMA;

  constructor(
    public activeModal: NgbActiveModal,
    private alertsService: AlertsService,
    private ckEditorCopyContentService: CkEditorCopyContentService,
    private contextService: ContextService,
    private imageLocalStorageService: ImageLocalStorageService,
    private siteAnalyticsService: SiteAnalyticsService,
    private translateTextService: TranslateTextService,
    private translationLanguageService: TranslationLanguageService,
    opportunity, ENTITY_TYPE) {
    // We need to set the context here so that the rte fetches
    // images for the given ENTITY_TYPE and targetId.
    this.contextService.setCustomEntityContext(
      ENTITY_TYPE.EXPLORATION, opportunity.id);
    this.subheading = opportunity.subheading;
    this.heading = opportunity.heading;
    this.contextService.setImageSaveDestinationToLocalStorage();
    this.languageDescription = (
      translationLanguageService.getActiveLanguageDescription());
    translateTextService.init(
      opportunity.id,
      translationLanguageService.getActiveLanguageCode(),
      () => {
        const textAndAvailability = (
          translateTextService.getTextToTranslate());
        this.textToTranslate = textAndAvailability.text;
        this.moreAvailable = textAndAvailability.more;
        this.loadingData = false;
      });
    this.HTML_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: 'true',
        language: this.translationLanguageService.getActiveLanguageCode(),
        languageDirection: (
          this.translationLanguageService.getActiveLanguageDirection())
      }
    };
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
        imagesData, function() {
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
      this.activeModal.close();
    }
  }
}

angular.module('oppia').directive(
  'translationModalComponent', downgradeComponent(
    {component: TranslationModalContent}));
