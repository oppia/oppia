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
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuth, AngularFireAuthModule, USE_EMULATOR } from '@angular/fire/auth';
import { CustomFormsComponentsModule } from './forms/custom-forms-directives/custom-form-components.module';
import { DynamicContentModule } from './angular-html-bind/dynamic-content.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../modules/material.module';
import { ObjectComponentsModule } from 'objects/object-components.module';
import { SharedFormsModule } from './forms/shared-forms.module';
import { CommonElementsModule } from './common-layout-directives/common-elements/common-elements.module';
import { RichTextComponentsModule } from 'rich_text_components/rich-text-components.module';
import { CodeMirrorModule } from './code-mirror/codemirror.module';
import { OppiaCkEditor4Module } from './ck-editor-helpers/ckeditor4.module';
import { BaseModule } from '../base-components/base.module';
import { NgBootstrapModule } from 'modules/ng-boostrap.module';

// Components.
import { AudioBarComponent } from 'pages/exploration-player-page/layout-directives/audio-bar.component';
import { ExplorationEmbedButtonModalComponent } from './button-directives/exploration-embed-button-modal.component';
import { BackgroundBannerComponent } from './common-layout-directives/common-elements/background-banner.component';
import { AttributionGuideComponent } from './common-layout-directives/common-elements/attribution-guide.component';
import { LazyLoadingComponent } from './common-layout-directives/common-elements/lazy-loading.component';
import { KeyboardShortcutHelpModalComponent } from 'components/keyboard-shortcut-help/keyboard-shortcut-help-modal.component';
import { StateSkillEditorComponent } from 'components/state-editor/state-skill-editor/state-skill-editor.component';
import { SelectSkillModalComponent } from './skill-selector/select-skill-modal.component';
import { SharingLinksComponent } from './common-layout-directives/common-elements/sharing-links.component';
import { SkillSelectorComponent } from './skill-selector/skill-selector.component';
import { ProfileLinkImageComponent } from 'components/profile-link-directives/profile-link-image.component';
import { ProfileLinkTextComponent } from 'components/profile-link-directives/profile-link-text.component';
import { AudioFileUploaderComponent } from './forms/custom-forms-directives/audio-file-uploader.component';
import { ThumbnailDisplayComponent } from './forms/custom-forms-directives/thumbnail-display.component';
import { SkillMasteryViewerComponent } from './skill-mastery/skill-mastery.component';
import { ExplorationSummaryTileComponent } from './summary-tile/exploration-summary-tile.component';
import { PracticeTabComponent } from 'pages/topic-viewer-page/practice-tab/practice-tab.component';
import { CollectionSummaryTileComponent } from './summary-tile/collection-summary-tile.component';
import { TakeBreakModalComponent } from 'pages/exploration-player-page/templates/take-break-modal.component';
import { TopicsAndSkillsDashboardNavbarBreadcrumbComponent } from 'pages/topics-and-skills-dashboard-page/navbar/topics-and-skills-dashboard-navbar-breadcrumb.component';
import { ThreadTableComponent } from 'pages/exploration-editor-page/feedback-tab/thread-table/thread-table.component';
import { SummaryListHeaderComponent } from './state-directives/answer-group-editor/summary-list-header.component';
import { LearnerDashboardIconsComponent } from 'pages/learner-dashboard-page/learner-dashboard-icons.component';
import { OutcomeFeedbackEditorComponent } from './state-directives/outcome-editor/outcome-feedback-editor.component';
import { OnScreenKeyboardComponent } from './on-screen-keyboard/on-screen-keyboard.component';
import { RubricsEditorComponent } from './rubrics-editor/rubrics-editor.component';
import { CreateNewSkillModalComponent } from 'pages/topics-and-skills-dashboard-page/modals/create-new-skill-modal.component';
import { CreateActivityModalComponent } from 'pages/creator-dashboard-page/modal-templates/create-activity-modal.component';
import { UploadActivityModalComponent } from 'pages/creator-dashboard-page/modal-templates/upload-activity-modal.component';
import { ThumbnailUploaderComponent } from './forms/custom-forms-directives/thumbnail-uploader.component';
import { EditThumbnailModalComponent } from './forms/custom-forms-directives/edit-thumbnail-modal.component';
import { CorrectnessFooterComponent } from 'pages/exploration-player-page/layout-directives/correctness-footer.component';
import { ContinueButtonComponent } from 'pages/exploration-player-page/learner-experience/continue-button.component';
import { ProgressNavComponent } from 'pages/exploration-player-page/layout-directives/progress-nav.component';
import { QuestionDifficultySelectorComponent } from './question-difficulty-selector/question-difficulty-selector.component';
import { PreviewThumbnailComponent } from 'pages/topic-editor-page/modal-templates/preview-thumbnail.component';
import { InputResponsePairComponent } from 'pages/exploration-player-page/learner-experience/input-response-pair.component';
import { StorySummaryTileComponent } from './summary-tile/story-summary-tile.component';
import { ExplorationFooterComponent } from 'pages/exploration-player-page/layout-directives/exploration-footer.component';
import { DisplaySolutionModalComponent } from 'pages/exploration-player-page/modals/display-solution-modal.component';
import { DisplaySolutionInterstititalModalComponent } from 'pages/exploration-player-page/modals/display-solution-interstitial-modal.component';
import { DisplayHintModalComponent } from 'pages/exploration-player-page/modals/display-hint-modal.component';
import { HintAndSolutionButtonsComponent } from './button-directives/hint-and-solution-buttons.component';
import { SearchBarComponent } from 'pages/library-page/search-bar/search-bar.component';
import { OppiaAngularRootComponent } from './oppia-angular-root.component';
import { SubtopicSummaryTileComponent } from './summary-tile/subtopic-summary-tile.component';
import { FilteredChoicesFieldComponent } from './filter-fields/filtered-choices-field/filtered-choices-field.component';
import { MultiSelectionFieldComponent } from './filter-fields/multi-selection-field/multi-selection-field.component';
import { ConceptCardComponent } from './concept-card/concept-card.component';
import { ScoreRingComponent } from './score-ring/score-ring.component';
import { CompletionGraphComponent } from './statistics-directives/completion-graph.component';
import { TutorCardComponent } from 'pages/exploration-player-page/learner-experience/tutor-card.component';
import { ContentLanguageSelectorComponent } from 'pages/exploration-player-page/layout-directives/content-language-selector.component';
import { RatingDisplayComponent } from './ratings/rating-display/rating-display.component';
import { SupplementalCardComponent } from 'pages/exploration-player-page/learner-experience/supplemental-card.component';


// Pipes.
import { TruncatePipe } from 'filters/string-utility-filters/truncate.pipe';
import { TruncateAndCapitalizePipe } from 'filters/string-utility-filters/truncate-and-capitalize.pipe';
import { SummarizeNonnegativeNumberPipe } from 'filters/summarize-nonnegative-number.pipe';
import { SortByPipe } from 'filters/string-utility-filters/sort-by.pipe';
import { FilterForMatchingSubstringPipe } from 'filters/string-utility-filters/filter-for-matching-substring.pipe';
import { WrapTextWithEllipsisPipe } from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';


// Services.
import { AuthService } from 'services/auth.service';

// Miscellaneous.
import { HybridRouterModuleProvider } from 'hybrid-router-module-provider';

@NgModule({
  imports: [
    BaseModule,
    CommonModule,
    CustomFormsComponentsModule,
    CommonElementsModule,
    CodeMirrorModule,
    // TODO(#13443): Remove hybrid router module provider once all pages are
    // migrated to angular router.
    HybridRouterModuleProvider.provide(),
    MaterialModule,
    NgBootstrapModule,
    DynamicContentModule,
    FormsModule,
    ReactiveFormsModule,
    RichTextComponentsModule,
    ObjectComponentsModule,
    OppiaCkEditor4Module,
    SharedFormsModule,
    AngularFireModule.initializeApp(AuthService.firebaseConfig),
    AngularFireAuthModule,
  ],

  providers: [
    AngularFireAuth,
    {
      provide: USE_EMULATOR,
      useValue: AuthService.firebaseEmulatorConfig
    }
  ],

  declarations: [
    AudioBarComponent,
    AudioFileUploaderComponent,
    AttributionGuideComponent,
    BackgroundBannerComponent,
    CompletionGraphComponent,
    CorrectnessFooterComponent,
    ContinueButtonComponent,
    ContentLanguageSelectorComponent,
    CreateNewSkillModalComponent,
    CreateActivityModalComponent,
    DisplaySolutionModalComponent,
    DisplaySolutionInterstititalModalComponent,
    DisplayHintModalComponent,
    ExplorationFooterComponent,
    ExplorationSummaryTileComponent,
    FilteredChoicesFieldComponent,
    PracticeTabComponent,
    CollectionSummaryTileComponent,
    ExplorationEmbedButtonModalComponent,
    FilterForMatchingSubstringPipe,
    HintAndSolutionButtonsComponent,
    InputResponsePairComponent,
    KeyboardShortcutHelpModalComponent,
    LazyLoadingComponent,
    MultiSelectionFieldComponent,
    OnScreenKeyboardComponent,
    OppiaAngularRootComponent,
    OutcomeFeedbackEditorComponent,
    ProfileLinkImageComponent,
    ProfileLinkTextComponent,
    ProgressNavComponent,
    QuestionDifficultySelectorComponent,
    RatingDisplayComponent,
    RubricsEditorComponent,
    ScoreRingComponent,
    SelectSkillModalComponent,
    SearchBarComponent,
    SharingLinksComponent,
    SkillSelectorComponent,
    SkillMasteryViewerComponent,
    StateSkillEditorComponent,
    StorySummaryTileComponent,
    SubtopicSummaryTileComponent,
    SummaryListHeaderComponent,
    TakeBreakModalComponent,
    ThumbnailUploaderComponent,
    EditThumbnailModalComponent,
    WrapTextWithEllipsisPipe,
    SupplementalCardComponent,
    ThumbnailDisplayComponent,
    ThreadTableComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    TruncateAndCapitalizePipe,
    TutorCardComponent,
    SummarizeNonnegativeNumberPipe,
    TruncatePipe,
    UploadActivityModalComponent,
    SortByPipe,
    LearnerDashboardIconsComponent,
    PreviewThumbnailComponent
  ],

  entryComponents: [
    AudioBarComponent,
    AudioFileUploaderComponent,
    BackgroundBannerComponent,
    CompletionGraphComponent,
    CorrectnessFooterComponent,
    ContinueButtonComponent,
    ConceptCardComponent,
    ContentLanguageSelectorComponent,
    CreateNewSkillModalComponent,
    CreateActivityModalComponent,
    ExplorationFooterComponent,
    ExplorationSummaryTileComponent,
    FilteredChoicesFieldComponent,
    MultiSelectionFieldComponent,
    PracticeTabComponent,
    CollectionSummaryTileComponent,
    SharingLinksComponent,
    SkillMasteryViewerComponent, AttributionGuideComponent,
    LazyLoadingComponent,
    OnScreenKeyboardComponent,
    OppiaAngularRootComponent,
    ProfileLinkImageComponent, ProfileLinkTextComponent,
    // These elements will remain here even after migration.
    DisplaySolutionModalComponent,
    DisplaySolutionInterstititalModalComponent,
    DisplayHintModalComponent,
    SelectSkillModalComponent,
    SkillSelectorComponent,
    TakeBreakModalComponent,
    StateSkillEditorComponent,
    ExplorationEmbedButtonModalComponent,
    OutcomeFeedbackEditorComponent,
    HintAndSolutionButtonsComponent,
    InputResponsePairComponent,
    KeyboardShortcutHelpModalComponent,
    ProgressNavComponent,
    PreviewThumbnailComponent,
    QuestionDifficultySelectorComponent,
    RatingDisplayComponent,
    RubricsEditorComponent,
    ScoreRingComponent,
    SearchBarComponent,
    StorySummaryTileComponent,
    SubtopicSummaryTileComponent,
    SummaryListHeaderComponent,
    SupplementalCardComponent,
    ThumbnailDisplayComponent,
    TutorCardComponent,
    ThumbnailUploaderComponent,
    EditThumbnailModalComponent,
    UploadActivityModalComponent,
    ThreadTableComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    LearnerDashboardIconsComponent,
    PreviewThumbnailComponent
  ],

  exports: [
    // Modules.
    BaseModule,
    CommonElementsModule,
    CodeMirrorModule,
    DynamicContentModule,
    FormsModule,
    MaterialModule,
    NgBootstrapModule,
    RichTextComponentsModule,
    ObjectComponentsModule,
    OppiaCkEditor4Module,
    SharedFormsModule,
    // Components, directives, and pipes.
    AttributionGuideComponent,
    AudioBarComponent,
    AudioFileUploaderComponent,
    BackgroundBannerComponent,
    CompletionGraphComponent,
    CorrectnessFooterComponent,
    ContinueButtonComponent,
    ContentLanguageSelectorComponent,
    CreateNewSkillModalComponent,
    CreateActivityModalComponent,
    DisplaySolutionModalComponent,
    DisplaySolutionInterstititalModalComponent,
    DisplayHintModalComponent,
    ExplorationFooterComponent,
    ExplorationSummaryTileComponent,
    MultiSelectionFieldComponent,
    FilteredChoicesFieldComponent,
    PracticeTabComponent,
    CollectionSummaryTileComponent,
    HintAndSolutionButtonsComponent,
    InputResponsePairComponent,
    LazyLoadingComponent,
    FilterForMatchingSubstringPipe,
    ProfileLinkImageComponent,
    PreviewThumbnailComponent,
    RatingDisplayComponent,
    RubricsEditorComponent,
    FilterForMatchingSubstringPipe,
    OnScreenKeyboardComponent,
    OppiaAngularRootComponent,
    OutcomeFeedbackEditorComponent,
    ProgressNavComponent,
    SearchBarComponent,
    QuestionDifficultySelectorComponent,
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
    ThumbnailDisplayComponent,
    ThumbnailUploaderComponent,
    EditThumbnailModalComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    TutorCardComponent,
    UploadActivityModalComponent,
    WrapTextWithEllipsisPipe,
    TruncateAndCapitalizePipe,
    TruncatePipe,
    SummarizeNonnegativeNumberPipe,
    SortByPipe,
    LearnerDashboardIconsComponent,
  ],
})

export class SharedComponentsModule { }
