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

import isEqual from 'lodash/isEqual';

import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AlertsService } from 'services/alerts.service';
import { CkEditorCopyContentService } from 'components/ck-editor-helpers/ck-editor-copy-content.service';
import { ContextService } from 'services/context.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { Status, TranslatableItem, TranslateTextService } from 'pages/contributor-dashboard-page/services/translate-text.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { UserService } from 'services/user.service';
import { AppConstants } from 'app.constants';
import constants from 'assets/constants';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { ListSchema, UnicodeSchema } from 'services/schema-default-value.service';
import {
  TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING,
  TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING
} from 'domain/exploration/WrittenTranslationObjectFactory';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

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
export interface ImageDetails {
  filePaths: string[];
  alts: string[];
  descriptions: string[];
}
export class TranslationError {
  constructor(
    private _hasDuplicateAltTexts: boolean,
    private _hasDuplicateDescriptions: boolean,
    private _hasUntranslatedElements: boolean) {}

  get hasDuplicateDescriptions(): boolean {
    return this._hasDuplicateDescriptions;
  }
  get hasDuplicateAltTexts(): boolean {
    return this._hasDuplicateAltTexts;
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
  activeDataFormat: string;
  activeWrittenTranslation: string | string[] = '';
  activeContentType: string;
  activeRuleDescription: string;
  uploadingTranslation = false;
  subheading: string;
  heading: string;
  loadingData = true;
  moreAvailable = false;
  textToTranslate: string | string[] = '';
  languageDescription: string;
  activeStatus: Status;
  HTML_SCHEMA: {
    'type': string;
    'ui_config': UiConfig;
  };
  UNICODE_SCHEMA: UnicodeSchema = { type: 'unicode' };
  SET_OF_STRINGS_SCHEMA: ListSchema = {
    type: 'list',
    items: {
      type: 'unicode'
    }
  };
  TRANSLATION_TIPS = constants.TRANSLATION_TIPS;
  activeLanguageCode: string;
  isActiveLanguageReviewer: boolean = false;
  hadCopyParagraphError = false;
  hasImgTextError = false;
  hasIncompleteTranslationError = false;
  editorIsShown = true;
  ALLOWED_CUSTOM_TAGS_IN_TRANSLATION_SUGGESTION = [
    'oppia-noninteractive-image',
    'oppia-noninteractive-link',
    'oppia-noninteractive-math',
    'oppia-noninteractive-skillreview'
  ];

  constructor(
    private readonly activeModal: NgbActiveModal,
    private readonly alertsService: AlertsService,
    private readonly ckEditorCopyContentService: CkEditorCopyContentService,
    private readonly contextService: ContextService,
    private readonly imageLocalStorageService: ImageLocalStorageService,
    private readonly siteAnalyticsService: SiteAnalyticsService,
    private readonly translateTextService: TranslateTextService,
    private readonly translationLanguageService: TranslationLanguageService,
    private readonly userService: UserService,
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
        const translatableItem = (
          this.translateTextService.getTextToTranslate());
        this.updateActiveState(translatableItem);
        ({more: this.moreAvailable} = translatableItem);
        this.loadingData = false;
      });
    this.userService.getUserContributionRightsDataAsync().then(
    userContributionRights => {
        const reviewableLanguageCodes = (
          userContributionRights.can_review_translation_for_language_codes);
        if (reviewableLanguageCodes.includes(this.activeLanguageCode)) {
          this.isActiveLanguageReviewer = true;
        }
      });
    this.HTML_SCHEMA = {
      type: 'html',
      ui_config: {
        // If this is made true, then the translation cannot be validated
        // properly since contributors will not be able to view and translate
        // complex extensions.
        hide_complex_extensions: false,
        language: this.translationLanguageService.getActiveLanguageCode(),
        languageDirection: (
          this.translationLanguageService.getActiveLanguageDirection())
      }
    };
  }

  // TODO(#13221): Remove this method completely after the change detection
  // issues in schema-based-editor have been resolved. The current workaround
  // used is to destroy and re-render the component in the view.
  resetEditor(): void {
    this.editorIsShown = false;
    this.changeDetectorRef.detectChanges();
    this.editorIsShown = true;
  }

  close(): void {
    this.activeModal.close();
  }

  getHtmlSchema(): HTMLSchema {
    return this.HTML_SCHEMA;
  }

  getUnicodeSchema(): UnicodeSchema {
    return this.UNICODE_SCHEMA;
  }

  getSetOfStringsSchema(): ListSchema {
    return this.SET_OF_STRINGS_SCHEMA;
  }

  updateActiveState(translatableItem: TranslatableItem): void {
    (
      {
        text: this.textToTranslate,
        more: this.moreAvailable,
        status: this.activeStatus,
        translation: this.activeWrittenTranslation,
        dataFormat: this.activeDataFormat
      } = translatableItem
    );
    const {
      contentType,
      ruleType,
      interactionId
    } = translatableItem;
    this.activeContentType = this.getFormattedContentType(
      contentType, interactionId
    );
    this.activeRuleDescription = this.getRuleDescription(
      ruleType, interactionId
    );
  }

  onContentClick(event: MouseEvent): boolean | void {
    if (this.triedToCopyParagraph(event)) {
      return this.hadCopyParagraphError = true;
    }
    this.hadCopyParagraphError = false;
    if (this.isCopyModeActive()) {
      event.stopPropagation();
    }
    this.ckEditorCopyContentService.broadcastCopy(event.target as HTMLElement);
  }

  triedToCopyParagraph($event: MouseEvent): boolean {
    // Mathematical equations are also wrapped by <p> elements.
    // Hence, math elements should be allowed to be copied.
    // See issue #11683.
    const target = $event.target as HTMLElement;
    const paragraphChildrenElements: Element[] = (
      target.localName === 'p') ? Array.from(
        target.children) : [];
    const mathElementsIncluded = paragraphChildrenElements.some(
      child => child.localName === 'oppia-noninteractive-math');
    return target.localName === 'p' && !mathElementsIncluded;
  }

  isCopyModeActive(): boolean {
    return this.ckEditorCopyContentService.copyModeActive;
  }

  updateHtml($event: string): void {
    if ($event !== this.activeWrittenTranslation) {
      this.activeWrittenTranslation = $event;
      this.changeDetectorRef.detectChanges();
    }
  }

  hasPreviousTranslations(): boolean {
    return this.translateTextService.getActiveIndex() > 0;
  }

  skipActiveTranslation(): void {
    const translatableItem = (
      this.translateTextService.getTextToTranslate());
    this.updateActiveState(translatableItem);
    ({more: this.moreAvailable} = translatableItem);
    this.resetEditor();
  }

  isSubmitted(): boolean {
    return this.activeStatus === 'submitted';
  }

  returnToPreviousTranslation(): void {
    const translatableItem = (
      this.translateTextService.getPreviousTextToTranslate());
    this.updateActiveState(translatableItem);
    this.moreAvailable = true;
    this.resetEditor();
  }

  isSetOfStringDataFormat(): boolean {
    return (
      this.activeDataFormat ===
        TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING ||
      this.activeDataFormat === TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING
    );
  }

  getFormattedContentType(
      contentType: string, interactionId: string): string {
    if (contentType === 'interaction') {
      return interactionId + ' interaction';
    } else if (contentType === 'rule') {
      return 'input rule';
    }
    return contentType;
  }

  getRuleDescription(ruleType: string, interactionId: string): string {
    if (!ruleType || !interactionId) {
      return '';
    }
    // To match, e.g. "{{x|TranslatableSetOfNormalizedString}},".
    const descriptionPattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    const ruleDescription = INTERACTION_SPECS[
      interactionId].rule_descriptions[ruleType];
    return 'Answer ' + ruleDescription.replace(
      descriptionPattern, 'the following choices:');
  }

  getElementAttributeTexts(
      elements: HTMLCollectionOf<Element>, type: string): string[] {
    const textWrapperLength = 6;
    const attributes = Array.from(elements, function(element: Element) {
      // A sample element would be as <oppia-noninteractive-image alt-with-value
      // ="&amp;quot;Image description&amp;quot;" caption-with-value=
      // "&amp;quot;Image caption&amp;quot;" filepath-with-value="&amp;quot;
      // img_2021029_210552_zbmdt94_height_54_width_490.png&amp;quot;">
      // </oppia-noninteractive-image>
      if (element.localName === 'oppia-noninteractive-image') {
        const attribute = element.attributes[type].value;
        return attribute.substring(
          textWrapperLength, attribute.length - textWrapperLength);
      }
    });
    return attributes.filter(attribute => attribute);
  }

  getImageAttributeTexts(
      htmlElements: HTMLCollectionOf<Element>): ImageDetails {
    return {
      filePaths: this.getElementAttributeTexts(
        htmlElements, 'filepath-with-value'),
      alts: this.getElementAttributeTexts(
        htmlElements, 'alt-with-value'),
      descriptions: this.getElementAttributeTexts(
        htmlElements, 'caption-with-value')
    };
  }

  hasSomeDuplicateElements(
      originalElements: string[],
      translatedElements: string[]): boolean {
    if (originalElements.length === 0) {
      return false;
    }
    const hasMatchingTranslatedElement = element => (
      translatedElements.includes(element) && originalElements.length > 0);
    return originalElements.some(hasMatchingTranslatedElement);
  }

  isTranslationCompleted(
      originalElements: HTMLCollectionOf<Element>,
      translatedElements: HTMLCollectionOf<Element>): boolean {
    // Checks if there are custom tags present in the original content but not
    // in the translated content.
    const filteredOriginalElements = Array.from(
      originalElements, el => el.tagName.toLowerCase()).filter(
      tagName => this.ALLOWED_CUSTOM_TAGS_IN_TRANSLATION_SUGGESTION.includes(
        tagName)).sort();
    const filteredTranslatedElements = Array.from(
      translatedElements, el => el.tagName.toLowerCase()).filter(
      tagName => this.ALLOWED_CUSTOM_TAGS_IN_TRANSLATION_SUGGESTION.includes(
        tagName)).sort();
    return isEqual(filteredOriginalElements, filteredTranslatedElements);
  }

  validateTranslation(
      textToTranslate: HTMLCollectionOf<Element>,
      translatedText: HTMLCollectionOf<Element>): TranslationError {
    const translatedElements: ImageDetails = this.getImageAttributeTexts(
      translatedText);
    const originalElements: ImageDetails = this.getImageAttributeTexts(
      textToTranslate);

    const hasDuplicateAltTexts = this.hasSomeDuplicateElements(
      originalElements.alts,
      translatedElements.alts);
    const hasDuplicateDescriptions = this.hasSomeDuplicateElements(
      originalElements.descriptions,
      translatedElements.descriptions);
    const hasUntranslatedElements = !(this.isTranslationCompleted(
      textToTranslate, translatedText));

    return new TranslationError(
      hasDuplicateAltTexts,
      hasDuplicateDescriptions, hasUntranslatedElements);
  }

  suggestTranslatedText(): void {
    if (!this.isSetOfStringDataFormat()) {
      const domParser = new DOMParser();
      const originalElements = domParser.parseFromString(
        this.textToTranslate as string, 'text/html');
      const translatedElements = domParser.parseFromString(
        this.activeWrittenTranslation as string, 'text/html');

      const translationError = this.validateTranslation(
        originalElements.getElementsByTagName('*'),
        translatedElements.getElementsByTagName('*'));

      this.hasImgTextError = translationError.hasDuplicateAltTexts ||
        translationError.hasDuplicateDescriptions;
      this.hasIncompleteTranslationError = translationError.
        hasUntranslatedElements;

      if (this.hasImgTextError ||
        this.hasIncompleteTranslationError || this.uploadingTranslation ||
        this.loadingData) {
        return;
      }

      if (this.hadCopyParagraphError) {
        this.hadCopyParagraphError = false;
      }
    }

    if (!this.uploadingTranslation && !this.loadingData) {
      this.siteAnalyticsService
        .registerContributorDashboardSubmitSuggestionEvent('Translation');
      this.uploadingTranslation = true;
      const imagesData = this.imageLocalStorageService.getStoredImagesData();
      this.imageLocalStorageService.flushStoredImagesData();
      this.translateTextService.suggestTranslatedText(
        this.activeWrittenTranslation,
        this.translationLanguageService.getActiveLanguageCode(),
        imagesData, this.activeDataFormat, () => {
          this.alertsService.addSuccessMessage(
            'Submitted translation for review.');
          this.uploadingTranslation = false;
          if (this.moreAvailable) {
            this.skipActiveTranslation();
            this.resetEditor();
          } else {
            this.activeWrittenTranslation = '';
            this.resetEditor();
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
