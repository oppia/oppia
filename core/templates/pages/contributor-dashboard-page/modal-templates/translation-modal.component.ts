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
import { typeOf } from 'mathjs';

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
export class TranslationError {
  constructor(
    private _hasUncopiedImgs: boolean,
    private _hasDuplicateAltTexts: boolean,
    private _hasDuplicateDescriptions: boolean,
    private _hasUntranslatedElements: boolean) {}

  get hasDuplicateDescriptions(): boolean {
    return this._hasDuplicateDescriptions;
  }
  get hasDuplicateAltTexts(): boolean {
    return this._hasDuplicateAltTexts;
  }
  get hasUncopiedImgs(): boolean {
    return this._hasUncopiedImgs;
  }
  get hasUntranslatedElements(): boolean {
    return this._hasUntranslatedElements;
  }
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
  hasImgCopyError = false;
  triedToCopyText = false;
  hasImgTextError = false;
  incompleteTranslationError = false;

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

  onContentClick(event: MouseEvent) {
    const paragraphCopyValidation = this.validateParagraphCopy(event);
    if (paragraphCopyValidation) {
      return this.triedToCopyText = true;
    }
    this.triedToCopyText = false;
    if (this.isCopyModeActive()) {
      event.stopPropagation();
    }
    this.ckEditorCopyContentService.broadcastCopy(event.target as HTMLElement);
  }

  validateParagraphCopy($event) {
    // Mathematical equations are also wrapped by <p> elements.
    // Hence, math elements should be allowed to be copied.
    // See issue #11683.
    const paragraphChildrenElements: HTMLElement[] = (
      $event.target.localName === 'p') ? Array.from(
        $event.target.children) : [];
    const triedTextCopy = $event.target.localName === 'p' && !(
      paragraphChildrenElements.some(
        child => child.localName === 'oppia-noninteractive-math'));
    return triedTextCopy;
  };

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

  getElementAttributeTexts(elements, type) {
    const textWrapperLength = 6;
    const attributes = Array.from(elements, function(element: HTMLElement) {
      // A sample element would be as <oppia-noninteractive-image alt-with-value=
      // "&amp;quot;Image description&amp;quot;" caption-with-value=
      // "&amp;quot;Image caption&amp;quot;" filepath-with-value="&amp;quot;
      // img_20210129_210552_zbv0mdty94_height_54_width_490.png&amp;quot;">
      // </oppia-noninteractive-image>
      if (element.localName === 'oppia-noninteractive-image') {
        const attribute = element.attributes[type].value;
        return attribute.substring(
          textWrapperLength, attribute.length - textWrapperLength);
      }
    });
    return attributes.filter(attribute => attribute);
  }

  getImageAttributeTexts(htmlElements: [HTMLElement]) {
    const imageFilePaths = this.getElementAttributeTexts(
      htmlElements, 'filepath-with-value');
    const imageAlts = this.getElementAttributeTexts(
      htmlElements, 'alt-with-value');
    const imageDescriptions = this.getElementAttributeTexts(
      htmlElements, 'caption-with-value');

    return {
      foundImageFilePaths: imageFilePaths,
      foundImageAlts: imageAlts,
      foundImageDescriptions: imageDescriptions
    };
  }

  copiedAllElements(
    originalElements, translatedElements) {
    const hasMatchingTranslatedElement = (element) => (
      translatedElements.includes(element));
    return originalElements.every(hasMatchingTranslatedElement);
  }

  hasSomeDuplicateElements = function(
    originalElements: HTMLElement[], translatedElements: HTMLElement[]) {
    if (originalElements.length === 0) {
      return false;
    }
    const hasMatchingTranslatedElement = (element) => (
      translatedElements.includes(element) && originalElements.length > 0);
    return originalElements.some(hasMatchingTranslatedElement);
  }

  isTranslationCompleted = function(
    originalElements: HTMLElement[], translatedElements: HTMLElement[]) {
    originalElements.sort();
    translatedElements.sort();

    const filteredOriginalElements = originalElements.filter(
      (element: HTMLElement) => element.nodeType === Node.ELEMENT_NODE);
    const filteredTranslatedElements = translatedElements.filter(
      (element: HTMLElement) => element.nodeType === Node.ELEMENT_NODE);

    if (filteredOriginalElements.length !== filteredTranslatedElements.length) return false;

    for (const [i, originalElement] of filteredOriginalElements.entries()) {
      if (originalElement.nodeName !== filteredTranslatedElements[
        i].nodeName) return false;
    }
    return true;
  }

  validateTranslation = function(
    textToTranslate: HTMLElement[],
    translatedText: HTMLElement[]): TranslationError {
    const translatedElements = this.getImageAttributeTexts(translatedText);
    const originalElements = this.getImageAttributeTexts(textToTranslate);

    const hasUncopiedImgs = !this.copiedAllElements(
      originalElements.foundImageFilePaths,
      translatedElements.foundImageFilePaths);
    const hasDuplicateAltTexts = this.hasSomeDuplicateElements(
      originalElements.foundImageAlts,
      translatedElements.foundImageAlts);
    const hasDuplicateDescriptions = this.hasSomeDuplicateElements(
      originalElements.foundImageDescriptions,
      translatedElements.foundImageDescriptions);
    const hasUntranslatedElements = !(this.isTranslationCompleted(
      textToTranslate, translatedText));

    return new TranslationError(
      hasUncopiedImgs, hasDuplicateAltTexts,
      hasDuplicateDescriptions, hasUntranslatedElements);
  }

  suggestTranslatedText(): void {
    const originalElements = Array.from(angular.element(
      this.textToTranslate));
    const translatedElements = Array.from(angular.element(
      this.activeWrittenTranslation.html));

    const translationError = this.validateTranslation(
      originalElements, translatedElements);

    this.hasImgCopyError = translationError.hasUncopiedImgs;
    this.hasImgTextError = translationError.hasDuplicateAltTexts ||
      translationError.hasDuplicateDescriptions;
    this.incompleteTranslationError = translationError.
      hasUntranslatedElements;

    if (this.hasImgCopyError || this.hasImgTextError ||
      this.incompleteTranslationError || this.uploadingTranslation ||
      this.loadingData) {
      return;
    }
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
