// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for showing Editor Navigation
 * in editor.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Subscription} from 'rxjs';
import {HelpModalComponent} from 'pages/exploration-editor-page/modal-templates/help-modal.component';
import {ContextService} from 'services/context.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {EditabilityService} from 'services/editability.service';
import {ExplorationImprovementsService} from 'services/exploration-improvements.service';
import {InternetConnectivityService} from 'services/internet-connectivity.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UserService} from 'services/user.service';
import {ThreadDataBackendApiService} from '../feedback-tab/services/thread-data-backend-api.service';
import {ChangeListService} from '../services/change-list.service';
import {ExplorationRightsService} from '../services/exploration-rights.service';
import {ExplorationSaveService} from '../services/exploration-save.service';
import {ExplorationWarningsService} from '../services/exploration-warnings.service';
import {RouterService} from '../services/router.service';
import {StateTutorialFirstTimeService} from '../services/state-tutorial-first-time.service';
import {UserExplorationPermissionsService} from '../services/user-exploration-permissions.service';

@Component({
  selector: 'oppia-editor-navigation',
  templateUrl: './editor-navigation.component.html',
})
export class EditorNavigationComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  autosaveIsInProgress: boolean = false;
  screenIsLarge: boolean = false;
  isPublishButtonEnabled: boolean = false;
  postTutorialHelpPopoverIsShown: boolean = false;
  connectedToInternet: boolean = false;
  improvementsTabIsEnabled: boolean = false;
  userIsLoggedIn: boolean = false;
  mobileNavOptionsAreShown: boolean = false;
  saveIsInProcess: boolean = false;
  publishIsInProcess: boolean = false;
  loadingDotsAreShown: boolean = false;

  constructor(
    private changeListService: ChangeListService,
    private contextService: ContextService,
    private editabilityService: EditabilityService,
    private explorationImprovementsService: ExplorationImprovementsService,
    private explorationRightsService: ExplorationRightsService,
    private explorationSaveService: ExplorationSaveService,
    private explorationWarningsService: ExplorationWarningsService,
    private internetConnectivityService: InternetConnectivityService,
    private ngbModal: NgbModal,
    private routerService: RouterService,
    private siteAnalyticsService: SiteAnalyticsService,
    private stateTutorialFirstTimeService: StateTutorialFirstTimeService,
    private threadDataBackendApiService: ThreadDataBackendApiService,
    private userExplorationPermissionsService: UserExplorationPermissionsService,
    private userService: UserService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  getChangeListLength(): number {
    return this.changeListService.getChangeList().length;
  }

  isExplorationSaveable(): boolean {
    return this.explorationSaveService.isExplorationSaveable();
  }

  isPrivate(): boolean {
    return this.explorationRightsService.isPrivate();
  }

  isExplorationLockedForEditing(): boolean {
    return this.changeListService.isExplorationLockedForEditing();
  }

  isEditableOutsideTutorialMode(): boolean {
    return (
      this.editabilityService.isEditableOutsideTutorialMode() ||
      this.editabilityService.isTranslatable()
    );
  }

  discardChanges(): void {
    this.explorationSaveService.discardChanges();
  }

  showPublishExplorationModal(): void {
    this.publishIsInProcess = true;
    this.loadingDotsAreShown = true;

    this.explorationSaveService
      .showPublishExplorationModal(
        this.showLoadingDots.bind(this),
        this.hideLoadingDots.bind(this)
      )
      .then(() => {
        this.publishIsInProcess = false;
        this.loadingDotsAreShown = false;
      });
  }

  showLoadingDots(): void {
    this.loadingDotsAreShown = true;
  }

  hideLoadingDots(): void {
    this.loadingDotsAreShown = false;
  }

  saveChanges(): void {
    this.saveIsInProcess = true;
    this.loadingDotsAreShown = true;

    this.explorationSaveService
      .saveChangesAsync(
        this.showLoadingDots.bind(this),
        this.hideLoadingDots.bind(this)
      )
      .then(
        () => {
          this.saveIsInProcess = false;
          this.loadingDotsAreShown = false;
        },
        () => {}
      );
  }

  toggleMobileNavOptions(): void {
    this.mobileNavOptionsAreShown = !this.mobileNavOptionsAreShown;
  }

  countWarnings(): number {
    return this.explorationWarningsService.countWarnings();
  }

  getWarnings(): string[] | object[] {
    return this.explorationWarningsService.getWarnings();
  }

  hasCriticalWarnings(): boolean {
    return this.explorationWarningsService.hasCriticalWarnings();
  }

  getActiveTabName(): string {
    return this.routerService.getActiveTabName();
  }

  selectMainTab(value: string): void {
    this.routerService.navigateToMainTab(value);
  }

  selectTranslationTab(): void {
    this.routerService.navigateToTranslationTab();
  }

  selectPreviewTab(): void {
    this.routerService.navigateToPreviewTab();
  }

  selectSettingsTab(): void {
    this.routerService.navigateToSettingsTab();
  }

  selectStatsTab(): void {
    this.routerService.navigateToStatsTab();
  }

  selectImprovementsTab(): void {
    this.routerService.navigateToImprovementsTab();
  }

  selectHistoryTab(): void {
    this.routerService.navigateToHistoryTab();
  }

  selectFeedbackTab(): void {
    this.routerService.navigateToFeedbackTab();
  }

  getOpenThreadsCount(): number {
    return this.threadDataBackendApiService.getOpenThreadsCount();
  }

  showUserHelpModal(): void {
    const explorationId = this.contextService.getExplorationId();
    this.siteAnalyticsService.registerClickHelpButtonEvent(explorationId);

    const EDITOR_TUTORIAL_MODE = 'editor';
    const TRANSLATION_TUTORIAL_MODE = 'translation';

    this.ngbModal
      .open(HelpModalComponent, {
        backdrop: true,
        windowClass: 'oppia-help-modal',
      })
      .result.then(
        mode => {
          if (mode === EDITOR_TUTORIAL_MODE) {
            this.stateTutorialFirstTimeService.onOpenEditorTutorial.emit();
          } else if (mode === TRANSLATION_TUTORIAL_MODE) {
            this.stateTutorialFirstTimeService.onOpenTranslationTutorial.emit();
          }
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  isScreenLarge(): boolean {
    return this.screenIsLarge;
  }

  isPostTutorialHelpPopoverShown(): boolean {
    return this.postTutorialHelpPopoverIsShown;
  }

  isImprovementsTabEnabled(): boolean {
    return this.improvementsTabIsEnabled;
  }

  isUserLoggedIn(): boolean {
    return this.userIsLoggedIn;
  }

  showPublishButton(): boolean {
    return (
      this.isPublishButtonEnabled && this.explorationRightsService.isPrivate()
    );
  }

  ngOnInit(): void {
    this.userExplorationPermissionsService
      .getPermissionsAsync()
      .then(permissions => {
        this.isPublishButtonEnabled = permissions.canPublish;
      });

    this.screenIsLarge = this.windowDimensionsService.getWidth() >= 1024;

    this.directiveSubscriptions.add(
      this.windowDimensionsService.getResizeEvent().subscribe(evt => {
        this.screenIsLarge = this.windowDimensionsService.getWidth() >= 1024;
      })
    );

    this.postTutorialHelpPopoverIsShown = false;

    this.directiveSubscriptions.add(
      this.stateTutorialFirstTimeService.onOpenPostTutorialHelpPopover.subscribe(
        () => {
          if (this.screenIsLarge) {
            this.postTutorialHelpPopoverIsShown = true;
            setTimeout(() => {
              this.postTutorialHelpPopoverIsShown = false;
            }, 4000);
          } else {
            this.postTutorialHelpPopoverIsShown = false;
          }
        }
      )
    );

    this.directiveSubscriptions.add(
      this.changeListService.autosaveInProgressEventEmitter.subscribe(
        (autosaveInProgress: boolean) => {
          this.autosaveIsInProgress = autosaveInProgress;
        }
      )
    );

    this.directiveSubscriptions.add(
      this.internetConnectivityService.onInternetStateChange.subscribe(
        internetAccessible => {
          this.connectedToInternet = internetAccessible;
        }
      )
    );

    this.connectedToInternet = this.internetConnectivityService.isOnline();
    this.improvementsTabIsEnabled = false;

    Promise.resolve(
      this.explorationImprovementsService.isImprovementsTabEnabledAsync()
    ).then(improvementsTabIsEnabled => {
      this.improvementsTabIsEnabled = improvementsTabIsEnabled;
    });

    this.userIsLoggedIn = false;

    Promise.resolve(this.userService.getUserInfoAsync()).then(userInfo => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
    });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
