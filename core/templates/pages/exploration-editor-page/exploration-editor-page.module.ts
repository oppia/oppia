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
 * @fileoverview Module for the exploration editor page.
 */

import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';

import {JoyrideModule, JoyrideService, LoggerService} from 'ngx-joyride';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatMenuModule} from '@angular/material/menu';
import {SharedComponentsModule} from 'components/shared-component.module';
import {StateParamChangesEditorComponent} from './editor-tab/state-param-changes-editor/state-param-changes-editor.component';
import {DeleteStateSkillModalComponent} from './editor-tab/templates/modal-templates/delete-state-skill-modal.component';
import {InteractionExtensionsModule} from 'interactions/interactions.module';
import {WelcomeModalComponent} from './modal-templates/welcome-modal.component';
import {StateDiffModalComponent} from './modal-templates/state-diff-modal.component';
import {CreateFeedbackThreadModalComponent} from './feedback-tab/templates/create-feedback-thread-modal.component';
import {WelcomeTranslationModalComponent} from './translation-tab/modal-templates/welcome-translation-modal.component';
import {DeleteExplorationModalComponent} from './settings-tab/templates/delete-exploration-modal.component';
import {RemoveRoleConfirmationModalComponent} from './settings-tab/templates/remove-role-confirmation-modal.component';
import {ReassignRoleConfirmationModalComponent} from './settings-tab/templates/reassign-role-confirmation-modal.component';
import {ModeratorUnpublishExplorationModalComponent} from './settings-tab/templates/moderator-unpublish-exploration-modal.component';
import {TransferExplorationOwnershipModalComponent} from './settings-tab/templates/transfer-exploration-ownership-modal.component';
import {HelpModalComponent} from './modal-templates/help-modal.component';
import {DeleteAudioTranslationModalComponent} from './translation-tab/modal-templates/delete-audio-translation-modal.component';
import {TranslationTabBusyModalComponent} from './translation-tab/modal-templates/translation-tab-busy-modal.component';
import {PreviewSetParametersModalComponent} from './preview-tab/templates/preview-set-parameters-modal.component';
import {CheckRevertExplorationModalComponent} from './history-tab/modal-templates/check-revert-exploration-modal.component';
import {RevertExplorationModalComponent} from './history-tab/modal-templates/revert-exploration-modal.component';
import {ExplorationMetadataDiffModalComponent} from './modal-templates/exploration-metadata-diff-modal.component';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {EditorNavbarBreadcrumbComponent} from './editor-navigation/editor-navbar-breadcrumb.component';
import {ExplorationGraphModalComponent} from './editor-tab/templates/modal-templates/exploration-graph-modal.component';
import {ExplorationGraphComponent} from './editor-tab/graph-directives/exploration-graph.component';
import {StateNameEditorComponent} from './editor-tab/state-name-editor/state-name-editor.component';
import {EditorNavigationComponent} from './editor-navigation/editor-navigation.component';
import {TeachOppiaModalComponent} from './editor-tab/templates/modal-templates/teach-oppia-modal.component';
import {SettingsTabComponent} from './settings-tab/settings-tab.component';
import {UnresolvedAnswersOverviewComponent} from './editor-tab/unresolved-answers-overview/unresolved-answers-overview.component';
import {PreviewTabComponent} from './preview-tab/preview-tab.component';
import {HistoryTabComponent} from './history-tab/history-tab.component';
import {FeedbackTabComponent} from './feedback-tab/feedback-tab.component';
import {ImprovementsTabComponent} from './improvements-tab/improvements-tab.component';
import {NeedsGuidingResponsesTaskComponent} from './improvements-tab/needs-guiding-responses-task.component';
import {StatisticsTabComponent} from './statistics-tab/statistics-tab.component';
import {StateStatsModalComponent} from './statistics-tab/templates/state-stats-modal.component';
import {PieChartComponent} from './statistics-tab/charts/pie-chart.component';
import {ExplorationEditorTabComponent} from './editor-tab/exploration-editor-tab.component';
import {ExplorationSaveAndPublishButtonsComponent} from './exploration-save-and-publish-buttons/exploration-save-and-publish-buttons.component';
import {ExplorationSavePromptModalComponent} from './modal-templates/exploration-save-prompt-modal.component';
import {AddAudioTranslationModalComponent} from './translation-tab/modal-templates/add-audio-translation-modal.component';
import {AudioTranslationBarComponent} from './translation-tab/audio-translation-bar/audio-translation-bar.component';
import {VoiceoverCardComponent} from './translation-tab/voiceover-card/voiceover-card.component';
import {StateTranslationEditorComponent} from './translation-tab/state-translation-editor/state-translation-editor.component';
import {StateTranslationComponent} from './translation-tab/state-translation/state-translation.component';
import {TranslatorOverviewComponent} from './translation-tab/translator-overview/translator-overview.component';
import {StateTranslationStatusGraphComponent} from './translation-tab/state-translation-status-graph/state-translation-status-graph.component';
import {TranslationTabComponent} from './translation-tab/translation-tab.component';
import {ValueGeneratorEditorComponent} from './param-changes-editor/value-generator-editor.component';
import {ParamChangesEditorComponent} from './param-changes-editor/param-changes-editor.component';
import {ExplorationEditorPageComponent} from './exploration-editor-page.component';
import {VoiceoverRemovalConfirmModalComponent} from './translation-tab/voiceover-card/modals/voiceover-removal-confirm-modal.component';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {OppiaCkEditorCopyToolBarModule} from 'components/ck-editor-helpers/ck-editor-copy-toolbar/ck-editor-copy-toolbar.module';
import {ExplorationPlayerViewerCommonModule} from 'pages/exploration-player-page/exploration-player-viewer-common.module';
import {StateVersionHistoryModalComponent} from './modal-templates/state-version-history-modal.component';
import {MetadataVersionHistoryModalComponent} from './modal-templates/metadata-version-history-modal.component';
import {StateVersionHistoryComponent} from './editor-tab/state-version-history/state-version-history.component';
import {ExplorationEditorPageRootComponent} from './exploration-editor-page-root.component';
import {CommonModule} from '@angular/common';
import {ExplorationEditorPageAuthGuard} from './exploration-editor-page-auth.guard';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import 'third-party-imports/guppy.import';
import 'third-party-imports/midi-js.import';
import 'third-party-imports/skulpt.import';

// Services used by the exploration editor page.
import {AlertsService} from 'services/alerts.service';
import {AnswerClassificationService} from 'pages/exploration-player-page/services/answer-classification.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {AutosaveInfoModalsService} from './services/autosave-info-modals.service';
import {ChangeListService} from './services/change-list.service';
import {ComputeGraphService} from 'services/compute-graph.service';
import {ContextService} from 'services/context.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {EditorFirstTimeEventsService} from './services/editor-first-time-events.service';
import {EditabilityService} from 'services/editability.service';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {EventBusService} from 'app-events/event-bus.service';
import {ExplorationAutomaticTextToSpeechService} from './services/exploration-automatic-text-to-speech.service';
import {ExplorationCategoryService} from './services/exploration-category.service';
import {ExplorationDataBackendApiService} from './services/exploration-data-backend-api.service';
import {ExplorationDataService} from './services/exploration-data.service';
import {ExplorationEditsAllowedBackendApiService} from './services/exploration-edits-allowed-backend-api.service';
import {ExplorationFeaturesService} from 'services/exploration-features.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {ExplorationInitStateNameService} from './services/exploration-init-state-name.service';
import {ExplorationLanguageCodeService} from './services/exploration-language-code.service';
import {ExplorationMetadataObjectFactory} from 'domain/exploration/ExplorationMetadataObjectFactory';
import {ExplorationNextContentIdIndexService} from './services/exploration-next-content-id-index.service';
import {ExplorationObjectiveService} from './services/exploration-objective.service';
import {ExplorationParamChangesService} from './services/exploration-param-changes.service';
import {ExplorationParamSpecsService} from './services/exploration-param-specs.service';
import {ExplorationPropertyService} from './services/exploration-property.service';
import {ExplorationRightsBackendApiService} from './services/exploration-rights-backend-api.service';
import {ExplorationRightsService} from './services/exploration-rights.service';
import {ExplorationSaveService} from './services/exploration-save.service';
import {ExplorationStatesService} from './services/exploration-states.service';
import {ExplorationTagsService} from './services/exploration-tags.service';
import {ExplorationTitleService} from './services/exploration-title.service';
import {ExplorationWarningsService} from './services/exploration-warnings.service';
import {ExternalRteSaveService} from 'services/external-rte-save.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {GraphDataService} from './services/graph-data.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {InteractionAttributesExtractorService} from 'interactions/interaction-attributes-extractor.service';
import {InteractionDetailsCacheService} from './editor-tab/services/interaction-details-cache.service';
import {InteractionRulesRegistryService} from 'services/interaction-rules-registry.service';
import {InternetConnectivityService} from 'services/internet-connectivity.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {LoaderService} from 'services/loader.service';
import {LocalStorageService} from 'services/local-storage.service';
import {ParameterMetadataService} from './services/parameter-metadata.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {PlayerPositionService} from 'pages/exploration-player-page/services/player-position.service';
import {PopulateRuleContentIdsService} from './services/populate-rule-content-ids.service';
import {ReadOnlyExplorationBackendApiService} from 'domain/exploration/read-only-exploration-backend-api.service';
import {ResponsesService} from './editor-tab/services/responses.service';
import {RouterService} from './services/router.service';
import {RteHelperService} from 'services/rte-helper.service';
import {SettingTabBackendApiService} from './services/setting-tab-backend-api.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {SkillBackendApiService} from 'domain/skill/skill-backend-api.service';
import {SolutionValidityService} from './editor-tab/services/solution-validity.service';
import {StateCardIsCheckpointService} from 'components/state-editor/state-editor-properties-services/state-card-is-checkpoint.service';
import {StateContentService} from 'components/state-editor/state-editor-properties-services/state-content.service';
import {StateCustomizationArgsService} from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import {StateEditorRefreshService} from './services/state-editor-refresh.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateHintsService} from 'components/state-editor/state-editor-properties-services/state-hints.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {StateLinkedSkillIdService} from 'components/state-editor/state-editor-properties-services/state-skill.service';
import {StateNameService} from 'components/state-editor/state-editor-properties-services/state-name.service';
import {StateParamChangesService} from 'components/state-editor/state-editor-properties-services/state-param-changes.service';
import {StateSolicitAnswerDetailsService} from 'components/state-editor/state-editor-properties-services/state-solicit-answer-details.service';
import {StateSolutionService} from 'components/state-editor/state-editor-properties-services/state-solution.service';
import {StateTutorialFirstTimeService} from './services/state-tutorial-first-time.service';
import {StatesObjectFactory} from 'domain/exploration/StatesObjectFactory';
import {TranslationLanguageService} from './translation-tab/services/translation-language.service';
import {TranslationStatusService} from './translation-tab/services/translation-status.service';
import {TranslationTabActiveModeService} from './translation-tab/services/translation-tab-active-mode.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UserEmailPreferencesService} from './services/user-email-preferences.service';
import {UserExplorationPermissionsService} from './services/user-exploration-permissions.service';
import {UserService} from 'services/user.service';
import {ValidatorsService} from 'services/validators.service';
import {VersionHistoryBackendApiService} from './services/version-history-backend-api.service';
import {VersionHistoryService} from './services/version-history.service';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {VoiceoverPlayerService} from 'pages/exploration-player-page/services/voiceover-player.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: ExplorationEditorPageRootComponent,
        canActivate: [ExplorationEditorPageAuthGuard],
      },
    ]),
    NgbModule,
    InteractionExtensionsModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatMenuModule,
    FormsModule,
    MatPaginatorModule,
    JoyrideModule.forRoot(),
    SharedComponentsModule,
    ExplorationPlayerViewerCommonModule,
    OppiaCkEditorCopyToolBarModule,
    ToastrModule.forRoot(toastrConfig),
  ],
  declarations: [
    DeleteStateSkillModalComponent,
    StateParamChangesEditorComponent,
    VoiceoverRemovalConfirmModalComponent,
    WelcomeModalComponent,
    StateDiffModalComponent,
    CreateFeedbackThreadModalComponent,
    DeleteExplorationModalComponent,
    RemoveRoleConfirmationModalComponent,
    ReassignRoleConfirmationModalComponent,
    ModeratorUnpublishExplorationModalComponent,
    TransferExplorationOwnershipModalComponent,
    HelpModalComponent,
    PreviewSetParametersModalComponent,
    CheckRevertExplorationModalComponent,
    RevertExplorationModalComponent,
    WelcomeTranslationModalComponent,
    DeleteAudioTranslationModalComponent,
    TranslationTabBusyModalComponent,
    ExplorationMetadataDiffModalComponent,
    EditorNavbarBreadcrumbComponent,
    ExplorationGraphModalComponent,
    ExplorationGraphComponent,
    StateNameEditorComponent,
    EditorNavigationComponent,
    TeachOppiaModalComponent,
    SettingsTabComponent,
    UnresolvedAnswersOverviewComponent,
    PreviewTabComponent,
    HistoryTabComponent,
    ExplorationEditorTabComponent,
    ExplorationSaveAndPublishButtonsComponent,
    ExplorationSavePromptModalComponent,
    FeedbackTabComponent,
    ImprovementsTabComponent,
    NeedsGuidingResponsesTaskComponent,
    PieChartComponent,
    StateStatsModalComponent,
    StatisticsTabComponent,
    AddAudioTranslationModalComponent,
    AudioTranslationBarComponent,
    VoiceoverCardComponent,
    StateTranslationEditorComponent,
    StateVersionHistoryModalComponent,
    MetadataVersionHistoryModalComponent,
    ValueGeneratorEditorComponent,
    ParamChangesEditorComponent,
    StateTranslationComponent,
    TranslatorOverviewComponent,
    StateTranslationStatusGraphComponent,
    TranslationTabComponent,
    ExplorationEditorPageComponent,
    StateVersionHistoryComponent,
    ExplorationEditorPageRootComponent,
  ],
  entryComponents: [
    DeleteStateSkillModalComponent,
    StateParamChangesEditorComponent,
    VoiceoverRemovalConfirmModalComponent,
    WelcomeModalComponent,
    StateDiffModalComponent,
    CreateFeedbackThreadModalComponent,
    DeleteExplorationModalComponent,
    RemoveRoleConfirmationModalComponent,
    ReassignRoleConfirmationModalComponent,
    ModeratorUnpublishExplorationModalComponent,
    TransferExplorationOwnershipModalComponent,
    HelpModalComponent,
    PreviewSetParametersModalComponent,
    CheckRevertExplorationModalComponent,
    RevertExplorationModalComponent,
    WelcomeTranslationModalComponent,
    DeleteAudioTranslationModalComponent,
    TranslationTabBusyModalComponent,
    ExplorationMetadataDiffModalComponent,
    EditorNavbarBreadcrumbComponent,
    ExplorationGraphModalComponent,
    ExplorationGraphComponent,
    StateNameEditorComponent,
    EditorNavigationComponent,
    TeachOppiaModalComponent,
    SettingsTabComponent,
    UnresolvedAnswersOverviewComponent,
    PreviewTabComponent,
    HistoryTabComponent,
    ExplorationEditorTabComponent,
    ExplorationSaveAndPublishButtonsComponent,
    ExplorationSavePromptModalComponent,
    FeedbackTabComponent,
    ImprovementsTabComponent,
    NeedsGuidingResponsesTaskComponent,
    PieChartComponent,
    StateStatsModalComponent,
    StatisticsTabComponent,
    AddAudioTranslationModalComponent,
    AudioTranslationBarComponent,
    VoiceoverCardComponent,
    StateTranslationEditorComponent,
    StateVersionHistoryModalComponent,
    MetadataVersionHistoryModalComponent,
    ValueGeneratorEditorComponent,
    ParamChangesEditorComponent,
    StateTranslationComponent,
    TranslatorOverviewComponent,
    StateTranslationStatusGraphComponent,
    TranslationTabComponent,
    ExplorationEditorPageComponent,
    StateVersionHistoryComponent,
    ExplorationEditorPageRootComponent,
  ],
  providers: [
    AlertsService,
    AnswerClassificationService,
    AssetsBackendApiService,
    AutosaveInfoModalsService,
    ChangeListService,
    ComputeGraphService,
    ContextService,
    CurrentInteractionService,
    EditorFirstTimeEventsService,
    EditabilityService,
    EditableExplorationBackendApiService,
    EntityTranslationsService,
    EntityVoiceoversService,
    EventBusService,
    ExplorationAutomaticTextToSpeechService,
    ExplorationCategoryService,
    ExplorationDataBackendApiService,
    ExplorationDataService,
    ExplorationEditsAllowedBackendApiService,
    ExplorationFeaturesService,
    ExplorationHtmlFormatterService,
    ExplorationInitStateNameService,
    ExplorationLanguageCodeService,
    ExplorationMetadataObjectFactory,
    ExplorationNextContentIdIndexService,
    ExplorationObjectiveService,
    ExplorationParamChangesService,
    ExplorationParamSpecsService,
    ExplorationPropertyService,
    ExplorationRightsBackendApiService,
    ExplorationRightsService,
    ExplorationSaveService,
    ExplorationStatesService,
    ExplorationTagsService,
    ExplorationTitleService,
    ExplorationWarningsService,
    ExternalRteSaveService,
    FocusManagerService,
    GenerateContentIdService,
    GraphDataService,
    ImageLocalStorageService,
    ImageUploadHelperService,
    InteractionAttributesExtractorService,
    InteractionDetailsCacheService,
    InteractionRulesRegistryService,
    InternetConnectivityService,
    JoyrideService,
    LanguageUtilService,
    LoaderService,
    LocalStorageService,
    LoggerService,
    ParameterMetadataService,
    PlatformFeatureService,
    PlayerPositionService,
    PopulateRuleContentIdsService,
    ReadOnlyExplorationBackendApiService,
    ResponsesService,
    RouterService,
    RteHelperService,
    SettingTabBackendApiService,
    SiteAnalyticsService,
    SkillBackendApiService,
    SolutionValidityService,
    StateCardIsCheckpointService,
    StateContentService,
    StateCustomizationArgsService,
    StateEditorRefreshService,
    StateEditorService,
    StateHintsService,
    StateInteractionIdService,
    StateLinkedSkillIdService,
    StateNameService,
    StateParamChangesService,
    StateSolicitAnswerDetailsService,
    StateSolutionService,
    StateTutorialFirstTimeService,
    StatesObjectFactory,
    TranslationLanguageService,
    TranslationStatusService,
    TranslationTabActiveModeService,
    UrlInterpolationService,
    UserEmailPreferencesService,
    UserExplorationPermissionsService,
    UserService,
    ValidatorsService,
    VersionHistoryBackendApiService,
    VersionHistoryService,
    VoiceoverBackendApiService,
    VoiceoverPlayerService,
    WindowDimensionsService,
  ],
})
export class ExplorationEditorPageModule {}
