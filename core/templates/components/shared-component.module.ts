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
import { NgbModalModule, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuth, AngularFireAuthModule, USE_EMULATOR } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from './material.module';
import { DirectivesModule } from 'directives/directives.module';
import { DynamicContentModule } from './angular-html-bind/dynamic-content.module';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { ToastrModule } from 'ngx-toastr';
import { SharedFormsModule } from './forms/shared-forms.module';
import { ObjectComponentsModule } from 'objects/object-components.module';


// Components.
import { ExplorationEmbedButtonModalComponent } from './button-directives/exploration-embed-button-modal.component';
import { BackgroundBannerComponent } from './common-layout-directives/common-elements/background-banner.component';
import { AttributionGuideComponent } from './common-layout-directives/common-elements/attribution-guide.component';
import { LazyLoadingComponent } from './common-layout-directives/common-elements/lazy-loading.component';
import { KeyboardShortcutHelpModalComponent } from 'components/keyboard-shortcut-help/keyboard-shortcut-help-modal.component';
import { StateSkillEditorComponent } from 'components/state-editor/state-skill-editor/state-skill-editor.component';
import { SelectSkillModalComponent } from './skill-selector/select-skill-modal.component';
import { SharingLinksComponent } from './common-layout-directives/common-elements/sharing-links.component';
import { SocialButtonsComponent } from 'components/button-directives/social-buttons.component';
import { SkillSelectorComponent } from './skill-selector/skill-selector.component';
import { ProfileLinkImageComponent } from 'components/profile-link-directives/profile-link-image.component';
import { ProfileLinkTextComponent } from 'components/profile-link-directives/profile-link-text.component';
import { AudioFileUploaderComponent } from './forms/custom-forms-directives/audio-file-uploader.component';
import { ThumbnailDisplayComponent } from './forms/custom-forms-directives/thumbnail-display.component';
import { SkillMasteryViewerComponent } from './skill-mastery/skill-mastery.component';
import { ExplorationSummaryTileComponent } from './summary-tile/exploration-summary-tile.component';
import { CollectionSummaryTileComponent } from './summary-tile/collection-summary-tile.component';
import { TakeBreakModalComponent } from 'pages/exploration-player-page/templates/take-break-modal.component';
import { TopicsAndSkillsDashboardNavbarBreadcrumbComponent } from 'pages/topics-and-skills-dashboard-page/navbar/topics-and-skills-dashboard-navbar-breadcrumb.component';
import { ThreadTableComponent } from 'pages/exploration-editor-page/feedback-tab/thread-table/thread-table.component';
import { SummaryListHeaderComponent } from './state-directives/answer-group-editor/summary-list-header.component';
import { LearnerDashboardIconsComponent } from 'pages/learner-dashboard-page/learner-dashboard-icons.component';
import { OutcomeFeedbackEditorComponent } from './state-directives/outcome-editor/outcome-feedback-editor.component';
import { OnScreenKeyboardComponent } from './on-screen-keyboard/on-screen-keyboard.component';
import { RubricsEditorComponent } from './rubrics-editor/rubrics-editor.component';
import { CreateNewSkillModalComponent } from 'pages/topics-and-skills-dashboard-page/create-new-skill-modal.component';
import { PromoBarComponent } from './common-layout-directives/common-elements/promo-bar.component';
import { SideNavigationBarComponent } from './common-layout-directives/navigation-bars/side-navigation-bar.component';
import { AlertMessageComponent } from './common-layout-directives/common-elements/alert-message.component';
import { WarningsAndAlertsComponent } from '../base-components/warnings-and-alerts.component';
import { LoadingMessageComponent } from '../base-components/loading-message.component';
import { CreateActivityButtonComponent } from './button-directives/create-activity-button.component';
import { CreateActivityModalComponent } from 'pages/creator-dashboard-page/modal-templates/create-activity-modal.component';
import { UploadActivityModalComponent } from 'pages/creator-dashboard-page/modal-templates/upload-activity-modal.component';
import { CorrectnessFooterComponent } from 'pages/exploration-player-page/layout-directives/correctness-footer.component';
import { ContinueButtonComponent } from 'pages/exploration-player-page/learner-experience/continue-button.component';
import { QuestionDifficultySelectorComponent } from './question-difficulty-selector/question-difficulty-selector.component';
import { PreviewThumbnailComponent } from 'pages/topic-editor-page/modal-templates/preview-thumbnail.component';


// Directives.
import { StorySummaryTileDirective } from './summary-tile/story-summary-tile.directive';
import { SubtopicSummaryTileDirective } from './summary-tile/subtopic-summary-tile.directive';


// Pipes.
import { TruncatePipe } from 'filters/string-utility-filters/truncate.pipe';
import { TruncateAndCapitalizePipe } from 'filters/string-utility-filters/truncate-and-capitalize.pipe';
import { SummarizeNonnegativeNumberPipe } from 'filters/summarize-nonnegative-number.pipe';
import { SortByPipe } from 'filters/string-utility-filters/sort-by.pipe';
import { FilterForMatchingSubstringPipe } from 'filters/string-utility-filters/filter-for-matching-substring.pipe';
import { WrapTextWithEllipsisPipe } from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import { LimitToPipe } from 'filters/limit-to.pipe';


// Services.
import { AuthService } from 'services/auth.service';
import { RichTextComponentsModule } from 'rich_text_components/rich-text-components.module';
import { CodeMirrorModule } from './code-mirror/codemirror.module';
import { CommonElementsModule } from './common-layout-directives/common-elements/common-elements.module';

const toastrConfig = {
  allowHtml: false,
  iconClasses: {
    error: 'toast-error',
    info: 'toast-info',
    success: 'toast-success',
    warning: 'toast-warning'
  },
  positionClass: 'toast-bottom-right',
  messageClass: 'toast-message',
  progressBar: false,
  tapToDismiss: true,
  titleClass: 'toast-title'
};

@NgModule({
  imports: [
    BrowserModule,
    CommonModule,
    CommonElementsModule,
    CodeMirrorModule,
    MaterialModule,
    DirectivesModule,
    DynamicContentModule,
    NgbTooltipModule,
    NgbNavModule,
    NgbModalModule,
    FormsModule,
    RichTextComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    ObjectComponentsModule,
    SharedFormsModule,
    SharedPipesModule,
    AngularFireModule.initializeApp(AuthService.firebaseConfig),
    AngularFireAuthModule,
  ],

  providers: [
    AngularFireAuth,
    {provide: USE_EMULATOR, useValue: AuthService.firebaseEmulatorConfig},
  ],

  declarations: [
    AudioFileUploaderComponent,
    AlertMessageComponent,
    AttributionGuideComponent,
    BackgroundBannerComponent,
    CorrectnessFooterComponent,
    ContinueButtonComponent,
    CreateNewSkillModalComponent,
    CreateActivityButtonComponent,
    CreateActivityModalComponent,
    ExplorationSummaryTileComponent,
    CollectionSummaryTileComponent,
    ExplorationEmbedButtonModalComponent,
    FilterForMatchingSubstringPipe,
    KeyboardShortcutHelpModalComponent,
    LazyLoadingComponent,
    LimitToPipe,
    LoadingMessageComponent,
    OnScreenKeyboardComponent,
    OutcomeFeedbackEditorComponent,
    PreviewThumbnailComponent,
    ProfileLinkImageComponent,
    ProfileLinkTextComponent,
    PromoBarComponent,
    QuestionDifficultySelectorComponent,
    SelectSkillModalComponent,
    RubricsEditorComponent,
    SharingLinksComponent,
    SideNavigationBarComponent,
    SkillSelectorComponent,
    SkillMasteryViewerComponent,
    StateSkillEditorComponent,
    SocialButtonsComponent,
    StorySummaryTileDirective,
    SubtopicSummaryTileDirective,
    SummaryListHeaderComponent,
    TakeBreakModalComponent,
    WrapTextWithEllipsisPipe,
    WarningsAndAlertsComponent,
    ThumbnailDisplayComponent,
    ThreadTableComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    TruncateAndCapitalizePipe,
    SummarizeNonnegativeNumberPipe,
    TruncatePipe,
    UploadActivityModalComponent,
    PromoBarComponent,
    SortByPipe,
    LearnerDashboardIconsComponent
  ],

  entryComponents: [
    AudioFileUploaderComponent,
    AlertMessageComponent,
    BackgroundBannerComponent,
    CorrectnessFooterComponent,
    ContinueButtonComponent,
    CreateNewSkillModalComponent,
    CreateActivityButtonComponent,
    CreateActivityModalComponent,
    ExplorationSummaryTileComponent,
    CollectionSummaryTileComponent,
    SharingLinksComponent,
    SkillMasteryViewerComponent, AttributionGuideComponent,
    LazyLoadingComponent, LoadingMessageComponent,
    SocialButtonsComponent,
    OnScreenKeyboardComponent,
    ProfileLinkImageComponent, ProfileLinkTextComponent,
    // These elements will remain here even after migration.
    SelectSkillModalComponent,
    SkillSelectorComponent,
    TakeBreakModalComponent,
    StateSkillEditorComponent,
    ExplorationEmbedButtonModalComponent,
    OutcomeFeedbackEditorComponent,
    KeyboardShortcutHelpModalComponent,
    PreviewThumbnailComponent,
    PromoBarComponent,
    QuestionDifficultySelectorComponent,
    RubricsEditorComponent,
    SideNavigationBarComponent,
    SummaryListHeaderComponent,
    ThumbnailDisplayComponent,
    UploadActivityModalComponent,
    ThreadTableComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    WarningsAndAlertsComponent,
    LearnerDashboardIconsComponent
  ],

  exports: [
    // Modules.
    CommonElementsModule,
    CodeMirrorModule,
    DynamicContentModule,
    DirectivesModule,
    FormsModule,
    MaterialModule,
    NgbTooltipModule,
    NgbNavModule,
    RichTextComponentsModule,
    NgbModalModule,
    ObjectComponentsModule,
    SharedFormsModule,
    SharedPipesModule,
    // Components, directives, and pipes.
    AttributionGuideComponent,
    AudioFileUploaderComponent,
    AlertMessageComponent,
    BackgroundBannerComponent,
    CorrectnessFooterComponent,
    ContinueButtonComponent,
    CreateNewSkillModalComponent,
    CreateActivityButtonComponent,
    CreateActivityModalComponent,
    ExplorationSummaryTileComponent,
    CollectionSummaryTileComponent,
    LazyLoadingComponent,
    LoadingMessageComponent,
    FilterForMatchingSubstringPipe,
    LimitToPipe,
    PreviewThumbnailComponent,
    PromoBarComponent,
    RubricsEditorComponent,
    FilterForMatchingSubstringPipe,
    OnScreenKeyboardComponent,
    OutcomeFeedbackEditorComponent,
    QuestionDifficultySelectorComponent,
    StateSkillEditorComponent,
    SharingLinksComponent,
    SelectSkillModalComponent,
    SideNavigationBarComponent,
    SharingLinksComponent,
    SkillSelectorComponent,
    SocialButtonsComponent,
    StorySummaryTileDirective,
    SubtopicSummaryTileDirective,
    SummaryListHeaderComponent,
    TakeBreakModalComponent,
    ThumbnailDisplayComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    WarningsAndAlertsComponent,
    UploadActivityModalComponent,
    WrapTextWithEllipsisPipe,
    TruncateAndCapitalizePipe,
    TruncatePipe,
    SummarizeNonnegativeNumberPipe,
    SortByPipe,
    LearnerDashboardIconsComponent
  ],
})

export class SharedComponentsModule { }
