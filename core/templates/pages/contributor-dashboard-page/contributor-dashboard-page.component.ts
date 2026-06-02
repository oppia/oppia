// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the contributor dashboard page.
 */

import {AppConstants} from 'app.constants';
import {Component, Injector, OnInit} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {
  ContributorDashboardConstants,
  ContributorDashboardTabsDetails,
} from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';
import {ContributionAndReviewService} from './services/contribution-and-review.service';
import {ContributionOpportunitiesService} from './services/contribution-opportunities.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {LocalStorageService} from 'services/local-storage.service';
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {TranslationTopicService} from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import {UserService} from 'services/user.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {JoyrideService} from 'ngx-joyride';
import {TranslationOnboardingModalComponent} from './modal-templates/translation-onboarding-modal.component';
import {TranslationOnboardingSkipConfirmationModalComponent} from './modal-templates/translation-onboarding-skip-confirmation-modal.component';
import {ExplorationOpportunity} from './opportunities-list-item/opportunities-list-item.component';
import {
  TranslationModalComponent,
  TranslationOpportunity,
} from './modal-templates/translation-modal.component';
import {TranslationTutorialCompletionModalComponent} from './modal-templates/translation-tutorial-completion-modal.component';

const TRANSLATION_TUTORIAL_BACKDROP_COLOR = 'rgba(0, 0, 0, 0.55)';

@Component({
  selector: 'contributor-dashboard-page',
  templateUrl: './contributor-dashboard-page.component.html',
})
export class ContributorDashboardPageComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  defaultHeaderVisible!: boolean;
  profilePicturePngDataUrl!: string;
  profilePictureWebpDataUrl!: string;
  userInfoIsLoading!: boolean;
  userIsLoggedIn!: boolean;
  userIsReviewer!: boolean;
  userCanReviewTranslationSuggestionsInLanguages!: string[];
  userCanReviewVoiceoverSuggestionsInLanguages!: string[];
  userCanReviewQuestions!: boolean;
  tabsDetails!: ContributorDashboardTabsDetails;
  OPPIA_AVATAR_IMAGE_URL!: string;
  confettiDesktopUrl!: string;
  confettiMobileUrl!: string;
  languageCode!: string;
  topicName!: string;
  activeTabName!: string;
  showTranslationTutorialOpportunity: boolean = false;
  translationTutorialProgressPercentage: number = 0;
  showTranslationTutorialReplaySectionTour: boolean = false;
  showCompletionConfetti: boolean = false;
  currentTourStep: string = '';
  TRANSLATION_TUTORIAL_OPPORTUNITY_TYPE: string =
    AppConstants.OPPORTUNITY_TYPE_TRANSLATION;
  TRANSLATION_TUTORIAL_LANGUAGE_CODE: string = 'es';
  TRANSLATION_TUTORIAL_OPPORTUNITY: ExplorationOpportunity = {
    id: 'translation-tutorial',
    labelText: '',
    labelColor: '',
    progressPercentage: 0.01,
    subheading: 'Translation Tutorial',
    heading: "Let's translate your first lesson card",
    actionButtonTitle: 'Translate',
    inReviewCount: 0,
    totalCount: 1,
    translationsCount: 0,
    topicName: '',
  };
  TRANSLATION_TUTORIAL_MODAL_OPPORTUNITY: TranslationOpportunity = {
    id: 'translation-tutorial',
    subheading: 'Translation Tutorial',
    heading: "Let's translate your first lesson card",
    progressPercentage: '0',
    actionButtonTitle: 'Translate',
    inReviewCount: 0,
    totalCount: 1,
    translationsCount: 0,
    reviewerOnlyContentCount: 0,
  };
  TRANSLATION_TOUR_TOTAL_STEPS: number = 5;
  TRANSLATION_TUTORIAL_PROGRESS_TOTAL_COUNT: number = 100;
  joyRideSteps: string[] = [
    'contributorDashboardTranslationSelectors',
    'contributorDashboardTranslationOpportunity',
  ];
  translationEditorJoyRideSteps: string[] = [
    'contributorDashboardTranslationOpportunity',
    'contributorDashboardTranslationEditor',
    'contributorDashboardTranslationCopyTool',
    'contributorDashboardTranslationSubmit',
  ];
  // The following property is set to null when the
  // user is not logged in.
  username: string | null = null;

  constructor(
    private contributionAndReviewService: ContributionAndReviewService,
    private contributionOpportunitiesService: ContributionOpportunitiesService,
    private focusManagerService: FocusManagerService,
    private languageUtilService: LanguageUtilService,
    private localStorageService: LocalStorageService,
    private injector: Injector,
    private ngbModal: NgbModal,
    private joyride: JoyrideService,
    private translationLanguageService: TranslationLanguageService,
    private translationTopicService: TranslationTopicService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService
  ) {}

  onTabClick(activeTabName: string): void {
    this.activeTabName = activeTabName;

    // The setTimeout is required to ensure that focus is applied only
    // after all the functions in main thread have executed.
    if (this.activeTabName === 'translateTextTab') {
      setTimeout(() => {
        this.focusManagerService.setFocusWithoutScroll('selectLangDropDown');
      }, 5);
    }
  }

  provideLanguageForProtractorClass(languageDescription: string): string {
    const lang = languageDescription.split(' ').join('-').toLowerCase();
    return lang.replace(/\(?\)?/g, '');
  }

  onChangeLanguage(languageCode: string): void {
    this.languageCode = languageCode;
    this.translationLanguageService.setActiveLanguageCode(this.languageCode);
    this.localStorageService.updateLastSelectedTranslationLanguageCode(
      this.languageCode
    );
  }

  showLanguageSelector(): boolean {
    const activeTabDetail =
      this.tabsDetails[
        this.activeTabName as keyof ContributorDashboardTabsDetails
      ];
    return activeTabDetail.customizationOptions.includes('language');
  }

  onChangeTopic(topicName: string): void {
    this.topicName = topicName;
    this.translationTopicService.setActiveTopicName(this.topicName);
    this.localStorageService.updateLastSelectedTranslationTopicName(
      this.topicName
    );
  }

  showTopicSelector(): boolean {
    const activeTabDetail =
      this.tabsDetails[
        this.activeTabName as keyof ContributorDashboardTabsDetails
      ];
    const activeSuggestionType =
      this.contributionAndReviewService.getActiveSuggestionType();
    const activeTabType = this.contributionAndReviewService.getActiveTabType();

    const userIsReviewingQuestionSuggestions =
      activeTabType === 'reviews' &&
      activeSuggestionType === 'add_question' &&
      this.activeTabName !== 'submitQuestionTab';
    const userIsReviewingTranslationSuggestions =
      activeTabType === 'reviews' &&
      activeSuggestionType === 'translate_content' &&
      this.activeTabName !== 'submitQuestionTab';

    return (
      activeTabDetail.customizationOptions.includes('topic') ||
      userIsReviewingQuestionSuggestions ||
      userIsReviewingTranslationSuggestions
    );
  }

  getLanguageDescriptions(languageCodes: string[]): string[] {
    const languageDescriptions: string[] = [];
    languageCodes.forEach(languageCode => {
      languageDescriptions.push(
        this.languageUtilService.getAudioLanguageDescription(languageCode)
      );
    });
    return languageDescriptions;
  }

  private prepareTranslationTutorial(
    shouldResetProgress: boolean = true
  ): void {
    this.showTranslationTutorialOpportunity = true;
    if (shouldResetProgress) {
      this.updateTranslationTutorialProgress(0);
    }
    this.languageCode = this.TRANSLATION_TUTORIAL_LANGUAGE_CODE;
    this.translationLanguageService.setActiveLanguageCode(this.languageCode);
    this.onTabClick('translateTextTab');
  }

  private updateTranslationTutorialProgressForStep(stepNumber: number): void {
    const progressPercentage =
      ((stepNumber - 1) / (this.TRANSLATION_TOUR_TOTAL_STEPS - 1)) * 100;
    this.updateTranslationTutorialProgress(progressPercentage);
  }

  private updateTranslationTutorialProgress(
    progressPercentage: number,
    shouldSaveProgress: boolean = true
  ): void {
    const boundedProgressPercentage = Math.min(
      100,
      Math.max(0, progressPercentage)
    );
    const visibleProgressPercentage =
      boundedProgressPercentage === 0 ? 0.01 : boundedProgressPercentage;

    this.translationTutorialProgressPercentage = boundedProgressPercentage;
    this.TRANSLATION_TUTORIAL_OPPORTUNITY.progressPercentage =
      visibleProgressPercentage;
    this.TRANSLATION_TUTORIAL_OPPORTUNITY.totalCount =
      this.TRANSLATION_TUTORIAL_PROGRESS_TOTAL_COUNT;
    this.TRANSLATION_TUTORIAL_OPPORTUNITY.translationsCount =
      boundedProgressPercentage;
    this.TRANSLATION_TUTORIAL_OPPORTUNITY.inReviewCount = 0;
    this.TRANSLATION_TUTORIAL_MODAL_OPPORTUNITY.progressPercentage = `${Math.floor(boundedProgressPercentage)}`;

    if (shouldSaveProgress && this.username) {
      this.localStorageService.saveContributorDashboardTranslationTutorialProgress(
        this.username,
        boundedProgressPercentage
      );
    }
  }

  private loadSavedTranslationTutorialProgress(username: string): void {
    this.updateTranslationTutorialProgress(
      this.localStorageService.getContributorDashboardTranslationTutorialProgress(
        username
      ),
      false
    );
  }

  showTranslationOnboardingModalIfNeeded(username: string): void {
    if (
      this.localStorageService.hasSeenContributorDashboardTranslationOnboarding(
        username
      )
    ) {
      return;
    }

    this.prepareTranslationTutorial();
    this.showTranslationOnboardingModal(username);
  }

  async loadTranslationTutorialOpportunityAsync(): Promise<{
    opportunitiesDicts: ExplorationOpportunity[];
    more: boolean;
  }> {
    return {
      opportunitiesDicts: [this.TRANSLATION_TUTORIAL_OPPORTUNITY],
      more: false,
    };
  }

  showTranslationOnboardingModal(username: string): void {
    this.ngbModal
      .open(TranslationOnboardingModalComponent, {
        backdrop: 'static',
        centered: true,
        keyboard: false,
        windowClass: 'oppia-translation-onboarding-modal-window',
      })
      .result.then(
        () => {
          this.localStorageService.markContributorDashboardTranslationOnboardingAsSeen(
            username
          );
          this.startTranslationTour();
        },
        reason => {
          if (reason === 'skip') {
            this.showTranslationOnboardingSkipConfirmationModal(username);
          }
        }
      );
  }

  private getTranslationTourStepName(stepNumber: number): string {
    return this.joyRideSteps[stepNumber - 1];
  }

  private getTranslationEditorTourStepName(stepNumber: number): string {
    return this.translationEditorJoyRideSteps[stepNumber - 2];
  }

  private getTranslationTutorialStepNumberForCurrentProgress(): number {
    return Math.min(
      this.TRANSLATION_TOUR_TOTAL_STEPS,
      Math.max(
        1,
        Math.round(
          (this.translationTutorialProgressPercentage / 100) *
            (this.TRANSLATION_TOUR_TOTAL_STEPS - 1)
        ) + 1
      )
    );
  }

  startTranslationTour(startWith?: string): void {
    const tourOptions: {
      steps: string[];
      startWith?: string;
      stepDefaultPosition: string;
      themeColor: string;
    } = {
      steps: this.joyRideSteps,
      stepDefaultPosition: 'bottom',
      themeColor: '#1354a5',
    };
    if (startWith) {
      tourOptions.startWith = startWith;
    }

    this.joyride.startTour(tourOptions).subscribe(
      step => {
        if (step?.number) {
          this.updateTranslationTutorialProgressForStep(step.number);
        }
        this.setTranslationTutorialBackdropColor();
        this.allowInteractionsBehindTranslationTour();
      },
      () => {},
      () => {
        this.closeTranslationTour();
      }
    );
  }

  replayTranslationTour(): void {
    const tutorialStepNumber =
      this.getTranslationTutorialStepNumberForCurrentProgress();

    if (
      this.translationTutorialProgressPercentage > 0 &&
      this.translationTutorialProgressPercentage < 100
    ) {
      this.prepareTranslationTutorial(false);
      setTimeout(() => {
        if (tutorialStepNumber <= 2) {
          this.startTranslationTour(
            this.getTranslationTourStepName(tutorialStepNumber)
          );
          return;
        }

        this.openTranslationTutorial(
          this.getTranslationEditorTourStepName(tutorialStepNumber),
          tutorialStepNumber
        );
      });
      return;
    }

    this.prepareTranslationTutorial();
    setTimeout(() => {
      this.startTranslationTour();
    });
  }

  openTranslationTutorial(
    startWith: string = 'contributorDashboardTranslationEditor',
    tutorialStepNumber: number = 3
  ): void {
    this.closeTranslationTour();
    const modalRef = this.ngbModal.open(TranslationModalComponent, {
      size: 'lg',
      backdrop: 'static',
      injector: this.injector,
      backdropClass: 'forced-modal-stack',
      windowClass: 'forced-modal-stack',
    });
    modalRef.componentInstance.opportunity =
      this.TRANSLATION_TUTORIAL_MODAL_OPPORTUNITY;
    modalRef.componentInstance.isTranslationTutorial = true;
    modalRef.componentInstance.initialTranslationTutorialStepNumber =
      tutorialStepNumber;
    modalRef.componentInstance.tutorialEditorReady.subscribe(() => {
      this.startTranslationEditorTour(startWith);
    });
    modalRef.componentInstance.tutorialProgressChange.subscribe(
      (stepNumber: number) => {
        this.updateTranslationTutorialProgressForStep(stepNumber);
      }
    );
    modalRef.result.then(
      result => {
        if (result === 'translationTutorialComplete') {
          this.updateTranslationTutorialProgress(100);
          this.showTranslationTutorialCompletionModal();
        }
      },
      () => {}
    );
  }

  showTranslationTutorialCompletionModal(): void {
    this.closeTranslationTour();
    this.showCompletionConfetti = true;
    const modalRef = this.ngbModal.open(
      TranslationTutorialCompletionModalComponent,
      {
        backdrop: 'static',
        centered: true,
        keyboard: false,
        windowClass: 'oppia-translation-tutorial-completion-modal-window',
      }
    );
    modalRef.result.then(
      () => {
        this.showCompletionConfetti = false;
        this.showTranslationTutorialReplaySectionTour = true;
        this.onTabClick('myContributionTab');
      },
      () => {
        this.showCompletionConfetti = false;
      }
    );
  }

  startTranslationEditorTour(
    startWith: string = 'contributorDashboardTranslationEditor'
  ): void {
    this.joyride
      .startTour({
        steps: this.translationEditorJoyRideSteps,
        startWith,
        stepDefaultPosition: 'right',
        themeColor: '#1354a5',
      })
      .subscribe(
        step => {
          if (step?.number) {
            this.updateTranslationTutorialProgressForStep(step.number + 1);
          }
          this.displayTranslationEditorTourAboveModal();
          this.allowInteractionsBehindTranslationTour();
        },
        () => {},
        () => {
          this.closeTranslationTour();
        }
      );
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
    }
    this.setTranslationTutorialBackdropColor();
    editorTourPopups.forEach(editorTourPopup => {
      editorTourPopup.style.zIndex = '1061';
    });
  }

  private setTranslationTutorialBackdropColor(): void {
    document
      .querySelectorAll<HTMLElement>('.joyride-backdrop')
      .forEach(backdropElement => {
        backdropElement.style.backgroundColor =
          TRANSLATION_TUTORIAL_BACKDROP_COLOR;
      });
  }

  closeTranslationTour(): void {
    this.joyride.closeTour();
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

  showTranslationOnboardingSkipConfirmationModal(username: string): void {
    this.ngbModal
      .open(TranslationOnboardingSkipConfirmationModalComponent, {
        backdrop: 'static',
        centered: true,
        keyboard: false,
        windowClass: 'oppia-translation-skip-confirmation-modal-window',
      })
      .result.then(
        dontShowAgain => {
          if (dontShowAgain) {
            this.localStorageService.markContributorDashboardTranslationOnboardingAsSeen(
              username
            );
          }
        },
        () => {
          this.showTranslationOnboardingModal(username);
        }
      );
  }

  ngOnInit(): void {
    this.username = '';
    this.userInfoIsLoading = true;
    this.userIsLoggedIn = false;
    this.userIsReviewer = false;
    this.userCanReviewTranslationSuggestionsInLanguages = [];
    this.userCanReviewVoiceoverSuggestionsInLanguages = [];
    this.userCanReviewQuestions = false;
    this.defaultHeaderVisible = true;

    const prevSelectedTopicName =
      this.localStorageService.getLastSelectedTranslationTopicName();

    this.userService
      .getUserContributionRightsDataAsync()
      .then(userContributionRights => {
        if (userContributionRights === null) {
          throw new Error('User contribution rights not found.');
        }
        this.userCanReviewTranslationSuggestionsInLanguages =
          this.getLanguageDescriptions(
            userContributionRights.can_review_translation_for_language_codes
          );

        this.userCanReviewVoiceoverSuggestionsInLanguages =
          this.getLanguageDescriptions(
            userContributionRights.can_review_voiceover_for_language_codes
          );

        this.userCanReviewQuestions =
          userContributionRights.can_review_questions;

        this.userIsReviewer =
          this.userCanReviewTranslationSuggestionsInLanguages.length > 0 ||
          this.userCanReviewVoiceoverSuggestionsInLanguages.length > 0 ||
          this.userCanReviewQuestions;

        this.tabsDetails.submitQuestionTab.enabled =
          userContributionRights.can_suggest_questions;
      });

    this.userService.getUserInfoAsync().then(userInfo => {
      this.userInfoIsLoading = false;
      this.profilePictureWebpDataUrl =
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH
        );
      this.profilePicturePngDataUrl =
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH
        );
      if (userInfo.isLoggedIn()) {
        this.userIsLoggedIn = true;
        this.username = userInfo.getUsername();
        if (this.username !== null) {
          [this.profilePicturePngDataUrl, this.profilePictureWebpDataUrl] =
            this.userService.getProfileImageDataUrl(this.username);
          this.loadSavedTranslationTutorialProgress(this.username);
          this.showTranslationOnboardingModalIfNeeded(this.username);
        }
      } else {
        this.userIsLoggedIn = false;
        this.username = '';
      }
    });

    this.contributionOpportunitiesService
      .getTranslatableTopicNamesAsync()
      .then(topicNames => {
        // TODO(#15710): Set default active topic to 'All'.
        if (topicNames.length <= 0) {
          this.translationTopicService.setActiveTopicName(
            ContributorDashboardConstants.DEFAULT_OPPORTUNITY_TOPIC_NAME
          );
          return;
        }
        this.topicName = topicNames[0];
        if (
          prevSelectedTopicName &&
          topicNames.indexOf(prevSelectedTopicName) !== -1
        ) {
          this.topicName = prevSelectedTopicName;
        }
        this.translationTopicService.setActiveTopicName(this.topicName);
      });

    this.activeTabName = 'myContributionTab';

    this.tabsDetails = {
      ...ContributorDashboardConstants.CONTRIBUTOR_DASHBOARD_TABS_DETAILS,
      // TODO(#13015): Remove use of unknown as a type.
    } as unknown as ContributorDashboardTabsDetails;
    this.OPPIA_AVATAR_IMAGE_URL =
      this.urlInterpolationService.getStaticCopyrightedImageUrl(
        '/avatar/oppia_avatar_100px.svg'
      );
    this.confettiDesktopUrl = this.urlInterpolationService.getStaticImageUrl(
      '/contributor_dashboard/confetti_desktop.gif'
    );
    this.confettiMobileUrl = this.urlInterpolationService.getStaticImageUrl(
      '/contributor_dashboard/confetti_mobile.gif'
    );
    this.languageCode = this.translationLanguageService.getActiveLanguageCode();
  }
}
