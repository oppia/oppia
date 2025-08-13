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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
// This throws "Object is possibly undefined." The type undefined
// comes here from ngx joyride dependency. We need to suppress this
// error because of strict type checking. This error is thrown because
// the type of the variable is undefined. This is because the type of
// the variable is undefined. This is because the type of the variable
// is undefined. This is because the type of the variable is undefined.
// @ts-ignore
import {JoyrideService} from 'ngx-joyride';
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
    private joyride: JoyrideService,
    private voiceoverBackendApiService: VoiceoverBackendApiService,
    private voiceoverLanguageManagementService: VoiceoverLanguageManagementService,
    private entityVoiceoversService: EntityVoiceoversService,
    private voiceoverPlayerService: VoiceoverPlayerService,
    private translationLanguageService: TranslationLanguageService
  ) {}

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
    this.editabilityService.onEndTutorial();
    this.stateTutorialFirstTimeService.markTranslationTutorialFinished();
    this.tutorialInProgress = false;
  }

  startTutorial(): void {
    if (this.permissions === null) {
      return;
    }
    if (this.permissions.canVoiceover) {
      this.tutorialInProgress = true;
      this.joyride
        .startTour({
          steps: [
            'translationTabTourContainer',
            'translationTabOverview',
            'translationTabStatusGraph',
            'translationTabCardOptions',
            'translationTabRecordingOverview',
            'translationTabReRecordingOverview',
            'translationTabTutorialComplete',
          ],
          stepDefaultPosition: 'bottom',
          themeColor: '#212f23',
        })
        .subscribe(
          () => {
            let element = document.querySelector<HTMLElement>(
              '.joyride-step__holder'
            ) as HTMLElement;
            // This code make the joyride visible over navbar
            // by overriding the properties of joyride-step__holder class.
            element.style.zIndex = '1020';
          },
          () => {},
          () => {
            this.leaveTutorial();
          }
        );
    }
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
