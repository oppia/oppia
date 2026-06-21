// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the translation tab.
 */

import {ApplicationRef, Component, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ShepherdService} from 'angular-shepherd';
import {Subscription} from 'rxjs';
import {WelcomeTranslationModalComponent} from 'pages/exploration-editor-page/translation-tab/modal-templates/welcome-translation-modal.component';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {PageContextService} from 'services/page-context.service';
import {EditabilityService} from 'services/editability.service';
import {LoaderService} from 'services/loader.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {ExplorationStatesService} from '../services/exploration-states.service';
import {RouterService} from '../services/router.service';
import {StateTutorialFirstTimeService} from '../services/state-tutorial-first-time.service';
import {UserExplorationPermissionsService} from '../services/user-exploration-permissions.service';
import {TranslationTabActiveModeService} from './services/translation-tab-active-mode.service';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {VoiceoverLanguageManagementService} from 'services/voiceover-language-management-service';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {VoiceoverPlayerService} from 'pages/exploration-player-page/services/voiceover-player.service';
import {TranslationLanguageService} from './services/translation-language.service';

@Component({
  selector: 'oppia-translation-tab',
  templateUrl: './translation-tab.component.html',
})
export class TranslationTabComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();

  _ID_TUTORIAL_TRANSLATION_LANGUAGE: string = '#tutorialTranslationLanguage';

  _ID_TUTORIAL_TRANSLATION_STATE: string = '#tutorialTranslationState';

  _ID_TUTORIAL_TRANSLATION_OVERVIEW: string = '#tutorialTranslationOverview';

  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  isTranslationTabBusy!: boolean;
  tutorialInProgress!: boolean;
  showTranslationTabSubDirectives!: boolean;
  permissions!: {
    canVoiceover: boolean;
  };
  languageAccentsAreLoading: boolean = false;

  constructor(
    private pageContextService: PageContextService,
    private editabilityService: EditabilityService,
    private explorationStatesService: ExplorationStatesService,
    private loaderService: LoaderService,
    private ngbModal: NgbModal,
    private routerService: RouterService,
    private siteAnalyticsService: SiteAnalyticsService,
    private stateEditorService: StateEditorService,
    private stateTutorialFirstTimeService: StateTutorialFirstTimeService,
    private translationTabActiveModeService: TranslationTabActiveModeService,
    private userExplorationPermissionsService: UserExplorationPermissionsService,
    private shepherdService: ShepherdService,
    private voiceoverBackendApiService: VoiceoverBackendApiService,
    private voiceoverLanguageManagementService: VoiceoverLanguageManagementService,
    private entityVoiceoversService: EntityVoiceoversService,
    private voiceoverPlayerService: VoiceoverPlayerService,
    private translationLanguageService: TranslationLanguageService,
    private applicationRef: ApplicationRef
  ) {}

  // Adding the smoothScrollTo helper function for the translation tab.
  private smoothScrollTo(targetY: number, duration: number): void {
    const startY = window.scrollY;
    const difference = targetY - startY;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      if (elapsedTime < duration) {
        const progress = elapsedTime / duration;
        const easeProgress =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        window.scrollTo(0, startY + difference * easeProgress);
        requestAnimationFrame(step);
      } else {
        window.scrollTo(0, targetY);
      }
    };
    requestAnimationFrame(step);
  }

  initTranslationTab(): void {
    this.stateTutorialFirstTimeService.initTranslation(
      this.pageContextService.getExplorationId()
    );
    this.showTranslationTabSubDirectives = true;
    this.translationTabActiveModeService.activateVoiceoverMode();
    this.loaderService.hideLoadingScreen();

    if (this.editabilityService.inTutorialMode()) {
      this.startTutorial();
    }
  }

  leaveTutorial(): void {
    this.shepherdService.complete();
    this.handleTourFinish();
  }

  private handleTourFinish(): void {
    this.editabilityService.onEndTutorial();
    this.stateTutorialFirstTimeService.markTranslationTutorialFinished();
    this.tutorialInProgress = false;
  }

  async startTutorial(): Promise<void> {
    if (this.tutorialInProgress) {
      return;
    }
    if (this.permissions === null) {
      this.permissions =
        await this.userExplorationPermissionsService.getPermissionsAsync();
    }
    if (this.tutorialInProgress) {
      return;
    }
    if (this.permissions.canVoiceover) {
      this.tutorialInProgress = true;

      const steps = [
        {
          id: 'translationTabTourContainer',
          attachTo: {element: '#translationTabTourContainer', on: 'bottom'},
          title: 'Translations In Oppia',
          text: [
            'Hello, welcome to the Translation Tab! This tour will walk you ' +
              'through the translation page. Hit the "Next" button to begin.',
          ],
          buttons: [
            {type: 'next', text: 'Next', classes: 'shepherd-button-primary'},
          ],
          when: {
            show: () => {
              this.smoothScrollTo(0, 1000);
            },
          },
        },
        {
          id: 'translationTabOverview',
          attachTo: {element: '#translationTabOverview', on: 'bottom'},
          title: 'Choose Language',
          text: [
            'Start your translation by choosing the language that you want to translate to.',
          ],
          buttons: [
            {type: 'back', text: 'Prev', classes: 'shepherd-button-secondary'},
            {type: 'next', text: 'Next', classes: 'shepherd-button-primary'},
          ],
          when: {
            show: () => {
              this.smoothScrollTo(0, 1000);
            },
          },
        },
        {
          id: 'translationTabStatusGraph',
          attachTo: {element: '#translationTabStatusGraph', on: 'bottom'},
          title: 'Choose a Card to Translate',
          text: [
            'Then, choose a card from the exploration overview by clicking on the card. ' +
              'The selected card will have a bold border. Cards with missing translations ' +
              'are coloured yellow or red. These are good places to start.',
          ],
          buttons: [
            {type: 'back', text: 'Prev', classes: 'shepherd-button-secondary'},
            {type: 'next', text: 'Next', classes: 'shepherd-button-primary'},
          ],
          when: {
            show: () => {
              this.smoothScrollTo(250, 1000);
            },
          },
        },
        {
          id: 'translationTabCardOptions',
          attachTo: {element: '#translationTabCardOptions', on: 'bottom'},
          title: 'Choose a Part of the Card to Translate',
          text: [
            'Next, choose a part of the lesson card to translate. This menu at the top ' +
              'lists all the translatable parts of the card. Within each tab, multiple ' +
              'sections may be available for translating.',
          ],
          buttons: [
            {type: 'back', text: 'Prev', classes: 'shepherd-button-secondary'},
            {type: 'next', text: 'Next', classes: 'shepherd-button-primary'},
          ],
          when: {
            show: () => {
              this.smoothScrollTo(0, 1000);
            },
          },
        },
        {
          id: 'translationTabRecordingOverview',
          attachTo: {element: '#translationTabRecordingOverview', on: 'bottom'},
          title: 'Recording Audio',
          text: [
            'To create audio translations in Oppia, we recommend using the upload button ' +
              'to upload audio files from your computer. You can also record via your browser.',
          ],
          buttons: [
            {type: 'back', text: 'Prev', classes: 'shepherd-button-secondary'},
            {type: 'next', text: 'Next', classes: 'shepherd-button-primary'},
          ],
        },
        {
          id: 'translationTabReRecordingOverview',
          attachTo: {
            element: '#translationTabReRecordingOverview',
            on: 'bottom',
          },
          title: 'Re-record/Re-upload audio',
          text: [
            'The audio recording also has options related to updating and deleting translations.',
          ],
          buttons: [
            {type: 'back', text: 'Prev', classes: 'shepherd-button-secondary'},
            {type: 'next', text: 'Next', classes: 'shepherd-button-primary'},
          ],
        },
        {
          id: 'translationTabTutorialComplete',
          attachTo: {element: '#translationTabTutorialComplete', on: 'bottom'},
          title: 'Tutorial Complete',
          text: [
            'Now, you are ready to begin adding translations to your explorations! ' +
              'This marks the end of this tour. Remember to save your progress periodically ' +
              'using the save button in the navigation bar at the top. ' +
              'Thank you for making this lesson more accessible for non-native speakers!',
          ],
          buttons: [
            {type: 'back', text: 'Prev', classes: 'shepherd-button-secondary'},
            {
              text: 'Done',
              action: () => {
                this.shepherdService.complete();
                this.leaveTutorial();
              },
              classes: 'shepherd-button-primary',
            },
          ],
        },
      ];

      this.addStepCounters(steps);

      this.shepherdService.defaultStepOptions = {
        scrollTo: false,
        cancelIcon: {enabled: true},
      };
      this.shepherdService.modal = true;
      this.shepherdService.addSteps(steps);
      if (this.shepherdService.tourObject) {
        this.shepherdService.tourObject.on('cancel', () => {
          if (this.tutorialInProgress) {
            this.leaveTutorial();
            this.applicationRef.tick();
          }
        });
      }
      this.shepherdService.start();
    }
  }

  private addStepCounters(steps: object[]): void {
    const totalSteps = steps.length;
    steps.forEach((step, index) => {
      const s = step as {
        buttons?: {text: string; classes?: string; action?: () => void}[];
      };
      if (!s.buttons) {
        s.buttons = [];
      }
      s.buttons.unshift({
        text: `${index + 1}/${totalSteps}`,
        classes: 'shepherd-step-counter',
        action: () => {},
      });
    });
  }

  showWelcomeTranslationModal(): void {
    this.ngbModal
      .open(WelcomeTranslationModalComponent, {
        backdrop: true,
        windowClass: 'oppia-welcome-modal',
      })
      .result.then(
        explorationId => {
          this.siteAnalyticsService.registerAcceptTutorialModalEvent(
            explorationId
          );
          this.startTutorial();
        },
        explorationId => {
          this.siteAnalyticsService.registerDeclineTutorialModalEvent(
            explorationId
          );
          this.stateTutorialFirstTimeService.markTranslationTutorialFinished();
        }
      );
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.isTranslationTabBusy = false;
    this.showTranslationTabSubDirectives = false;
    this.tutorialInProgress = false;

    this.directiveSubscriptions.add(
      this.routerService.onRefreshTranslationTab.subscribe(() => {
        this.initTranslationTab();
      })
    );

    this.userExplorationPermissionsService
      .getPermissionsAsync()
      .then(explorationPermissions => {
        this.permissions = explorationPermissions;
      });

    this.directiveSubscriptions.add(
      // eslint-disable-next-line max-len
      this.stateTutorialFirstTimeService.onEnterTranslationForTheFirstTime.subscribe(
        () => this.showWelcomeTranslationModal()
      )
    );

    this.languageAccentsAreLoading = true;
    this.loaderService.showLoadingScreen('Loading');

    this.voiceoverBackendApiService
      .fetchVoiceoverAdminDataAsync()
      .then(response => {
        this.loaderService.hideLoadingScreen();

        this.voiceoverLanguageManagementService.init(
          response.languageAccentMasterList,
          response.autoGeneratableLanguageAccentCodes,
          response.languageCodesMapping
        );

        const languageCode =
          this.translationLanguageService.getActiveLanguageCode();

        this.voiceoverPlayerService.languageAccentMasterList =
          response.languageAccentMasterList;

        this.voiceoverPlayerService.setLanguageAccentCodesDescriptions(
          languageCode,
          this.entityVoiceoversService.getLanguageAccentCodes()
        );
        this.languageAccentsAreLoading = false;
      });
  }
  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
