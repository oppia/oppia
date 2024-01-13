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

import { ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core';
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
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { ListSchema, UnicodeSchema } from 'services/schema-default-value.service';
import {
  TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING,
  TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING
} from 'domain/exploration/WrittenTranslationObjectFactory';
// This throws "TS2307". We need to
// suppress this error because rte-output-display is not strictly typed yet.
// @ts-ignore
import { RteOutputDisplayComponent } from 'rich_text_components/rte-output-display.component';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

class UiConfig {
  'hide_complex_extensions': boolean;
  'startupFocusEnabled'?: boolean;
  'language'?: string;
  'languageDirection'?: string;
}

enum ExpansionTabType {
  CONTENT,
  TRANSLATION
}

export interface TranslationOpportunity {
  id: string;
  heading: string;
  subheading: string;
  progressPercentage: string;
  actionButtonTitle: string;
  inReviewCount: number;
  totalCount: number;
  translationsCount: number;
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
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() opportunity!: TranslationOpportunity;
  activeDataFormat!: string;
  activeWrittenTranslation: string | string[] = '';
  activeContentType!: string;
  activeRuleDescription!: string;
  uploadingTranslation: boolean = false;
  subheading!: string;
  heading!: string;
  loadingData: boolean = true;
  moreAvailable: boolean = false;
  textToTranslate: string | string[] = '';
  activeStatus!: Status;
  activeLanguageCode!: string;
  HTML_SCHEMA!: {
    'type': string;
    'ui_config': UiConfig;
  };

  // Language description is null when active language code is invalid.
  languageDescription: string | null = null;
  UNICODE_SCHEMA: UnicodeSchema = { type: 'unicode' };
  SET_OF_STRINGS_SCHEMA: ListSchema = {
    type: 'list',
    items: {
      type: 'unicode'
    }
  };

  TRANSLATION_TIPS = AppConstants.TRANSLATION_TIPS;
  isActiveLanguageReviewer: boolean = false;
  hadCopyParagraphError: boolean = false;
  hasImgTextError: boolean = false;
  hasIncompleteTranslationError: boolean = false;
  editorIsShown: boolean = true;
  isContentExpanded: boolean = false;
  isTranslationExpanded: boolean = true;
  isContentOverflowing: boolean = false;
  isTranslationOverflowing: boolean = false;
  textWhenExpanded: string = 'View Less';
  textWhenContracted: string = 'View More';
  // The value of cutoff must be equal to 'max-height' - 1 set in the
  // class '.oppia-container-contracted' in 'translation-modal.component.html'.
  cutoff_height: number = 29;
  ALLOWED_CUSTOM_TAGS_IN_TRANSLATION_SUGGESTION = [
    'oppia-noninteractive-image',
    'oppia-noninteractive-link',
    'oppia-noninteractive-math',
    'oppia-noninteractive-skillreview'
  ];

  @ViewChild('contentPanel')
    contentPanel!: RteOutputDisplayComponent;

  @ViewChild('contentContainer')
    contentContainer!: ElementRef;

  @ViewChild('translationContainer')
    translationContainer!: ElementRef;

  constructor(
    public readonly activeModal: NgbActiveModal,
    private readonly alertsService: AlertsService,
    private readonly ckEditorCopyContentService: CkEditorCopyContentService,
    private readonly contextService: ContextService,
    private readonly imageLocalStorageService: ImageLocalStorageService,
    private readonly siteAnalyticsService: SiteAnalyticsService,
    private readonly translateTextService: TranslateTextService,
    private readonly translationLanguageService: TranslationLanguageService,
    private readonly userService: UserService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly wds: WindowDimensionsService
  ) {
    this.contextService = OppiaAngularRootComponent.contextService;
  }

  public get expansionTabType(): typeof ExpansionTabType {
    return ExpansionTabType;
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
        if (!userContributionRights) {
          throw new Error('User contribution rights not found.');
        }
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

  ngAfterViewInit(): void {
    this.computePanelOverflowState();
  }

  ngAfterContentChecked(): void {
    this.computeTranslationEditorOverflowState();
  }

  computeTranslationEditorOverflowState(): void {
    const windowHeight = this.wds.getHeight();
    const heightLimit = windowHeight * (this.cutoff_height) / 100;

    this.isTranslationOverflowing = (
      this.translationContainer?.nativeElement.offsetHeight >=
        heightLimit
    );
  }

  computePanelOverflowState(): void {
    // The delay of 500ms is required to allow the content to load
    // before the overflow status is calculated. Values less than
    // 500ms also work but they sometimes lead to unexpected results.
    setTimeout(() => {
      this.isContentOverflowing = (
        this.contentPanel?.elementRef.nativeElement.offsetHeight >
        this.contentContainer?.nativeElement.offsetHeight);
    }, 500);
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

    // Reset copyMode to the default value and avoid console errors.
    this.ckEditorCopyContentService.copyModeActive = false;
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

  toggleExpansionState(tab: ExpansionTabType): void {
    if (tab === ExpansionTabType.CONTENT) {
      this.isContentExpanded = !this.isContentExpanded;
    } else if (tab === ExpansionTabType.TRANSLATION) {
      this.isTranslationExpanded = !this.isTranslationExpanded;
    }
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
      contentType: string, interactionId: string | undefined): string {
    switch (contentType) {
      case 'interaction':
        return interactionId + ' interaction';
      case 'ca':
        // Customization_arg. This is typically a button label, input
        // placeholder text, or a multiple choice option.
        return 'label';
      case 'rule':
        return 'input rule';
    }
    return contentType;
  }

  getRuleDescription(ruleType?: string, interactionId?: string): string {
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
        const attribute = element.attributes[
          type as keyof NamedNodeMap] as Attr;
        const attributeValue = attribute.value;
        return attributeValue.substring(
          textWrapperLength, attributeValue.length - textWrapperLength);
      }
    });
    // Typecasted to string[] because Array.from() returns
    // (string | undefined)[] and we need to remove the undefined elements.
    return attributes.filter(attributeValues => attributeValues) as string[];
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
    // This regular expression matches a number, optionally negative, with an
    // optional decimal number followed by zero or more operators (including
    // equals sign) and number pairs. It also allows for whitespace between
    // numbers and operators. Examples 1+1=2 1+1 1*1=1.
    const mathEquationRegex = new RegExp(
      /(?:(?:^|[-+_*/=])(?:\s*-?\d+(\.\d+)?(?:[eE][+-]?\d+)?\s*))+$/);
    if (originalElements.length === 0) {
      return false;
    }
    const hasMatchingTranslatedElement = (element: string) => (
      translatedElements.includes(element) && originalElements.length > 0 &&
      !mathEquationRegex.test(element));
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
          }
        }, (errorReason: string) => {
          this.contextService.resetImageSaveDestination();
          this.alertsService.clearWarnings();
          this.alertsService.addWarning(errorReason);
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
