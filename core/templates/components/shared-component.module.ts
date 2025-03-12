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
 * @fileoverview Module for the shared components.
 */
import 'core-js/es7/reflect';
import 'zone.js';

// Modules.
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {AngularFireModule} from '@angular/fire';
import {
  AngularFireAuth,
  AngularFireAuthModule,
  USE_EMULATOR,
} from '@angular/fire/auth';
import {CustomFormsComponentsModule} from './forms/custom-forms-directives/custom-form-components.module';
import {DynamicContentModule} from './interaction-display/dynamic-content.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MaterialModule} from 'modules/material.module';
import {ObjectComponentsModule} from 'objects/object-components.module';
import {SharedFormsModule} from './forms/shared-forms.module';
import {RecommendationsModule} from './recommendations/recommendations.module';
import {CommonElementsModule} from './common-layout-directives/common-elements/common-elements.module';
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';
import {CodeMirrorModule} from './code-mirror/codemirror.module';
import {OppiaCkEditor4Module} from './ck-editor-helpers/ckeditor4.module';
import {BaseModule} from 'base-components/base.module';
import {NgBootstrapModule} from 'modules/ng-boostrap.module';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {DragDropModule} from '@angular/cdk/drag-drop';

// Components.
import {AudioBarComponent} from 'pages/exploration-player-page/layout-directives/audio-bar.component';
import {DeleteAnswerGroupModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-answer-group-modal.component';
import {ExplorationEmbedButtonModalComponent} from './button-directives/exploration-embed-button-modal.component';
import {CheckpointCelebrationModalComponent} from './checkpoint-celebration-modal/checkpoint-celebration-modal.component';
import {BackgroundBannerModule} from './common-layout-directives/common-elements/background-banner.module';
import {AttributionGuideComponent} from './common-layout-directives/common-elements/attribution-guide.component';
import {LazyLoadingComponent} from './common-layout-directives/common-elements/lazy-loading.component';
import {KeyboardShortcutHelpModalComponent} from 'components/keyboard-shortcut-help/keyboard-shortcut-help-modal.component';
import {StateSkillEditorComponent} from 'components/state-editor/state-skill-editor/state-skill-editor.component';
import {SelectSkillModalComponent} from './skill-selector/select-skill-modal.component';
import {SharingLinksComponent} from './common-layout-directives/common-elements/sharing-links.component';
import {SkillSelectorComponent} from './skill-selector/skill-selector.component';
import {ProfileLinkImageComponent} from 'components/profile-link-directives/profile-link-image.component';
import {ProfileLinkTextComponent} from 'components/profile-link-directives/profile-link-text.component';
import {AudioFileUploaderComponent} from './forms/custom-forms-directives/audio-file-uploader.component';
import {ThumbnailDisplayComponent} from './forms/custom-forms-directives/thumbnail-display.component';
import {SkillMasteryViewerComponent} from './skill-mastery/skill-mastery.component';
import {ExplorationSummaryTileComponent} from './summary-tile/exploration-summary-tile.component';
import {PracticeTabComponent} from 'pages/topic-viewer-page/practice-tab/practice-tab.component';
import {CollectionSummaryTileComponent} from './summary-tile/collection-summary-tile.component';
import {TakeBreakModalComponent} from 'pages/exploration-player-page/templates/take-break-modal.component';
import {TopicsAndSkillsDashboardNavbarBreadcrumbComponent} from 'pages/topics-and-skills-dashboard-page/navbar/topics-and-skills-dashboard-navbar-breadcrumb.component';
import {ThreadTableComponent} from 'pages/exploration-editor-page/feedback-tab/thread-table/thread-table.component';
import {SummaryListHeaderComponent} from './state-directives/answer-group-editor/summary-list-header.component';
import {LearnerDashboardIconsComponent} from 'pages/learner-dashboard-page/learner-dashboard-icons.component';
import {OutcomeEditorComponent} from './state-directives/outcome-editor/outcome-editor.component';
import {OutcomeFeedbackEditorComponent} from './state-directives/outcome-editor/outcome-feedback-editor.component';
import {OnScreenKeyboardComponent} from './on-screen-keyboard/on-screen-keyboard.component';
import {RubricsEditorComponent} from './rubrics-editor/rubrics-editor.component';
import {CreateNewSkillModalComponent} from 'pages/topics-and-skills-dashboard-page/modals/create-new-skill-modal.component';
import {CreateActivityModalComponent} from 'pages/creator-dashboard-page/modal-templates/create-activity-modal.component';
import {UploadActivityModalComponent} from 'pages/creator-dashboard-page/modal-templates/upload-activity-modal.component';
import {ThumbnailUploaderComponent} from './forms/custom-forms-directives/thumbnail-uploader.component';
import {EditThumbnailModalComponent} from './forms/custom-forms-directives/edit-thumbnail-modal.component';
import {CorrectnessFooterComponent} from 'pages/exploration-player-page/layout-directives/correctness-footer.component';
import {ContinueButtonComponent} from 'pages/exploration-player-page/learner-experience/continue-button.component';
import {DeleteInteractionModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-interaction-modal.component';
import {DeleteHintModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-hint-modal.component';
import {DeleteLastHintModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-last-hint-modal.component';
import {DeleteSolutionModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-solution-modal.component';
import {ProgressNavComponent} from 'pages/exploration-player-page/layout-directives/progress-nav.component';
import {QuestionDifficultySelectorComponent} from './question-difficulty-selector/question-difficulty-selector.component';
import {PreviewThumbnailComponent} from 'pages/topic-editor-page/modal-templates/preview-thumbnail.component';
import {InputResponsePairComponent} from 'pages/exploration-player-page/learner-experience/input-response-pair.component';
import {ImageUploaderComponent} from './forms/custom-forms-directives/image-uploader.component';
import {ImageUploaderModalComponent} from './forms/custom-forms-directives/image-uploader-modal.component';
import {StorySummaryTileComponent} from './summary-tile/story-summary-tile.component';
import {ExplorationFooterComponent} from 'pages/exploration-player-page/layout-directives/exploration-footer.component';
import {DisplaySolutionModalComponent} from 'pages/exploration-player-page/modals/display-solution-modal.component';
import {DisplaySolutionInterstititalModalComponent} from 'pages/exploration-player-page/modals/display-solution-interstitial-modal.component';
import {DisplayHintModalComponent} from 'pages/exploration-player-page/modals/display-hint-modal.component';
import {HintAndSolutionButtonsComponent} from './button-directives/hint-and-solution-buttons.component';
import {SearchBarModule} from 'pages/library-page/search-bar/search-bar.module';
import {SubtopicSummaryTileComponent} from './summary-tile/subtopic-summary-tile.component';
import {FilteredChoicesFieldComponent} from './filter-fields/filtered-choices-field/filtered-choices-field.component';
import {MultiSelectionFieldComponent} from './filter-fields/multi-selection-field/multi-selection-field.component';
import {ConceptCardComponent} from './concept-card/concept-card.component';
import {ScoreRingComponent} from './score-ring/score-ring.component';
import {CompletionGraphComponent} from './statistics-directives/completion-graph.component';
import {TutorCardComponent} from 'pages/exploration-player-page/learner-experience/tutor-card.component';
import {ContentLanguageSelectorComponent} from 'pages/exploration-player-page/layout-directives/content-language-selector.component';
import {RatingDisplayComponent} from './ratings/rating-display/rating-display.component';
import {SupplementalCardComponent} from 'pages/exploration-player-page/learner-experience/supplemental-card.component';
import {AddOrUpdateSolutionModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-or-update-solution-modal.component';
import {SavePendingChangesModalComponent} from './save-pending-changes/save-pending-changes-modal.component';
import {AddHintModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-hint-modal.component';
import {QuestionMisconceptionSelectorComponent} from './question-directives/question-misconception-selector/question-misconception-selector.component';
import {ConversationSkinComponent} from 'pages/exploration-player-page/learner-experience/conversation-skin.component';
import {EndChapterCheckMarkComponent} from 'pages/exploration-player-page/learner-experience/end-chapter-check-mark.component';
import {EndChapterConfettiComponent} from 'pages/exploration-player-page/learner-experience/end-chapter-confetti.component';
import {RatingsAndRecommendationsComponent} from 'pages/exploration-player-page/learner-experience/ratings-and-recommendations.component';
import {LearnerAnswerInfoCard} from 'pages/exploration-player-page/learner-experience/learner-answer-info-card.component';
import {FeedbackPopupComponent} from 'pages/exploration-player-page/layout-directives/feedback-popup.component';
import {ConfirmQuestionExitModalComponent} from './question-directives/modal-templates/confirm-question-exit-modal.component';
import {QuestionsOpportunitiesSelectDifficultyModalComponent} from 'pages/topic-editor-page/modal-templates/questions-opportunities-select-difficulty-modal.component';
import {QuestionsListSelectSkillAndDifficultyModalComponent} from 'pages/topic-editor-page/modal-templates/questions-list-select-skill-and-difficulty-modal.component';
import {QuestionEditorSaveModalComponent} from './question-directives/modal-templates/question-editor-save-modal.component';
import {HintEditorComponent} from 'components/state-directives/hint-editor/hint-editor.component';
import {ResponseHeaderComponent} from './state-directives/response-header/response-header.component';
import {StateContentEditorComponent} from './state-editor/state-content-editor/state-content-editor.component';
import {StateHintsEditorComponent} from 'components/state-editor/state-hints-editor/state-hints-editor.component';
import {ReviewMaterialEditorComponent} from './review-material-editor/review-material-editor.component';
import {ConfirmLeaveModalComponent} from 'pages/exploration-editor-page/modal-templates/confirm-leave-modal.component';
import {CustomizeInteractionModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/customize-interaction-modal.component';
import {TagMisconceptionModalComponent} from './question-directives/question-misconception-editor/tag-misconception-modal-component';
import {QuestionMisconceptionEditorComponent} from './question-directives/question-misconception-editor/question-misconception-editor.component';
import {SolutionExplanationEditor} from './state-directives/solution-editor/solution-explanation-editor.component';
import {SolutionEditor} from './state-directives/solution-editor/solution-editor.component';
import {OutcomeDestinationEditorComponent} from './state-directives/outcome-editor/outcome-destination-editor.component';
import {OutcomeIfStuckDestinationEditorComponent} from './state-directives/outcome-editor/outcome-if-stuck-destination-editor.component';
import {StateSolutionEditorComponent} from './state-editor/state-solution-editor/state-solution-editor.component';
import {StateInteractionEditorComponent} from './state-editor/state-interaction-editor/state-interaction-editor.component';
import {TrainingPanelComponent} from 'pages/exploration-editor-page/editor-tab/training-panel/training-panel.component';
import {TrainingModalComponent} from 'pages/exploration-editor-page/editor-tab/training-panel/training-modal.component';
import {TrainingDataEditorPanelComponent} from 'pages/exploration-editor-page/editor-tab/training-panel/training-data-editor-panel-modal.component';
import {TestInteractionPanel} from 'pages/exploration-editor-page/editor-tab/test-interaction-panel/test-interaction-panel.component';
import {RuleEditorComponent} from './state-directives/rule-editor/rule-editor.component';
import {HtmlSelectComponent} from './forms/custom-forms-directives/html-select.component';
import {RuleTypeSelector} from './state-directives/rule-editor/rule-type-selector.directive';
import {AddAnswerGroupModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-answer-group-modal.component';
import {AnswerGroupEditor} from './state-directives/answer-group-editor/answer-group-editor.component';
import {StateResponsesComponent} from './state-editor/state-responses-editor/state-responses.component';
import {StateEditorComponent} from './state-editor/state-editor.component';
import {QuestionEditorComponent} from './question-directives/question-editor/question-editor.component';
import {QuestionPlayerConceptCardModalComponent} from './question-directives/question-player/question-player-concept-card-modal.component';
import {QuestionPlayerComponent} from './question-directives/question-player/question-player.component';
import {QuestionsListComponent} from './question-directives/questions-list/questions-list.component';
import {RemoveQuestionSkillLinkModalComponent} from './question-directives/modal-templates/remove-question-skill-link-modal.component';
import {SkillMasteryModalComponent} from './question-directives/question-player/skill-mastery-modal.component';
import {StateGraphVisualization} from 'pages/exploration-editor-page/editor-tab/graph-directives/state-graph-visualization.component';
import {VersionDiffVisualizationComponent} from './version-diff-visualization/version-diff-visualization.component';
import {QuestionSuggestionEditorModalComponent} from 'pages/contributor-dashboard-page/modal-templates/question-suggestion-editor-modal.component';
import {QuestionSuggestionReviewModalComponent} from 'pages/contributor-dashboard-page/modal-templates/question-suggestion-review-modal.component';
import {ReviewTestPageComponent} from 'pages/review-test-page/review-test-page.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {AddOutcomeModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-outcome-modal.component';
import {AnswerContentModalComponent} from './common-layout-directives/common-elements/answer-content-modal.component';
import {VisualizationSortedTilesComponent} from 'visualizations/oppia-visualization-sorted-tiles.component';
import {OppiaVisualizationClickHexbinsComponent} from 'visualizations/oppia-visualization-click-hexbins.directive';
import {OppiaVisualizationFrequencyTableComponent} from 'visualizations/oppia-visualization-frequency-table.directive';
import {OppiaVisualizationEnumeratedFrequencyTableComponent} from 'visualizations/oppia-visualization-enumerated-frequency-table.directive';
import {RandomSelectorComponent} from 'value_generators/templates/random-selector.component';
import {CopierComponent} from 'value_generators/templates/copier.component';
import {UndoSnackbarComponent} from './custom-snackbar/undo-snackbar.component';
import {TranslationModalComponent} from 'pages/contributor-dashboard-page/modal-templates/translation-modal.component';
import {OppiaCkEditorCopyToolBarModule} from 'components/ck-editor-helpers/ck-editor-copy-toolbar/ck-editor-copy-toolbar.module';
import {FullExpandAccordionComponent} from 'pages/about-page/accordion/full-expand-accordion.component';
import {ExplorationSaveModalComponent} from 'pages/exploration-editor-page/modal-templates/exploration-save-modal.component';
import {ConfirmDiscardChangesModalComponent} from 'pages/exploration-editor-page/modal-templates/confirm-discard-changes-modal.component';
import {EditorReloadingModalComponent} from 'pages/exploration-editor-page/modal-templates/editor-reloading-modal.component';
import {ExplorationMetadataModalComponent} from 'pages/exploration-editor-page/modal-templates/exploration-metadata-modal.component';
import {ExplorationPublishModalComponent} from 'pages/exploration-editor-page/modal-templates/exploration-publish-modal.component';
import {PostPublishModalComponent} from 'pages/exploration-editor-page/modal-templates/post-publish-modal.component';
import {ExplorationObjectiveEditorComponent} from 'pages/exploration-editor-page/exploration-objective-editor/exploration-objective-editor.component';
import {ExplorationTitleEditorComponent} from 'pages/exploration-editor-page/exploration-title-editor/exploration-title-editor.component';

// Pipes.
import {StringUtilityPipesModule} from 'filters/string-utility-filters/string-utility-pipes.module';
import {SummarizeNonnegativeNumberPipe} from 'filters/summarize-nonnegative-number.pipe';

// Services.
import {AuthService} from 'services/auth.service';

// Miscellaneous.
import {JoyrideModule} from 'ngx-joyride';
import {SmartRouterModule} from 'hybrid-router-module-provider';
import {StaleTabInfoModalComponent} from './stale-tab-info/stale-tab-info-modal.component';
import {UnsavedChangesStatusInfoModalComponent} from './unsaved-changes-status-info/unsaved-changes-status-info-modal.component';
import {NgbModalModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
import {ComponentOverviewComponent} from './copy-url/copy-url.component';
import {MatMenuModule} from '@angular/material/menu';
import {DynamicComponentModule} from 'value_generators/templates/dynamic-component.module';
import {ThanksForDonatingModalComponent} from 'pages/donate-page/thanks-for-donating-modal.component';
import {DonationBoxComponent} from 'pages/donate-page/donation-box/donation-box.component';
import {DonationBoxModalComponent} from 'pages/donate-page/donation-box/donation-box-modal.component';
import {RteHelperModalComponent} from 'services/rte-helper-modal.component';
import {DirectivesModule} from 'directives/directives.module';
import {UrlFragmentEditorComponent} from './url-fragment-editor/url-fragment-editor.component';
import {PreviewSummaryTileModalComponent} from 'pages/exploration-editor-page/settings-tab/templates/preview-summary-tile-modal.component';
import {LostChangesModalComponent} from 'pages/exploration-editor-page/modal-templates/lost-changes-modal.component';
import {ChangesInHumanReadableFormComponent} from 'pages/exploration-editor-page/changes-in-human-readable-form/changes-in-human-readable-form.component';
import {SaveVersionMismatchModalComponent} from 'pages/exploration-editor-page/modal-templates/save-version-mismatch-modal.component';
import {ConfirmDeleteStateModalComponent} from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/confirm-delete-state-modal.component';
import {SaveValidationFailModalComponent} from 'pages/exploration-editor-page/modal-templates/save-validation-fail-modal.component';
import {ModifyTranslationsModalComponent} from 'pages/exploration-editor-page/modal-templates/exploration-modify-translations-modal.component';
@NgModule({
  imports: [
    BackgroundBannerModule,
    BaseModule,
    CommonModule,
    DragDropModule,
    MatMenuModule,
    CustomFormsComponentsModule,
    CommonElementsModule,
    CodeMirrorModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    SmartRouterModule,
    MaterialModule,
    NgBootstrapModule,
    DynamicContentModule,
    FormsModule,
    ReactiveFormsModule,
    RichTextComponentsModule,
    ObjectComponentsModule,
    OppiaCkEditor4Module,
    OppiaCkEditorCopyToolBarModule,
    RichTextComponentsModule,
    SearchBarModule,
    SharedFormsModule,
    JoyrideModule.forRoot(),
    RecommendationsModule,
    StringUtilityPipesModule,
    AngularFireModule.initializeApp(AuthService.firebaseConfig),
    AngularFireAuthModule,
    MatProgressSpinnerModule,
    NgbModalModule,
    TranslateModule,
    DynamicComponentModule,
    DirectivesModule,
    NgbModule,
  ],

  providers: [
    AngularFireAuth,
    {
      provide: USE_EMULATOR,
      useValue: AuthService.firebaseEmulatorConfig,
    },
  ],

  declarations: [
    AudioBarComponent,
    AudioFileUploaderComponent,
    AttributionGuideComponent,
    CompletionGraphComponent,
    CorrectnessFooterComponent,
    ConfirmLeaveModalComponent,
    ConfirmQuestionExitModalComponent,
    ContinueButtonComponent,
    ContentLanguageSelectorComponent,
    ConversationSkinComponent,
    EndChapterCheckMarkComponent,
    EndChapterConfettiComponent,
    CreateNewSkillModalComponent,
    CreateActivityModalComponent,
    CustomizeInteractionModalComponent,
    DeleteAnswerGroupModalComponent,
    DeleteHintModalComponent,
    DeleteInteractionModalComponent,
    DeleteLastHintModalComponent,
    DeleteSolutionModalComponent,
    DisplaySolutionModalComponent,
    DisplaySolutionInterstititalModalComponent,
    DisplayHintModalComponent,
    ExplorationFooterComponent,
    ExplorationSummaryTileComponent,
    FilteredChoicesFieldComponent,
    FeedbackPopupComponent,
    PracticeTabComponent,
    CollectionSummaryTileComponent,
    ExplorationEmbedButtonModalComponent,
    CheckpointCelebrationModalComponent,
    HintAndSolutionButtonsComponent,
    HintEditorComponent,
    InputResponsePairComponent,
    ImageUploaderComponent,
    ImageUploaderModalComponent,
    KeyboardShortcutHelpModalComponent,
    LearnerAnswerInfoCard,
    LazyLoadingComponent,
    MultiSelectionFieldComponent,
    OnScreenKeyboardComponent,
    OutcomeDestinationEditorComponent,
    OutcomeIfStuckDestinationEditorComponent,
    OutcomeEditorComponent,
    OutcomeFeedbackEditorComponent,
    ProfileLinkImageComponent,
    ProfileLinkTextComponent,
    ProgressNavComponent,
    QuestionDifficultySelectorComponent,
    QuestionEditorSaveModalComponent,
    RatingDisplayComponent,
    RatingsAndRecommendationsComponent,
    ResponseHeaderComponent,
    RubricsEditorComponent,
    ScoreRingComponent,
    SelectSkillModalComponent,
    SharingLinksComponent,
    SkillSelectorComponent,
    SkillMasteryViewerComponent,
    StateContentEditorComponent,
    StateHintsEditorComponent,
    StateSkillEditorComponent,
    StorySummaryTileComponent,
    SubtopicSummaryTileComponent,
    SummaryListHeaderComponent,
    TakeBreakModalComponent,
    ThumbnailUploaderComponent,
    EditThumbnailModalComponent,
    SupplementalCardComponent,
    ThanksForDonatingModalComponent,
    DonationBoxComponent,
    DonationBoxModalComponent,
    ThumbnailDisplayComponent,
    ThreadTableComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    TutorCardComponent,
    SummarizeNonnegativeNumberPipe,
    UploadActivityModalComponent,
    LearnerDashboardIconsComponent,
    PreviewThumbnailComponent,
    AddOrUpdateSolutionModalComponent,
    QuestionMisconceptionSelectorComponent,
    QuestionsOpportunitiesSelectDifficultyModalComponent,
    QuestionsListSelectSkillAndDifficultyModalComponent,
    DeleteInteractionModalComponent,
    DeleteHintModalComponent,
    DeleteLastHintModalComponent,
    DeleteSolutionModalComponent,
    SavePendingChangesModalComponent,
    AddHintModalComponent,
    AddOutcomeModalComponent,
    ReviewMaterialEditorComponent,
    TagMisconceptionModalComponent,
    QuestionMisconceptionEditorComponent,
    SolutionEditor,
    SolutionExplanationEditor,
    StateSolutionEditorComponent,
    StateInteractionEditorComponent,
    StaleTabInfoModalComponent,
    UnsavedChangesStatusInfoModalComponent,
    TrainingPanelComponent,
    TrainingModalComponent,
    TrainingDataEditorPanelComponent,
    TestInteractionPanel,
    RuleEditorComponent,
    HtmlSelectComponent,
    RuleTypeSelector,
    AddAnswerGroupModalComponent,
    AnswerGroupEditor,
    StateResponsesComponent,
    StateEditorComponent,
    QuestionEditorComponent,
    QuestionPlayerConceptCardModalComponent,
    QuestionPlayerComponent,
    QuestionsListComponent,
    RemoveQuestionSkillLinkModalComponent,
    SkillMasteryModalComponent,
    StateGraphVisualization,
    VersionDiffVisualizationComponent,
    QuestionSuggestionEditorModalComponent,
    QuestionSuggestionReviewModalComponent,
    AnswerContentModalComponent,
    OppiaVisualizationClickHexbinsComponent,
    OppiaVisualizationEnumeratedFrequencyTableComponent,
    OppiaVisualizationFrequencyTableComponent,
    ReviewTestPageComponent,
    ComponentOverviewComponent,
    VisualizationSortedTilesComponent,
    RteHelperModalComponent,
    UndoSnackbarComponent,
    TranslationModalComponent,
    FullExpandAccordionComponent,
    UrlFragmentEditorComponent,
    ExplorationSaveModalComponent,
    ConfirmDiscardChangesModalComponent,
    EditorReloadingModalComponent,
    ExplorationMetadataModalComponent,
    ExplorationPublishModalComponent,
    PostPublishModalComponent,
    ExplorationTitleEditorComponent,
    ExplorationObjectiveEditorComponent,
    PreviewSummaryTileModalComponent,
    LostChangesModalComponent,
    ChangesInHumanReadableFormComponent,
    SaveVersionMismatchModalComponent,
    ConfirmDeleteStateModalComponent,
    SaveValidationFailModalComponent,
    ModifyTranslationsModalComponent,
  ],

  entryComponents: [
    AudioBarComponent,
    AudioFileUploaderComponent,
    CompletionGraphComponent,
    CorrectnessFooterComponent,
    ConfirmLeaveModalComponent,
    ConfirmQuestionExitModalComponent,
    ContinueButtonComponent,
    ConceptCardComponent,
    ContentLanguageSelectorComponent,
    ConversationSkinComponent,
    EndChapterCheckMarkComponent,
    EndChapterConfettiComponent,
    CreateNewSkillModalComponent,
    CreateActivityModalComponent,
    CustomizeInteractionModalComponent,
    DeleteHintModalComponent,
    DeleteInteractionModalComponent,
    DeleteLastHintModalComponent,
    DeleteSolutionModalComponent,
    ExplorationFooterComponent,
    ExplorationSummaryTileComponent,
    FilteredChoicesFieldComponent,
    FeedbackPopupComponent,
    MultiSelectionFieldComponent,
    PracticeTabComponent,
    QuestionEditorSaveModalComponent,
    CollectionSummaryTileComponent,
    SharingLinksComponent,
    SkillMasteryViewerComponent,
    AttributionGuideComponent,
    LazyLoadingComponent,
    OnScreenKeyboardComponent,
    ProfileLinkImageComponent,
    ProfileLinkTextComponent,
    // These elements will remain here even after migration.
    DeleteAnswerGroupModalComponent,
    DisplaySolutionModalComponent,
    DisplaySolutionInterstititalModalComponent,
    DisplayHintModalComponent,
    SelectSkillModalComponent,
    SkillSelectorComponent,
    TakeBreakModalComponent,
    StateSkillEditorComponent,
    ExplorationEmbedButtonModalComponent,
    CheckpointCelebrationModalComponent,
    LearnerAnswerInfoCard,
    OutcomeDestinationEditorComponent,
    OutcomeIfStuckDestinationEditorComponent,
    OutcomeEditorComponent,
    OutcomeFeedbackEditorComponent,
    AddOutcomeModalComponent,
    HintAndSolutionButtonsComponent,
    HintEditorComponent,
    InputResponsePairComponent,
    ImageUploaderComponent,
    ImageUploaderModalComponent,
    KeyboardShortcutHelpModalComponent,
    ProgressNavComponent,
    PreviewThumbnailComponent,
    QuestionDifficultySelectorComponent,
    RatingDisplayComponent,
    RatingsAndRecommendationsComponent,
    ResponseHeaderComponent,
    RubricsEditorComponent,
    StateContentEditorComponent,
    StateHintsEditorComponent,
    ScoreRingComponent,
    StorySummaryTileComponent,
    SubtopicSummaryTileComponent,
    SummaryListHeaderComponent,
    SupplementalCardComponent,
    ThanksForDonatingModalComponent,
    DonationBoxComponent,
    DonationBoxModalComponent,
    ThumbnailDisplayComponent,
    TutorCardComponent,
    ThumbnailUploaderComponent,
    EditThumbnailModalComponent,
    UploadActivityModalComponent,
    ThreadTableComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    TagMisconceptionModalComponent,
    LearnerDashboardIconsComponent,
    PreviewThumbnailComponent,
    AddOrUpdateSolutionModalComponent,
    AddHintModalComponent,
    QuestionMisconceptionSelectorComponent,
    QuestionsOpportunitiesSelectDifficultyModalComponent,
    QuestionsListSelectSkillAndDifficultyModalComponent,
    DeleteInteractionModalComponent,
    DeleteHintModalComponent,
    DeleteLastHintModalComponent,
    DeleteSolutionModalComponent,
    SavePendingChangesModalComponent,
    QuestionMisconceptionEditorComponent,
    SolutionEditor,
    SolutionExplanationEditor,
    StateSolutionEditorComponent,
    StateInteractionEditorComponent,
    StaleTabInfoModalComponent,
    UnsavedChangesStatusInfoModalComponent,
    TrainingPanelComponent,
    TrainingModalComponent,
    TrainingDataEditorPanelComponent,
    TestInteractionPanel,
    RuleEditorComponent,
    HtmlSelectComponent,
    RuleTypeSelector,
    AddAnswerGroupModalComponent,
    AnswerGroupEditor,
    StateResponsesComponent,
    StateEditorComponent,
    QuestionEditorComponent,
    QuestionPlayerConceptCardModalComponent,
    QuestionPlayerComponent,
    QuestionsListComponent,
    RemoveQuestionSkillLinkModalComponent,
    SkillMasteryModalComponent,
    StateGraphVisualization,
    VersionDiffVisualizationComponent,
    QuestionSuggestionEditorModalComponent,
    QuestionSuggestionReviewModalComponent,
    AnswerContentModalComponent,
    OppiaVisualizationClickHexbinsComponent,
    OppiaVisualizationEnumeratedFrequencyTableComponent,
    OppiaVisualizationFrequencyTableComponent,
    ReviewTestPageComponent,
    ComponentOverviewComponent,
    VisualizationSortedTilesComponent,
    CopierComponent,
    RandomSelectorComponent,
    RteHelperModalComponent,
    UndoSnackbarComponent,
    TranslationModalComponent,
    FullExpandAccordionComponent,
    UrlFragmentEditorComponent,
    ExplorationSaveModalComponent,
    ConfirmDiscardChangesModalComponent,
    EditorReloadingModalComponent,
    ExplorationMetadataModalComponent,
    ExplorationPublishModalComponent,
    PostPublishModalComponent,
    ExplorationTitleEditorComponent,
    ExplorationObjectiveEditorComponent,
    PreviewSummaryTileModalComponent,
    LostChangesModalComponent,
    ChangesInHumanReadableFormComponent,
    SaveVersionMismatchModalComponent,
    ConfirmDeleteStateModalComponent,
    SaveValidationFailModalComponent,
    ModifyTranslationsModalComponent,
  ],

  exports: [
    // Modules.
    BackgroundBannerModule,
    BaseModule,
    CommonElementsModule,
    CodeMirrorModule,
    DragDropModule,
    DynamicContentModule,
    FormsModule,
    MaterialModule,
    NgBootstrapModule,
    RichTextComponentsModule,
    ObjectComponentsModule,
    OppiaCkEditor4Module,
    OppiaCkEditorCopyToolBarModule,
    SearchBarModule,
    SharedFormsModule,
    StringUtilityPipesModule,
    // Components, directives, and pipes.
    AttributionGuideComponent,
    AudioBarComponent,
    AudioFileUploaderComponent,
    CompletionGraphComponent,
    CorrectnessFooterComponent,
    ConfirmLeaveModalComponent,
    ConfirmQuestionExitModalComponent,
    ContinueButtonComponent,
    ContentLanguageSelectorComponent,
    ConversationSkinComponent,
    EndChapterCheckMarkComponent,
    EndChapterConfettiComponent,
    CreateNewSkillModalComponent,
    CreateActivityModalComponent,
    CustomizeInteractionModalComponent,
    DeleteAnswerGroupModalComponent,
    DeleteHintModalComponent,
    DeleteInteractionModalComponent,
    DeleteLastHintModalComponent,
    DeleteSolutionModalComponent,
    DisplaySolutionModalComponent,
    DisplaySolutionInterstititalModalComponent,
    DisplayHintModalComponent,
    ExplorationFooterComponent,
    ExplorationSummaryTileComponent,
    FeedbackPopupComponent,
    CheckpointCelebrationModalComponent,
    LearnerAnswerInfoCard,
    MultiSelectionFieldComponent,
    FilteredChoicesFieldComponent,
    PracticeTabComponent,
    CollectionSummaryTileComponent,
    HintAndSolutionButtonsComponent,
    HintEditorComponent,
    InputResponsePairComponent,
    ImageUploaderComponent,
    ImageUploaderModalComponent,
    LazyLoadingComponent,
    ProfileLinkImageComponent,
    ProfileLinkTextComponent,
    PreviewThumbnailComponent,
    RatingDisplayComponent,
    RatingsAndRecommendationsComponent,
    ResponseHeaderComponent,
    RubricsEditorComponent,
    OnScreenKeyboardComponent,
    OutcomeDestinationEditorComponent,
    OutcomeIfStuckDestinationEditorComponent,
    OutcomeEditorComponent,
    OutcomeFeedbackEditorComponent,
    ProgressNavComponent,
    StateContentEditorComponent,
    StateHintsEditorComponent,
    QuestionDifficultySelectorComponent,
    QuestionEditorSaveModalComponent,
    ScoreRingComponent,
    StateSkillEditorComponent,
    SelectSkillModalComponent,
    SharingLinksComponent,
    SkillSelectorComponent,
    StorySummaryTileComponent,
    SubtopicSummaryTileComponent,
    SummaryListHeaderComponent,
    SupplementalCardComponent,
    TakeBreakModalComponent,
    ThreadTableComponent,
    ThanksForDonatingModalComponent,
    DonationBoxComponent,
    DonationBoxModalComponent,
    ThumbnailDisplayComponent,
    ThumbnailUploaderComponent,
    EditThumbnailModalComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    TutorCardComponent,
    UploadActivityModalComponent,
    SummarizeNonnegativeNumberPipe,
    SavePendingChangesModalComponent,
    LearnerDashboardIconsComponent,
    AddOrUpdateSolutionModalComponent,
    AddOutcomeModalComponent,
    QuestionMisconceptionSelectorComponent,
    QuestionsOpportunitiesSelectDifficultyModalComponent,
    QuestionsListSelectSkillAndDifficultyModalComponent,
    DeleteInteractionModalComponent,
    DeleteHintModalComponent,
    DeleteLastHintModalComponent,
    DeleteSolutionModalComponent,
    ReviewMaterialEditorComponent,
    TagMisconceptionModalComponent,
    QuestionMisconceptionEditorComponent,
    SolutionEditor,
    SolutionExplanationEditor,
    StateSolutionEditorComponent,
    StateInteractionEditorComponent,
    TrainingPanelComponent,
    TrainingModalComponent,
    TrainingDataEditorPanelComponent,
    TestInteractionPanel,
    RuleEditorComponent,
    HtmlSelectComponent,
    RuleTypeSelector,
    AddAnswerGroupModalComponent,
    AnswerGroupEditor,
    StateResponsesComponent,
    StateEditorComponent,
    QuestionEditorComponent,
    QuestionPlayerConceptCardModalComponent,
    QuestionPlayerComponent,
    QuestionsListComponent,
    RemoveQuestionSkillLinkModalComponent,
    SkillMasteryModalComponent,
    StateGraphVisualization,
    VersionDiffVisualizationComponent,
    QuestionSuggestionEditorModalComponent,
    QuestionSuggestionReviewModalComponent,
    AnswerContentModalComponent,
    OppiaVisualizationClickHexbinsComponent,
    OppiaVisualizationEnumeratedFrequencyTableComponent,
    OppiaVisualizationFrequencyTableComponent,
    ReviewTestPageComponent,
    ComponentOverviewComponent,
    TranslateModule,
    VisualizationSortedTilesComponent,
    RteHelperModalComponent,
    UndoSnackbarComponent,
    TranslationModalComponent,
    FullExpandAccordionComponent,
    UrlFragmentEditorComponent,
    ExplorationTitleEditorComponent,
    ExplorationObjectiveEditorComponent,
  ],
})
export class SharedComponentsModule {}
