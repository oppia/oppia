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

import {JoyrideModule} from 'ngx-joyride';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatMenuModule} from '@angular/material/menu';
import {SharedComponentsModule} from 'components/shared-component.module';
import {StateParamChangesEditorComponent} from './editor-tab/state-param-changes-editor/state-param-changes-editor.component';
import {DeleteStateSkillModalComponent} from './editor-tab/templates/modal-templates/delete-state-skill-modal.component';
import {InteractionExtensionsModule} from 'interactions/interactions.module';
import {SaveVersionMismatchModalComponent} from './modal-templates/save-version-mismatch-modal.component';
import {SaveValidationFailModalComponent} from './modal-templates/save-validation-fail-modal.component';
import {ChangesInHumanReadableFormComponent} from './changes-in-human-readable-form/changes-in-human-readable-form.component';
import {LostChangesModalComponent} from './modal-templates/lost-changes-modal.component';
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
import {ConfirmDeleteStateModalComponent} from './editor-tab/templates/modal-templates/confirm-delete-state-modal.component';
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
import {ModifyTranslationsModalComponent} from './modal-templates/exploration-modify-translations-modal.component';
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
    SaveVersionMismatchModalComponent,
    SaveValidationFailModalComponent,
    ChangesInHumanReadableFormComponent,
    VoiceoverRemovalConfirmModalComponent,
    LostChangesModalComponent,
    WelcomeModalComponent,
    StateDiffModalComponent,
    CreateFeedbackThreadModalComponent,
    DeleteExplorationModalComponent,
    RemoveRoleConfirmationModalComponent,
    ReassignRoleConfirmationModalComponent,
    ModeratorUnpublishExplorationModalComponent,
    TransferExplorationOwnershipModalComponent,
    HelpModalComponent,
    ConfirmDeleteStateModalComponent,
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
    ModifyTranslationsModalComponent,
    ExplorationEditorPageRootComponent,
  ],
  entryComponents: [
    DeleteStateSkillModalComponent,
    StateParamChangesEditorComponent,
    SaveVersionMismatchModalComponent,
    SaveValidationFailModalComponent,
    ChangesInHumanReadableFormComponent,
    VoiceoverRemovalConfirmModalComponent,
    LostChangesModalComponent,
    WelcomeModalComponent,
    StateDiffModalComponent,
    CreateFeedbackThreadModalComponent,
    DeleteExplorationModalComponent,
    RemoveRoleConfirmationModalComponent,
    ReassignRoleConfirmationModalComponent,
    ModeratorUnpublishExplorationModalComponent,
    TransferExplorationOwnershipModalComponent,
    HelpModalComponent,
    ConfirmDeleteStateModalComponent,
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
    ModifyTranslationsModalComponent,
    ExplorationEditorPageRootComponent,
  ],
})
export class ExplorationEditorPageModule {}
