// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the exploration editor page and the editor
 *               help tab in the navbar.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {WelcomeModalComponent} from './modal-templates/welcome-modal.component';
import {HelpModalComponent} from './modal-templates/help-modal.component';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {ParamChangesObjectFactory} from 'domain/exploration/ParamChangesObjectFactory';
import {
  ParamSpecsBackendDict,
  ParamSpecsObjectFactory,
} from 'domain/exploration/ParamSpecsObjectFactory';
import {AlertsService} from 'services/alerts.service';
import {BottomNavbarStatusService} from 'services/bottom-navbar-status.service';
import {ContextService} from 'services/context.service';
import {EditabilityService} from 'services/editability.service';
import {ExplorationFeaturesBackendApiService} from 'services/exploration-features-backend-api.service';
import {ExplorationFeaturesService} from 'services/exploration-features.service';
import {ExplorationImprovementsService} from 'services/exploration-improvements.service';
import {InternetConnectivityService} from 'services/internet-connectivity.service';
import {LoaderService} from 'services/loader.service';
import {PageTitleService} from 'services/page-title.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {UserService} from 'services/user.service';
import {ThreadDataBackendApiService} from './feedback-tab/services/thread-data-backend-api.service';
import {AutosaveInfoModalsService} from './services/autosave-info-modals.service';
import {ChangeListService} from './services/change-list.service';
import {ExplorationAutomaticTextToSpeechService} from './services/exploration-automatic-text-to-speech.service';
import {ExplorationCategoryService} from './services/exploration-category.service';
import {ExplorationDataService} from './services/exploration-data.service';
import {ExplorationInitStateNameService} from './services/exploration-init-state-name.service';
import {ExplorationLanguageCodeService} from './services/exploration-language-code.service';
import {ExplorationObjectiveService} from './services/exploration-objective.service';
import {ExplorationParamChangesService} from './services/exploration-param-changes.service';
import {ExplorationParamSpecsService} from './services/exploration-param-specs.service';
import {ExplorationPropertyService} from './services/exploration-property.service';
import {ExplorationRightsService} from './services/exploration-rights.service';
import {ExplorationSaveService} from './services/exploration-save.service';
import {ExplorationStatesService} from './services/exploration-states.service';
import {ExplorationTagsService} from './services/exploration-tags.service';
import {ExplorationTitleService} from './services/exploration-title.service';
import {ExplorationWarningsService} from './services/exploration-warnings.service';
import {GraphDataService} from './services/graph-data.service';
import {RouterService} from './services/router.service';
import {StateEditorRefreshService} from './services/state-editor-refresh.service';
import {StateTutorialFirstTimeService} from './services/state-tutorial-first-time.service';
import {UserEmailPreferencesService} from './services/user-email-preferences.service';
import {UserExplorationPermissionsService} from './services/user-exploration-permissions.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {ExplorationNextContentIdIndexService} from './services/exploration-next-content-id-index.service';
import {VersionHistoryService} from './services/version-history.service';
import {ExplorationBackendDict} from 'domain/exploration/ExplorationObjectFactory';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {EntityTranslation} from 'domain/translation/EntityTranslationObjectFactory';
import {EntityBulkTranslationsBackendApiService} from './services/entity-bulk-translations-backend-api.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {ExplorationChange} from 'domain/exploration/exploration-draft.model';
import {
  InsertScriptService,
  KNOWN_SCRIPTS,
} from 'services/insert-script.service';

interface ExplorationData extends ExplorationBackendDict {
  exploration_is_linked_to_story: boolean;
  category: string;
  objective: string;
  tags: string;
  user: string;
  rights: {
    owner_names: string[];
    editor_names: string[];
    voice_artist_names: string[];
    viewer_names: string[];
    status: string;
    cloned_from: string;
    community_owned: boolean;
    viewable_if_private: boolean;
  };
  email_preferences: {
    mute_feedback_notifications: boolean;
    mute_suggestion_notifications: boolean;
  };
  show_state_editor_tutorial_on_load: boolean;
  show_state_translation_tutorial_on_load: boolean;
  next_content_id_index: number;
}

@Component({
  selector: 'exploration-editor-page',
  templateUrl: './exploration-editor-page.component.html',
})
export class ExplorationEditorPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();

  explorationIsLinkedToStory: boolean;
  screenIsLarge: boolean;
  explorationId: string;
  explorationUrl: string;
  revertExplorationUrl: string;
  checkRevertExplorationValidUrl: string;
  explorationDownloadUrl: string;
  improvementsTabIsEnabled: boolean;
  reconnectedMessageTimeoutMilliseconds: number = 4000;
  disconnectedMessageTimeoutMilliseconds: number = 5000;
  autosaveIsInProgress: boolean = false;
  connectedToInternet: boolean = true;
  explorationEditorPageHasInitialized: boolean = false;
  activeThread: string;
  warningsAreShown: boolean;
  currentUserIsCurriculumAdmin: boolean;
  currentUserIsModerator: boolean;
  currentUser: string;
  currentVersion: number;
  areExplorationWarningsVisible: boolean;
  isModalOpenable: boolean = true;
  modifyTranslationsFeatureFlagIsEnabled: boolean = false;

  constructor(
    private alertsService: AlertsService,
    private autosaveInfoModalsService: AutosaveInfoModalsService,
    private bottomNavbarStatusService: BottomNavbarStatusService,
    private changeListService: ChangeListService,
    private contextService: ContextService,
    public editabilityService: EditabilityService,
    private entityBulkTranslationsBackendApiService: EntityBulkTranslationsBackendApiService,
    private entityTranslationsService: EntityTranslationsService,
    private explorationAutomaticTextToSpeechService: ExplorationAutomaticTextToSpeechService,
    private explorationCategoryService: ExplorationCategoryService,
    private explorationDataService: ExplorationDataService,
    private explorationFeaturesBackendApiService: ExplorationFeaturesBackendApiService,
    private explorationFeaturesService: ExplorationFeaturesService,
    private explorationImprovementsService: ExplorationImprovementsService,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private explorationLanguageCodeService: ExplorationLanguageCodeService,
    private explorationNextContentIdIndexService: ExplorationNextContentIdIndexService,
    private explorationObjectiveService: ExplorationObjectiveService,
    private explorationParamChangesService: ExplorationParamChangesService,
    private explorationParamSpecsService: ExplorationParamSpecsService,
    private explorationPropertyService: ExplorationPropertyService,
    public explorationRightsService: ExplorationRightsService,
    private explorationSaveService: ExplorationSaveService,
    private explorationStatesService: ExplorationStatesService,
    private explorationTagsService: ExplorationTagsService,
    private explorationTitleService: ExplorationTitleService,
    private explorationWarningsService: ExplorationWarningsService,
    private focusManagerService: FocusManagerService,
    private graphDataService: GraphDataService,
    private internetConnectivityService: InternetConnectivityService,
    private loaderService: LoaderService,
    private ngbModal: NgbModal,
    private pageTitleService: PageTitleService,
    private paramChangesObjectFactory: ParamChangesObjectFactory,
    private paramSpecsObjectFactory: ParamSpecsObjectFactory,
    private platformFeatureService: PlatformFeatureService,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
    private routerService: RouterService,
    private siteAnalyticsService: SiteAnalyticsService,
    private stateEditorRefreshService: StateEditorRefreshService,
    private stateEditorService: StateEditorService,
    private stateTutorialFirstTimeService: StateTutorialFirstTimeService,
    private threadDataBackendApiService: ThreadDataBackendApiService,
    private userEmailPreferencesService: UserEmailPreferencesService,
    private userExplorationPermissionsService: UserExplorationPermissionsService,
    private userService: UserService,
    private windowDimensionsService: WindowDimensionsService,
    private versionHistoryService: VersionHistoryService,
    private entityVoiceoversService: EntityVoiceoversService,
    private voiceoverBackendApiService: VoiceoverBackendApiService,
    private insertScriptService: InsertScriptService
  ) {}

  setDocumentTitle(): void {
    if (this.explorationTitleService.savedMemento) {
      this.pageTitleService.setDocumentTitle(
        this.explorationTitleService.savedMemento + ' - Oppia Editor'
      );
    } else {
      this.pageTitleService.setDocumentTitle(
        'Untitled Exploration - Oppia Editor'
      );
    }
  }

  /** ******************************************
   * Methods affecting the graph visualization.
   ********************************************/
  toggleExplorationWarningVisibility(): void {
    this.areExplorationWarningsVisible = !this.areExplorationWarningsVisible;
  }

  getExplorationUrl(explorationId: string): string {
    return explorationId ? '/explore/' + explorationId : '';
  }

  // Initializes the exploration page using data from the backend.
  // Called on page load.
  initExplorationPage(): Promise<void> {
    this.editabilityService.lockExploration(true);
    this.modifyTranslationsFeatureFlagIsEnabled =
      this.platformFeatureService.status.ExplorationEditorCanModifyTranslations.isEnabled;
    return Promise.all([
      this.explorationDataService.getDataAsync((explorationId, lostChanges) => {
        if (!this.autosaveInfoModalsService.isModalOpen()) {
          this.autosaveInfoModalsService.showLostChangesModal(
            lostChanges,
            explorationId
          );
        }
      }),
      this.explorationFeaturesBackendApiService.fetchExplorationFeaturesAsync(
        this.contextService.getExplorationId()
      ),
      this.threadDataBackendApiService.getFeedbackThreadsAsync(),
      this.userService.getUserInfoAsync(),
    ]).then(async ([explorationData, featuresData, _, userInfo]) => {
      if ((explorationData as ExplorationData).exploration_is_linked_to_story) {
        this.explorationIsLinkedToStory = true;
        this.contextService.setExplorationIsLinkedToStory();
      }

      this.explorationFeaturesService.init(explorationData, featuresData);

      this.explorationStatesService.init(
        explorationData.states,
        (explorationData as ExplorationData).exploration_is_linked_to_story
      );
      this.entityTranslationsService.init(
        this.explorationId,
        'exploration',
        explorationData.version
      );
      this.contextService.setExplorationVersion(explorationData.version);

      this.entityVoiceoversService.init(
        this.explorationId,
        'exploration',
        explorationData.version,
        explorationData.language_code
      );

      this.explorationTitleService.init(explorationData.title);
      this.explorationCategoryService.init(
        (explorationData as ExplorationData).category
      );
      this.explorationObjectiveService.init(
        (explorationData as ExplorationData).objective
      );
      this.explorationLanguageCodeService.init(explorationData.language_code);
      this.explorationInitStateNameService.init(
        explorationData.init_state_name
      );
      this.explorationTagsService.init(
        (explorationData as ExplorationData).tags
      );
      this.explorationParamSpecsService.init(
        this.paramSpecsObjectFactory.createFromBackendDict(
          explorationData.param_specs as ParamSpecsBackendDict
        )
      );
      this.explorationParamChangesService.init(
        this.paramChangesObjectFactory.createFromBackendList(
          explorationData.param_changes
        )
      );
      this.explorationAutomaticTextToSpeechService.init(
        explorationData.auto_tts_enabled
      );
      this.explorationNextContentIdIndexService.init(
        explorationData.next_content_id_index
      );
      if (explorationData.edits_allowed) {
        this.editabilityService.lockExploration(false);
      }

      this.currentUserIsCurriculumAdmin = userInfo.isCurriculumAdmin();
      this.currentUserIsModerator = userInfo.isModerator();
      this.currentUser = (explorationData as ExplorationData).user;
      this.currentVersion = explorationData.version;

      this.explorationRightsService.init(
        (explorationData as ExplorationData).rights.owner_names,
        (explorationData as ExplorationData).rights.editor_names,
        (explorationData as ExplorationData).rights.voice_artist_names,
        (explorationData as ExplorationData).rights.viewer_names,
        (explorationData as ExplorationData).rights.status,
        (explorationData as ExplorationData).rights.cloned_from,
        (explorationData as ExplorationData).rights.community_owned,
        (explorationData as ExplorationData).rights.viewable_if_private
      );
      this.userEmailPreferencesService.init(
        (explorationData as ExplorationData).email_preferences
          .mute_feedback_notifications,
        (explorationData as ExplorationData).email_preferences
          .mute_suggestion_notifications
      );

      this.userExplorationPermissionsService
        .getPermissionsAsync()
        .then(permissions => {
          if (permissions.canEdit) {
            this.editabilityService.markEditable();
          }
          if (permissions.canVoiceover || permissions.canEdit) {
            this.editabilityService.markTranslatable();
          }
        });

      this.versionHistoryService.init(explorationData.version);

      this.graphDataService.recompute();

      if (
        !this.stateEditorService.getActiveStateName() ||
        !this.explorationStatesService.getState(
          this.stateEditorService.getActiveStateName()
        )
      ) {
        this.stateEditorService.setActiveStateName(
          this.explorationInitStateNameService.displayed as string
        );
      }

      if (
        !this.routerService.isLocationSetToNonStateEditorTab() &&
        !explorationData.states.hasOwnProperty(
          this.routerService.getCurrentStateFromLocationPath()
        )
      ) {
        if (this.threadDataBackendApiService.getOpenThreadsCount() > 0) {
          this.routerService.navigateToFeedbackTab();
        }
      }

      if (this.modifyTranslationsFeatureFlagIsEnabled) {
        this.entityBulkTranslationsBackendApiService
          .fetchEntityBulkTranslationsAsync(
            this.explorationId,
            'exploration',
            this.currentVersion
          )
          .then(response => {
            for (let language in response) {
              // Initialize the entity translation objects with the last published translations
              // in order to compare translation changes made.
              let languageTranslations =
                response[language].translationMappingToBackendDict();
              this.entityTranslationsService.languageCodeToLastPublishedEntityTranslations[
                language
              ] = EntityTranslation.createFromBackendDict({
                entity_id: this.explorationId,
                entity_type: 'exploration',
                entity_version: response[language].entityVersion,
                language_code: language,
                translations: languageTranslations,
              });

              this.entityTranslationsService.languageCodeToLatestEntityTranslations[
                language
              ] = EntityTranslation.createFromBackendDict({
                entity_id: this.explorationId,
                entity_type: 'exploration',
                entity_version: response[language].entityVersion,
                language_code: language,
                translations: languageTranslations,
              });
            }
            // Populate the entity translations with draft changes
            // if they exist.
            this.populateEntityTranslationsWithDraftChanges(
              explorationData.draft_changes,
              explorationData.version
            );
          });
      } else {
        // Simply populate draft changes for the translation tab in case the feature flag is not enabled.
        this.populateEntityTranslationsWithDraftChanges(
          explorationData.draft_changes,
          explorationData.version
        );
      }

      // Initialize changeList by draft changes if they exist.
      if (explorationData.draft_changes !== null) {
        this.changeListService.loadAutosavedChangeList(
          explorationData.draft_changes
        );
      }

      if (
        explorationData.is_version_of_draft_valid === false &&
        explorationData.draft_changes !== null &&
        explorationData.draft_changes.length > 0
      ) {
        // Show modal displaying lost changes if the version of draft
        // changes is invalid, and draft_changes is not `null`.
        this.autosaveInfoModalsService.showVersionMismatchModal(
          this.changeListService.getChangeList()
        );
      }
      this.routerService.onRefreshStatisticsTab.emit();

      this.routerService.onRefreshVersionHistory.emit({
        forceRefresh: true,
      });

      if (
        this.explorationStatesService.getState(
          this.stateEditorService.getActiveStateName()
        )
      ) {
        this.stateEditorRefreshService.onRefreshStateEditor.emit();
      }

      this.stateTutorialFirstTimeService.initEditor(
        (explorationData as ExplorationData).show_state_editor_tutorial_on_load,
        this.explorationId
      );

      if (
        (explorationData as ExplorationData)
          .show_state_translation_tutorial_on_load
      ) {
        this.stateTutorialFirstTimeService.markTranslationTutorialNotSeenBefore();
      }

      // TODO(#13352): Initialize StateTopAnswersStatsService and register
      // relevant callbacks.
      await this.explorationImprovementsService.initAsync();
      await this.explorationImprovementsService.flushUpdatedTasksToBackend();

      this.explorationWarningsService.updateWarnings();
      this.stateEditorRefreshService.onRefreshStateEditor.emit();
      this.explorationEditorPageHasInitialized = true;
    });
  }

  populateEntityTranslationsWithDraftChanges(
    draftChanges: ExplorationChange[] | null,
    version: number
  ): void {
    if (draftChanges !== null) {
      for (let i in draftChanges) {
        let changeDict = draftChanges[i];

        if (changeDict.cmd === 'edit_translation') {
          // Create the entity translation objects first if they don't exist.
          if (
            !this.entityTranslationsService.languageCodeToLatestEntityTranslations.hasOwnProperty(
              changeDict.language_code
            )
          ) {
            this.entityTranslationsService.languageCodeToLatestEntityTranslations[
              changeDict.language_code
            ] = EntityTranslation.createFromBackendDict({
              entity_id: this.explorationId,
              entity_type: 'exploration',
              entity_version: version,
              language_code: changeDict.language_code,
              translations: {},
            });
          }

          // Update the translations appropriately, via latest draft changes.
          if (changeDict.translation.content_value) {
            this.entityTranslationsService.languageCodeToLatestEntityTranslations[
              changeDict.language_code
            ].updateTranslation(
              changeDict.content_id,
              TranslatedContent.createFromBackendDict(changeDict.translation)
            );
          } else {
            this.entityTranslationsService.languageCodeToLatestEntityTranslations[
              changeDict.language_code
            ].removeTranslation(changeDict.content_id);
          }
        } else if (changeDict.cmd === 'remove_translations') {
          this.entityTranslationsService.removeAllTranslationsForContent(
            changeDict.content_id
          );
        } else if (
          changeDict.cmd === 'mark_translation_needs_update_for_language'
        ) {
          this.entityTranslationsService.languageCodeToLatestEntityTranslations[
            changeDict.language_code
          ].markTranslationAsNeedingUpdate(changeDict.content_id);
        } else if (changeDict.cmd === 'mark_translations_needs_update') {
          this.entityTranslationsService.markAllTranslationsAsNeedingUpdate(
            changeDict.content_id
          );
        }
      }
    }
  }

  getActiveTabName(): string {
    return this.routerService.getActiveTabName();
  }

  setFocusOnActiveTab(activeTab: string): void {
    if (activeTab === 'history') {
      this.focusManagerService.setFocus('usernameInputField');
    }
    if (activeTab === 'feedback') {
      if (!this.activeThread) {
        this.focusManagerService.setFocus('newThreadButton');
      }
      if (this.activeThread) {
        this.focusManagerService.setFocus('tmpMessageText');
      }
    }
  }

  skipEditorNavbar(): void {
    let mainContentElement: HTMLElement | null = document.querySelector(
      '.exploration-editor-content'
    );

    mainContentElement.tabIndex = -1;
    mainContentElement.scrollIntoView();
    mainContentElement.focus();
  }

  startEditorTutorial(): void {
    this.editabilityService.onStartTutorial();

    if (this.routerService.getActiveTabName() !== 'main') {
      this.selectMainTab();
    } else {
      this.stateEditorRefreshService.onRefreshStateEditor.emit();
    }
  }

  startTranslationTutorial(): void {
    this.editabilityService.onStartTutorial();

    if (this.routerService.getActiveTabName() !== 'translation') {
      this.selectTranslationTab();
    } else {
      this.routerService.onRefreshTranslationTab.emit();
    }
  }

  showWelcomeExplorationModal(): void {
    if (this.isModalOpenable) {
      this.isModalOpenable = false;
      this.ngbModal
        .open(WelcomeModalComponent, {
          backdrop: true,
          windowClass: 'oppia-welcome-modal',
        })
        .result.then(
          explorationId => {
            this.siteAnalyticsService.registerAcceptTutorialModalEvent(
              explorationId
            );
            this.startEditorTutorial();
            this.isModalOpenable = true;
          },
          explorationId => {
            this.siteAnalyticsService.registerDeclineTutorialModalEvent(
              explorationId
            );
            this.stateTutorialFirstTimeService.markEditorTutorialFinished();
            this.isModalOpenable = true;
          }
        );
    }
  }

  generateAriaLabelForWarnings(): string {
    const warnings = this.getWarnings() as {message: string}[];
    const warningLabels = warnings
      .map(
        (warning, index) => 'Warning ' + (index + 1) + ': ' + warning.message
      )
      .join('. ');

    return 'Total warnings: ' + this.countWarnings() + '. ' + warningLabels;
  }

  getNavbarText(): string {
    return 'Exploration Editor';
  }

  countWarnings(): number {
    return this.explorationWarningsService.countWarnings();
  }

  getWarnings(): object[] | string[] {
    return this.explorationWarningsService.getWarnings();
  }

  hasCriticalWarnings(): boolean {
    return this.explorationWarningsService.hasCriticalWarnings();
  }

  selectMainTab(): void {
    this.routerService.navigateToMainTab(null);
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
    this.setFocusOnActiveTab('history');
  }

  selectFeedbackTab(): void {
    this.routerService.navigateToFeedbackTab();
    this.setFocusOnActiveTab('feedback');
  }

  getOpenThreadsCount(): number {
    return this.threadDataBackendApiService.getOpenThreadsCount();
  }

  showUserHelpModal(): void {
    let explorationId = this.contextService.getExplorationId();
    this.siteAnalyticsService.registerClickHelpButtonEvent(explorationId);
    let EDITOR_TUTORIAL_MODE = 'editor';
    let TRANSLATION_TUTORIAL_MODE = 'translation';
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

  isWarningsAreShown(value: boolean): void {
    this.warningsAreShown = value;
  }

  ngOnInit(): void {
    this.internetConnectivityService.startCheckingConnection();

    this.insertScriptService.loadScript(KNOWN_SCRIPTS.PENCILCODE);

    this.directiveSubscriptions.add(
      this.explorationPropertyService.onExplorationPropertyChanged.subscribe(
        () => {
          this.setDocumentTitle();
        }
      )
    );

    this.directiveSubscriptions.add(
      this.internetConnectivityService.onInternetStateChange.subscribe(
        internetAccessible => {
          this.connectedToInternet = internetAccessible;
          if (internetAccessible) {
            this.alertsService.addSuccessMessage(
              'Reconnected. Checking whether your changes are mergeable.',
              this.reconnectedMessageTimeoutMilliseconds
            );
            this.preventPageUnloadEventService.removeListener();
          } else {
            this.alertsService.addInfoMessage(
              'Looks like you are offline. ' +
                'You can continue working, and can save ' +
                'your changes once reconnected.',
              this.disconnectedMessageTimeoutMilliseconds
            );
            this.preventPageUnloadEventService.addListener();
            if (this.routerService.getActiveTabName() !== 'main') {
              this.selectMainTab();
            }
          }
        }
      )
    );

    this.directiveSubscriptions.add(
      this.changeListService.autosaveIsInProgress$.subscribe(
        autosaveIsInProgress => {
          this.autosaveIsInProgress = autosaveIsInProgress;
        }
      )
    );

    this.screenIsLarge = this.windowDimensionsService.getWidth() >= 1024;
    this.bottomNavbarStatusService.markBottomNavbarStatus(true);

    this.directiveSubscriptions.add(
      this.explorationSaveService.onInitExplorationPage.subscribe(() => {
        this.initExplorationPage();
      })
    );

    this.directiveSubscriptions.add(
      this.explorationStatesService.onRefreshGraph.subscribe(() => {
        this.graphDataService.recompute();
        this.explorationWarningsService.updateWarnings();
      })
    );

    this.directiveSubscriptions.add(
      // eslint-disable-next-line max-len
      this.stateTutorialFirstTimeService.onEnterEditorForTheFirstTime.subscribe(
        () => {
          this.showWelcomeExplorationModal();
        }
      )
    );

    this.directiveSubscriptions.add(
      this.stateTutorialFirstTimeService.onOpenEditorTutorial.subscribe(() => {
        this.startEditorTutorial();
      })
    );

    this.directiveSubscriptions.add(
      this.routerService.onRefreshTranslationTab.subscribe(() => {})
    );

    this.directiveSubscriptions.add(
      this.stateTutorialFirstTimeService.onOpenTranslationTutorial.subscribe(
        () => {
          this.startTranslationTutorial();
        }
      )
    );

    /** ********************************************************
     * Called on initial load of the exploration editor page.
     *********************************************************/
    this.loaderService.showLoadingScreen('Loading');

    this.explorationId = this.contextService.getExplorationId();
    this.explorationUrl = '/create/' + this.explorationId;
    this.explorationDownloadUrl =
      '/createhandler/download/' + this.explorationId;
    this.checkRevertExplorationValidUrl =
      '/createhandler/check_revert_valid/' + this.explorationId;
    this.revertExplorationUrl = '/createhandler/revert/' + this.explorationId;
    this.areExplorationWarningsVisible = false;

    // The initExplorationPage function is written separately since it
    // is also called in $scope.$on when some external events are
    // triggered.
    this.initExplorationPage();
    this.improvementsTabIsEnabled = false;

    Promise.resolve(
      this.explorationImprovementsService.isImprovementsTabEnabledAsync()
    ).then(improvementsTabIsEnabledResponse => {
      this.improvementsTabIsEnabled = improvementsTabIsEnabledResponse;
    });

    this.initExplorationPage();
  }

  isImprovementsTabEnabled(): boolean {
    return this.improvementsTabIsEnabled;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
