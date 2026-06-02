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

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';

import {AlertsService} from 'services/alerts.service';
import {CkEditorCopyContentService} from 'components/ck-editor-helpers/ck-editor-copy-content.service';
import {PageContextService} from 'services/page-context.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {
  Status,
  TranslatableItem,
  TranslateTextService,
} from 'pages/contributor-dashboard-page/services/translate-text.service';
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {UserService} from 'services/user.service';
import {TranslationValidationService} from 'services/translation-validation.service';
import {AppConstants} from 'app.constants';
import {ListSchema, UnicodeSchema} from 'services/schema-default-value.service';
import {
  TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING,
  TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING,
} from 'domain/exploration/written-translation.model';
// This throws "TS2307". We need to
// suppress this error because rte-output-display is not strictly typed yet.
// @ts-ignore
import {RteOutputDisplayComponent} from 'rich_text_components/rte-output-display.component';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {TranslatedContent} from 'domain/exploration/translated-content.model';
import {ConfirmTranslationExitModalComponent} from 'components/translation-suggestion-page/confirm-translation-exit-modal/confirm-translation-exit-modal.component';
import {WindowRef} from 'services/contextual/window-ref.service';
import {JoyrideService} from 'ngx-joyride';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TranslationTutorialImageCustomizationModalComponent} from './translation-tutorial-image-customization-modal.component';

const INTERACTION_SPECS = require('interactions/interaction_specs.json');

class UiConfig {
  'hide_complex_extensions': boolean;
  'rte_component_config_id': string;
  'startupFocusEnabled'?: boolean;
  'language'?: string;
  'languageDirection'?: string;
}

enum ExpansionTabType {
  CONTENT,
  TRANSLATION,
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
  reviewerOnlyContentCount: number;
}
export interface ModifyTranslationOpportunity {
  id: string;
  contentId: string;
  heading: string;
  subheading: string;
  textToTranslate: string;
  currentContentTranslation: TranslatedContent;
  interactionId?: string;
}
export interface HTMLSchema {
  type: string;
  ui_config: UiConfig;
}
export interface ImageDetails {
  filePaths: string[];
  alts: string[];
  descriptions: string[];
}

const TRANSLATION_TUTORIAL_EXPECTED_TRANSLATION =
  'Nos encantan las matemáticas';
const TRANSLATION_TUTORIAL_BACKDROP_COLOR = 'rgba(0, 0, 0, 0.55)';

@Component({
  selector: 'oppia-translation-modal',
  templateUrl: './translation-modal.component.html',
})
export class TranslationModalComponent {
  // These properties below are initialized using Angular lifecycle hooks
  // where we need to do non-null assertion. For more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() opportunity!: TranslationOpportunity;
  @Input() modifyTranslationOpportunity!: ModifyTranslationOpportunity;
  @Input() isTranslationTutorial: boolean = false;
  @Input() initialTranslationTutorialStepNumber: number = 3;
  @Output() tutorialEditorReady: EventEmitter<void> = new EventEmitter();
  @Output() tutorialProgressChange: EventEmitter<number> = new EventEmitter();
  activeDataFormat!: string;
  activeWrittenTranslation: string | string[] = '';
  activeContentType!: string;
  activeRuleDescription!: string;
  uploadingTranslation: boolean = false;
  subheading!: string;
  heading!: string;
  loadingData: boolean = true;
  moreAvailable: boolean = false;
  hasDataFormatListContent: boolean = false;
  textToTranslate: string | string[] = '';
  activeStatus!: Status;
  activeLanguageCode!: string;
  HTML_SCHEMA!: {
    type: string;
    ui_config: UiConfig;
  };

  // Language description is null when active language code is invalid.
  languageDescription: string | null = null;
  UNICODE_SCHEMA: UnicodeSchema = {type: 'unicode'};
  SET_OF_STRINGS_SCHEMA: ListSchema = {
    type: 'list',
    items: {
      type: 'unicode',
    },
  };

  TRANSLATION_TIPS = AppConstants.TRANSLATION_TIPS;
  translationTutorialImageUrl: string = '';
  copyToolTourPreviewImageUrl: string = '';
  translationTutorialImageWasClicked: boolean = false;
  translationTutorialImageWasCopied: boolean = false;
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
    'oppia-noninteractive-skillreview',
  ];

  @ViewChild('contentPanel')
  contentPanel!: RteOutputDisplayComponent;

  @ViewChild('contentContainer')
  contentContainer!: ElementRef;

  @ViewChild('translationContainer')
  translationContainer!: ElementRef;

  @ViewChild('TranslationCopyToolTourStep')
  translationCopyToolTourStep!: TemplateRef<unknown>;

  @ViewChild('TranslationTourPreviousButton')
  translationTourPreviousButton!: TemplateRef<unknown>;

  @ViewChild('TranslationTourNextButton')
  translationTourNextButton!: TemplateRef<unknown>;

  @ViewChild('TranslationTourDoneButton')
  translationTourDoneButton!: TemplateRef<unknown>;

  @ViewChild('TranslationTourCounter')
  translationTourCounter!: TemplateRef<unknown>;

  private translationTutorialModalElement: HTMLElement | null = null;
  private translationTutorialImageModalElement: HTMLElement | null = null;
  private readonly translationEditorJoyRideSteps: string[] = [
    'contributorDashboardTranslationOpportunity',
    'contributorDashboardTranslationEditor',
    'contributorDashboardTranslationCopyTool',
    'contributorDashboardTranslationSubmit',
  ];
  activeTranslationTutorialJoyrideStep: string = '';
  isEditorFocused: boolean = false;

  private beforeUnloadHandler: (e: BeforeUnloadEvent) => string | undefined =
    () => undefined;
  private readonly redrawTranslationTourOnModalScroll = (): void => {
    this.windowRef.nativeWindow.dispatchEvent(new Event('resize'));
    setTimeout(() => {
      this.positionTranslationCopyToolTourPopup();
    });
  };

  constructor(
    public readonly activeModal: NgbActiveModal,
    private readonly hostElement: ElementRef,
    private readonly alertsService: AlertsService,
    private readonly ckEditorCopyContentService: CkEditorCopyContentService,
    private readonly pageContextService: PageContextService,
    private readonly imageLocalStorageService: ImageLocalStorageService,
    private readonly ngbModal: NgbModal,
    private readonly siteAnalyticsService: SiteAnalyticsService,
    private readonly translateTextService: TranslateTextService,
    private readonly translationLanguageService: TranslationLanguageService,
    private readonly userService: UserService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly wds: WindowDimensionsService,
    private readonly translationValidationService: TranslationValidationService,
    private readonly windowRef: WindowRef,
    private readonly joyride: JoyrideService,
    private readonly urlInterpolationService: UrlInterpolationService
  ) {
    this.translationTutorialImageUrl =
      this.urlInterpolationService.getStaticImageUrl(
        '/contributor_dashboard/translation_tutorial_students.png'
      );
    this.copyToolTourPreviewImageUrl =
      this.urlInterpolationService.getStaticImageUrl(
        '/contributor_dashboard/translation-editor-copy-tool.gif'
      );
  }

  public get expansionTabType(): typeof ExpansionTabType {
    return ExpansionTabType;
  }

  ngOnInit(): void {
    this.activeLanguageCode =
      this.translationLanguageService.getActiveLanguageCode();
    this.subheading = this.opportunity
      ? this.opportunity.subheading
      : this.modifyTranslationOpportunity.subheading;
    this.heading = this.opportunity
      ? this.opportunity.heading
      : this.modifyTranslationOpportunity.heading;
    this.pageContextService.setImageSaveDestinationToLocalStorage();
    this.languageDescription =
      this.translationLanguageService.getActiveLanguageDescription();

    if (this.isTranslationTutorial) {
      this.textToTranslate = 'We love math.';
      this.activeContentType = 'card';
      this.activeWrittenTranslation =
        this.getInitialTranslationTutorialWrittenTranslation();
      this.translationTutorialImageWasCopied =
        this.initialTranslationTutorialStepNumber >= 5;
      this.ckEditorCopyContentService.copyModeActive = false;
      this.activeDataFormat = 'html';
      this.loadingData = false;
      this.activeTranslationTutorialJoyrideStep =
        'contributorDashboardTranslationEditor';
      this.isEditorFocused = false;
    } else if (!this.modifyTranslationOpportunity) {
      // We need to set the context here so that the rte fetches
      // images for the given ENTITY_TYPE and targetId.
      this.pageContextService.setCustomEntityContext(
        AppConstants.ENTITY_TYPE.EXPLORATION,
        this.opportunity.id
      );

      this.translateTextService.init(
        this.opportunity.id,
        this.translationLanguageService.getActiveLanguageCode(),
        () => {
          const translatableItem =
            this.translateTextService.getTextToTranslate();
          this.updateActiveState(translatableItem);
          ({more: this.moreAvailable} = translatableItem);
          this.hasDataFormatListContent =
            this.opportunity.reviewerOnlyContentCount > 0;
          this.loadingData = false;
        }
      );
    } else {
      // Initialize the translation modal with the "modify translation" opportunity
      // in case it was called from the exploration editor page for modifying
      // a particular translation.
      this.textToTranslate = this.modifyTranslationOpportunity.textToTranslate;
      const contentType =
        this.modifyTranslationOpportunity.contentId.split('_')[0];
      this.activeContentType = this.getFormattedContentType(
        contentType,
        this.modifyTranslationOpportunity.interactionId
      );
      this.activeWrittenTranslation =
        this.modifyTranslationOpportunity.currentContentTranslation.translation;
      this.activeDataFormat =
        this.modifyTranslationOpportunity.currentContentTranslation.dataFormat;
      this.loadingData = false;
      this.updateTranslationErrors();
    }

    this.userService
      .getUserContributionRightsDataAsync()
      .then(userContributionRights => {
        if (!userContributionRights) {
          throw new Error('User contribution rights not found.');
        }
        const reviewableLanguageCodes =
          userContributionRights.can_review_translation_for_language_codes;
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
        rte_component_config_id: 'CURATED_LESSON_COMPONENTS',
        language: this.translationLanguageService.getActiveLanguageCode(),
        languageDirection:
          this.translationLanguageService.getActiveLanguageDirection(),
      },
    };

    this.beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      if (
        this.activeWrittenTranslation &&
        this.activeWrittenTranslation.length > 0
      ) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    this.windowRef.nativeWindow.addEventListener(
      'beforeunload',
      this.beforeUnloadHandler
    );
  }

  private getInitialTranslationTutorialWrittenTranslation(): string {
    if (this.initialTranslationTutorialStepNumber < 4) {
      return '';
    }

    if (this.initialTranslationTutorialStepNumber < 5) {
      return TRANSLATION_TUTORIAL_EXPECTED_TRANSLATION;
    }

    return (
      TRANSLATION_TUTORIAL_EXPECTED_TRANSLATION +
      `<p><img src="${this.translationTutorialImageUrl}" ` +
      'alt="Three students smiling around a pizza"></p>'
    );
  }

  ngAfterViewInit(): void {
    this.computePanelOverflowState();
    if (this.isTranslationTutorial) {
      this.translationTutorialModalElement = (
        this.hostElement.nativeElement as HTMLElement
      ).closest('.modal');
      this.translationTutorialModalElement?.addEventListener(
        'scroll',
        this.redrawTranslationTourOnModalScroll
      );
    }
  }

  ngAfterContentChecked(): void {
    this.computeTranslationEditorOverflowState();
  }

  onHtmlEditorReady(): void {
    if (this.isTranslationTutorial) {
      this.tutorialEditorReady.emit();
    }
  }

  onEditorFocused(): void {
    this.isEditorFocused = true;
  }

  isTranslationTutorialAnswerComplete(): boolean {
    if (
      !this.isTranslationTutorial ||
      typeof this.activeWrittenTranslation !== 'string'
    ) {
      return false;
    }

    const parsedTranslation = new DOMParser().parseFromString(
      this.activeWrittenTranslation,
      'text/html'
    );
    const translationText = (
      parsedTranslation.body.textContent || this.activeWrittenTranslation
    )
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.!?]$/, '')
      .toLowerCase();

    return (
      translationText ===
      TRANSLATION_TUTORIAL_EXPECTED_TRANSLATION.toLowerCase()
    );
  }

  isTranslationTutorialNextButtonEnabled(): boolean {
    if (
      this.activeTranslationTutorialJoyrideStep ===
      'contributorDashboardTranslationCopyTool'
    ) {
      return this.translationTutorialImageWasCopied;
    }

    return this.isTranslationTutorialAnswerComplete();
  }

  private getTranslationTutorialStepNumber(stepName: string): number {
    switch (stepName) {
      case 'contributorDashboardTranslationEditor':
        return 3;
      case 'contributorDashboardTranslationCopyTool':
        return 4;
      case 'contributorDashboardTranslationSubmit':
        return 5;
      default:
        return 1;
    }
  }

  private setActiveTranslationTutorialJoyrideStep(stepName: string): void {
    this.activeTranslationTutorialJoyrideStep = stepName;
    this.tutorialProgressChange.emit(
      this.getTranslationTutorialStepNumber(stepName)
    );
  }

  onTranslationTutorialNextButtonClick(event: MouseEvent): void {
    if (!this.isTranslationTutorialNextButtonEnabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (
      !this.activeTranslationTutorialJoyrideStep ||
      this.activeTranslationTutorialJoyrideStep ===
        'contributorDashboardTranslationEditor'
    ) {
      this.setActiveTranslationTutorialJoyrideStep(
        'contributorDashboardTranslationCopyTool'
      );
    } else if (
      this.activeTranslationTutorialJoyrideStep ===
      'contributorDashboardTranslationCopyTool'
    ) {
      this.setActiveTranslationTutorialJoyrideStep(
        'contributorDashboardTranslationSubmit'
      );
    }
  }

  onTranslationTutorialCopyToolToggled(): void {
    if (!this.isTranslationTutorial || !this.isCopyModeActive()) {
      return;
    }

    this.changeDetectorRef.detectChanges();
    setTimeout(() => {
      this.restartTranslationEditorTourAtStep(
        'contributorDashboardTranslationCopyTool'
      );
    });
  }

  onTranslationTutorialImageClick(event: MouseEvent | KeyboardEvent): void {
    if (!this.isTranslationTutorial || !this.isCopyModeActive()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.translationTutorialImageWasClicked = true;
    const modalRef = this.ngbModal.open(
      TranslationTutorialImageCustomizationModalComponent,
      {
        backdrop: 'static',
        windowClass: 'oppia-translation-tutorial-image-customization-modal',
      }
    );
    modalRef.componentInstance.imageUrl = this.translationTutorialImageUrl;
    modalRef.componentInstance.translationCopyToolTourStep =
      this.translationCopyToolTourStep;
    modalRef.componentInstance.translationTourPreviousButton =
      this.translationTourPreviousButton;
    modalRef.componentInstance.translationTourNextButton =
      this.translationTourNextButton;
    modalRef.componentInstance.translationTourDoneButton =
      this.translationTourDoneButton;
    modalRef.componentInstance.translationTourCounter =
      this.translationTourCounter;
    modalRef.result.then(
      result => {
        this.detachTranslationTutorialImageModalScrollListener();
        if (result === 'done') {
          this.completeTranslationTutorialImageCopy();
        }
      },
      () => this.detachTranslationTutorialImageModalScrollListener()
    );

    this.changeDetectorRef.detectChanges();
    setTimeout(() => {
      this.attachTranslationTutorialImageModalScrollListener();
      this.restartTranslationEditorTourAtStep(
        'contributorDashboardTranslationCopyTool'
      );
    });
  }

  private completeTranslationTutorialImageCopy(): void {
    this.translationTutorialImageWasCopied = true;
    this.setActiveTranslationTutorialJoyrideStep(
      'contributorDashboardTranslationCopyTool'
    );
    this.ckEditorCopyContentService.copyModeActive = false;
    document.body.style.cursor = '';

    if (
      typeof this.activeWrittenTranslation === 'string' &&
      !this.activeWrittenTranslation.includes(this.translationTutorialImageUrl)
    ) {
      const imageHtml =
        `<p><img src="${this.translationTutorialImageUrl}" ` +
        'alt="Three students smiling"></p>';
      this.activeWrittenTranslation = `${this.activeWrittenTranslation}${imageHtml}`;
    }

    this.changeDetectorRef.detectChanges();
    setTimeout(() => {
      this.restartTranslationEditorTourAtStep(
        'contributorDashboardTranslationCopyTool'
      );
    });
  }

  private restartTranslationEditorTourAtStep(startWith: string): void {
    this.joyride.closeTour();
    this.joyride
      .startTour({
        steps: this.translationEditorJoyRideSteps,
        startWith,
        stepDefaultPosition: 'right',
        themeColor: '#1354a5',
      })
      .subscribe(step => {
        if (step) {
          this.setActiveTranslationTutorialJoyrideStep(step.name);
        } else {
          this.activeTranslationTutorialJoyrideStep =
            'contributorDashboardTranslationEditor';
        }
        this.redrawActiveTranslationTourStep();
      });
  }

  private attachTranslationTutorialImageModalScrollListener(): void {
    this.detachTranslationTutorialImageModalScrollListener();
    this.translationTutorialImageModalElement =
      document.querySelector<HTMLElement>(
        '.oppia-translation-tutorial-image-customization-modal'
      );
    this.translationTutorialImageModalElement?.addEventListener(
      'scroll',
      this.redrawTranslationTourOnModalScroll
    );
  }

  private detachTranslationTutorialImageModalScrollListener(): void {
    this.translationTutorialImageModalElement?.removeEventListener(
      'scroll',
      this.redrawTranslationTourOnModalScroll
    );
    this.translationTutorialImageModalElement = null;
  }

  private redrawActiveTranslationTourStep(): void {
    this.windowRef.nativeWindow.dispatchEvent(new Event('resize'));
    this.displayTranslationEditorTourAboveModal();
    this.allowInteractionsBehindTranslationTour();
    setTimeout(() => {
      this.windowRef.nativeWindow.dispatchEvent(new Event('resize'));
      this.positionTranslationCopyToolTourPopup();
    });
  }

  private displayTranslationEditorTourAboveModal(): void {
    const backdropContainer = document.querySelector<HTMLElement>(
      '.backdrop-container'
    );
    const editorTourPopups = document.querySelectorAll<HTMLElement>(
      '#joyride-step-contributorDashboardTranslationEditor, ' +
        '#joyride-step-contributorDashboardTranslationCopyTool, ' +
        '#joyride-step-contributorDashboardTranslationSubmit'
    );

    if (backdropContainer) {
      backdropContainer.style.zIndex = '1060';
      backdropContainer.style.opacity = '1';
    }
    document
      .querySelectorAll<HTMLElement>('.joyride-backdrop')
      .forEach(backdropElement => {
        backdropElement.style.backgroundColor =
          TRANSLATION_TUTORIAL_BACKDROP_COLOR;
      });
    editorTourPopups.forEach(editorTourPopup => {
      editorTourPopup.style.zIndex = '1061';
    });
    this.positionTranslationCopyToolTourPopup();
    setTimeout(() => {
      this.positionTranslationCopyToolTourPopup();
    });
  }

  private allowInteractionsBehindTranslationTour(): void {
    document
      .querySelectorAll<HTMLElement>(
        '.backdrop-container, .backdrop-container *'
      )
      .forEach(element => {
        element.style.pointerEvents = 'none';
      });
  }

  private positionTranslationCopyToolTourPopup(): void {
    if (!this.isTranslationTutorial) {
      return;
    }

    const copyToolTourPopup = document.querySelector<HTMLElement>(
      '#joyride-step-contributorDashboardTranslationCopyTool'
    );

    if (!copyToolTourPopup) {
      return;
    }

    const isImageCustomizationStep =
      this.translationTutorialImageWasClicked &&
      !this.translationTutorialImageWasCopied;

    copyToolTourPopup.style.position = 'fixed';
    copyToolTourPopup.style.left = 'auto';
    copyToolTourPopup.style.right = '0px';
    copyToolTourPopup.style.top = isImageCustomizationStep ? '150px' : 'auto';
    copyToolTourPopup.style.bottom = isImageCustomizationStep ? 'auto' : '16px';
    copyToolTourPopup.style.width = isImageCustomizationStep ? '400px' : 'auto';
    copyToolTourPopup.style.maxWidth = isImageCustomizationStep
      ? '400px'
      : 'none';
    copyToolTourPopup.style.transform = 'none';
    copyToolTourPopup.style.zIndex = '1061';

    const copyToolTourArrow = copyToolTourPopup.querySelector<HTMLElement>(
      '.joyride-step__arrow'
    );
    if (copyToolTourArrow) {
      copyToolTourArrow.style.display = 'none';
    }

    this.hideTranslationCopyToolBackdropTarget();
  }

  private hideTranslationCopyToolBackdropTarget(): void {
    if (
      !this.translationTutorialImageWasClicked ||
      !this.translationTutorialImageWasCopied
    ) {
      return;
    }

    const backdropContainer = document.querySelector<HTMLElement>(
      '#backdrop-contributorDashboardTranslationCopyTool'
    );

    const backdropTarget =
      backdropContainer?.querySelector<HTMLElement>('.backdrop-target');

    if (!backdropTarget) {
      return;
    }

    backdropTarget.style.backgroundColor = TRANSLATION_TUTORIAL_BACKDROP_COLOR;
  }

  computeTranslationEditorOverflowState(): void {
    const windowHeight = this.wds.getHeight();
    const heightLimit = (windowHeight * this.cutoff_height) / 100;

    this.isTranslationOverflowing =
      this.translationContainer?.nativeElement.offsetHeight >= heightLimit;
  }

  computePanelOverflowState(): void {
    // The delay of 500ms is required to allow the content to load
    // before the overflow status is calculated. Values less than
    // 500ms also work but they sometimes lead to unexpected results.
    setTimeout(() => {
      this.isContentOverflowing =
        this.contentPanel?.elementRef.nativeElement.offsetHeight >
        this.contentContainer?.nativeElement.offsetHeight;
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

  private checkForUnsavedChanges(action: () => void): void {
    if (
      this.activeWrittenTranslation &&
      this.activeWrittenTranslation.length > 0
    ) {
      const modalRef = this.ngbModal.open(
        ConfirmTranslationExitModalComponent,
        {
          backdrop: 'static',
        }
      );

      modalRef.result.then(
        () => {
          // If user confirms, execute the passed action.
          action();
        },
        () => {
          // If user cancels or closes, no action is needed.
        }
      );
    } else {
      // No unsaved changes, directly execute the action.
      action();
    }
  }

  close(): void {
    this.checkForUnsavedChanges(() => {
      this.activeModal.close();
      // Reset copyMode to the default value and avoid console errors.
      this.ckEditorCopyContentService.copyModeActive = false;
    });
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
    ({
      text: this.textToTranslate = '',
      more: this.moreAvailable,
      status: this.activeStatus,
      translation: this.activeWrittenTranslation,
    } = translatableItem);
    this.activeDataFormat = translatableItem.dataFormat || '';
    const {contentType, ruleType, interactionId} = translatableItem;
    this.activeContentType = this.getFormattedContentType(
      contentType,
      interactionId
    );
    this.activeRuleDescription = this.getRuleDescription(
      ruleType,
      interactionId
    );
    this.updateTranslationErrors();
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
      return (this.hadCopyParagraphError = true);
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
    const paragraphChildrenElements: Element[] =
      target.localName === 'p' ? Array.from(target.children) : [];
    const mathElementsIncluded = paragraphChildrenElements.some(
      child => child.localName === 'oppia-noninteractive-math'
    );
    return target.localName === 'p' && !mathElementsIncluded;
  }

  isCopyModeActive(): boolean {
    return this.ckEditorCopyContentService.copyModeActive;
  }

  updateHtml($event: string | string[]): void {
    if ($event !== this.activeWrittenTranslation) {
      this.activeWrittenTranslation = $event;
      this.changeDetectorRef.detectChanges();
      this.updateTranslationErrors();
    }
  }

  hasPreviousTranslations(): boolean {
    return this.translateTextService.getActiveIndex() > 0;
  }

  skipActiveTranslation(): void {
    this.checkForUnsavedChanges(() => {
      this.clearTranslation();
      const translatableItem = this.translateTextService.getTextToTranslate();
      this.updateActiveState(translatableItem);
      ({more: this.moreAvailable} = translatableItem);
      this.resetEditor();
    });
  }

  isSubmitted(): boolean {
    return this.activeStatus === 'submitted';
  }

  returnToPreviousTranslation(): void {
    this.checkForUnsavedChanges(() => {
      this.clearTranslation();
      const translatableItem =
        this.translateTextService.getPreviousTextToTranslate();
      this.updateActiveState(translatableItem);
      this.moreAvailable = true;
      this.resetEditor();
    });
  }

  isSetOfStringDataFormat(): boolean {
    return (
      this.activeDataFormat ===
        TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING ||
      this.activeDataFormat === TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING
    );
  }

  getFormattedContentType(
    contentType?: string,
    interactionId?: string | null
  ): string {
    if (!contentType) {
      return '';
    }
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

  getRuleDescription(
    ruleType?: string | null,
    interactionId?: string | null
  ): string {
    if (!ruleType || !interactionId) {
      return '';
    }
    // To match, e.g. "{{x|TranslatableSetOfNormalizedString}},".
    const descriptionPattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
    const ruleDescription =
      INTERACTION_SPECS[interactionId].rule_descriptions[ruleType];
    return (
      'Answer ' +
      ruleDescription.replace(descriptionPattern, 'the following choices:')
    );
  }

  canTranslatedTextBeSubmitted(): boolean {
    if (!this.isSetOfStringDataFormat()) {
      this.updateTranslationErrors();

      if (
        this.hasSubmitValidationErrors() ||
        this.uploadingTranslation ||
        this.loadingData
      ) {
        return false;
      }

      if (this.hadCopyParagraphError) {
        this.hadCopyParagraphError = false;
      }
    }
    return true;
  }

  hasSubmitValidationErrors(): boolean {
    return this.hasImgTextError || this.hasIncompleteTranslationError;
  }

  suggestTranslatedText(): void {
    if (this.isTranslationTutorial) {
      this.joyride.closeTour();
      this.pageContextService.resetImageSaveDestination();
      this.activeModal.close('translationTutorialComplete');
      this.ckEditorCopyContentService.copyModeActive = false;
      return;
    }

    if (!this.canTranslatedTextBeSubmitted()) {
      return;
    }

    if (!this.uploadingTranslation && !this.loadingData) {
      this.siteAnalyticsService.registerContributorDashboardSubmitSuggestionEvent(
        'Translation'
      );
      this.uploadingTranslation = true;
      const imagesData = this.imageLocalStorageService.getStoredImagesData();
      this.imageLocalStorageService.flushStoredImagesData();
      this.translateTextService.suggestTranslatedText(
        this.activeWrittenTranslation,
        this.translationLanguageService.getActiveLanguageCode(),
        imagesData,
        this.activeDataFormat,
        () => {
          this.alertsService.addSuccessMessage(
            'Submitted translation for review.'
          );
          this.clearTranslation();
          this.uploadingTranslation = false;

          if (this.moreAvailable) {
            this.skipActiveTranslation();
            this.resetEditor();
          } else {
            this.closeWithoutUnsavedCheck();
          }
        },
        (errorReason: string) => {
          this.uploadingTranslation = false;
          this.pageContextService.resetImageSaveDestination();
          this.alertsService.clearWarnings();
          this.alertsService.addWarning(errorReason);
          this.closeWithoutUnsavedCheck();
        }
      );
    }
    if (!this.moreAvailable) {
      this.pageContextService.resetImageSaveDestination();
      this.closeWithoutUnsavedCheck();
    }
  }

  private clearTranslation(): void {
    this.activeWrittenTranslation = '';
    this.updateTranslationErrors();
  }

  private updateTranslationErrors(): void {
    if (
      this.isSetOfStringDataFormat() ||
      typeof this.textToTranslate !== 'string' ||
      typeof this.activeWrittenTranslation !== 'string' ||
      this.activeWrittenTranslation.length === 0
    ) {
      this.hasImgTextError = false;
      this.hasIncompleteTranslationError = false;
      return;
    }

    const translationError =
      this.translationValidationService.validateTranslationFromHtmlStrings(
        this.textToTranslate,
        this.activeWrittenTranslation
      );

    this.hasImgTextError =
      translationError.hasDuplicateAltTexts ||
      translationError.hasDuplicateDescriptions;
    this.hasIncompleteTranslationError =
      translationError.hasUntranslatedElements;
  }

  private closeWithoutUnsavedCheck(): void {
    this.activeModal.close();
    this.ckEditorCopyContentService.copyModeActive = false;
  }

  updateTranslatedText(): void {
    if (!this.canTranslatedTextBeSubmitted()) {
      return;
    }
    this.activeModal.close(this.activeWrittenTranslation);
  }

  ngOnDestroy(): void {
    this.translationTutorialModalElement?.removeEventListener(
      'scroll',
      this.redrawTranslationTourOnModalScroll
    );
    this.detachTranslationTutorialImageModalScrollListener();
    this.windowRef.nativeWindow.removeEventListener(
      'beforeunload',
      this.beforeUnloadHandler
    );
  }
}
