// Copyright 2021 The Oppia Authors. All Rights Reserved.
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

import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AlertsService } from 'services/alerts.service';
import { CkEditorCopyContentService } from 'components/ck-editor-helpers/ck-editor-copy-content-service';
import { ContextService } from 'services/context.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { Status, TranslateTextService } from 'pages/contributor-dashboard-page/services/translate-text.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { AppConstants } from 'app.constants';
import constants from 'assets/constants';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';

class UiConfig {
  'hide_complex_extensions': boolean;
  'startupFocusEnabled'?: boolean;
  'language'?: string;
  'languageDirection'?: string;
}
export interface TranslationOpportunity {
  id: string;
  heading: string;
  subheading: string;
  progressPercentage: string;
  actionButtonTitle: string;
}
export interface HTMLSchema {
    'type': string;
    'ui_config': UiConfig;
}

@Component({
  selector: 'oppia-translation-modal',
  templateUrl: './translation-modal.component.html'
})
export class TranslationModalComponent {
  @Input() opportunity: TranslationOpportunity;
  activeWrittenTranslation: {html: string} = {html: ''};
  uploadingTranslation = false;
  subheading: string;
  heading: string;
  loadingData = true;
  moreAvailable = false;
  textToTranslate = '';
  languageDescription: string;
  activeStatus: Status;
  HTML_SCHEMA: {
    'type': string;
    'ui_config': UiConfig;
  };
  TRANSLATION_TIPS = constants.TRANSLATION_TIPS;
  activeLanguageCode: string;

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly alertsService: AlertsService,
    private readonly ckEditorCopyContentService: CkEditorCopyContentService,
    private readonly contextService: ContextService,
    private readonly imageLocalStorageService: ImageLocalStorageService,
    private readonly siteAnalyticsService: SiteAnalyticsService,
    private readonly translateTextService: TranslateTextService,
    private readonly translationLanguageService: TranslationLanguageService,
    private readonly changeDetectorRef: ChangeDetectorRef
  ) {
    this.contextService = OppiaAngularRootComponent.contextService;
  }

  ngOnInit(): void {
    this.activeLanguageCode =
    this.translationLanguageService.getActiveLanguageCode();
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
        this.activeStatus = textAndAvailability.status;
        this.activeWrittenTranslation.html = (
          textAndAvailability.translationHtml);
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

  getHtmlSchema(): HTMLSchema {
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

  updateHtml($event: string): void {
    if ($event !== this.activeWrittenTranslation.html) {
      this.activeWrittenTranslation.html = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  hasPreviousTranslations(): boolean {
    return this.translateTextService.getActiveIndex() > 0;
  }

  skipActiveTranslation(): void {
    const textAndAvailability = (
      this.translateTextService.getTextToTranslate());
    this.textToTranslate = textAndAvailability.text;
    this.moreAvailable = textAndAvailability.more;
    this.activeStatus = textAndAvailability.status;
    this.activeWrittenTranslation.html = textAndAvailability.translationHtml;
  }

  isSubmitted(): boolean {
    return this.activeStatus === 'submitted';
  }

  returnToPreviousTranslation(): void {
    const textAndAvailability = (
      this.translateTextService.getPreviousTextToTranslate());
    this.textToTranslate = textAndAvailability.text;
    this.moreAvailable = true;
    this.activeStatus = textAndAvailability.status;
    this.activeWrittenTranslation.html = textAndAvailability.translationHtml;
  }

  suggestTranslatedText(): void {
    if (!this.uploadingTranslation && !this.loadingData) {
      this.siteAnalyticsService
        .registerContributorDashboardSubmitSuggestionEvent('Translation');
      this.uploadingTranslation = true;
      const imagesData = this.imageLocalStorageService.getStoredImagesData();
      this.imageLocalStorageService.flushStoredImagesData();
      this.translateTextService.suggestTranslatedText(
        this.activeWrittenTranslation.html,
        this.translationLanguageService.getActiveLanguageCode(),
        imagesData, () => {
          this.alertsService.addSuccessMessage(
            'Submitted translation for review.');
          this.uploadingTranslation = false;
          if (this.moreAvailable) {
            const textAndAvailability = (
              this.translateTextService.getTextToTranslate());
            this.textToTranslate = textAndAvailability.text;
            this.moreAvailable = textAndAvailability.more;
            this.activeStatus = textAndAvailability.status;
            this.activeWrittenTranslation.html = (
              textAndAvailability.translationHtml);
          } else {
            this.activeWrittenTranslation.html = '';
          }
        }, () => {
          this.contextService.resetImageSaveDestination();
          this.close();
        });
    }
    if (!this.moreAvailable) {
      this.contextService.resetImageSaveDestination();
      this.close();
    }
  }
}

angular.module('oppia').directive(
  'oppiaTranslationModal', downgradeComponent(
    {component: TranslationModalComponent}));
