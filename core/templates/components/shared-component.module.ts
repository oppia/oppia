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
import { NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
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
import { LoadingDotsComponent } from './common-layout-directives/common-elements/loading-dots.component';
import { KeyboardShortcutHelpModalComponent } from 'components/keyboard-shortcut-help/keyboard-shortcut-help-modal.component';
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
import { TopNavigationBarComponent } from './common-layout-directives/navigation-bars/top-navigation-bar.component';

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
import { CodeMirrorModule } from './code-mirror/codemirror.module';

// TODO(#11462): Delete these conditional values once firebase auth is launched.
const firebaseAuthModules = AuthService.firebaseAuthIsEnabled ? [
  AngularFireModule.initializeApp(AuthService.firebaseConfig),
  AngularFireAuthModule,
] : [];

const firebaseAuthProviders = AuthService.firebaseAuthIsEnabled ? [
  AngularFireAuth,
  {provide: USE_EMULATOR, useValue: AuthService.firebaseEmulatorConfig},
] : [
  {provide: AngularFireAuth, useValue: null},
];

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
    CodeMirrorModule,
    MaterialModule,
    DirectivesModule,
    DynamicContentModule,
    NgbTooltipModule,
    NgbModalModule,
    FormsModule,
    ToastrModule.forRoot(toastrConfig),
    ObjectComponentsModule,
    SharedFormsModule,
    SharedPipesModule,
    ...firebaseAuthModules,
  ],

  providers: [
    ...firebaseAuthProviders,
  ],

  declarations: [
    AudioFileUploaderComponent,
    AlertMessageComponent,
    AttributionGuideComponent,
    BackgroundBannerComponent,
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
    LoadingDotsComponent,
    OnScreenKeyboardComponent,
    OutcomeFeedbackEditorComponent,
    ProfileLinkImageComponent,
    ProfileLinkTextComponent,
    PromoBarComponent,
    RubricsEditorComponent,
    SharingLinksComponent,
    SideNavigationBarComponent,
    SkillSelectorComponent,
    SkillMasteryViewerComponent,
    SocialButtonsComponent,
    StorySummaryTileDirective,
    SubtopicSummaryTileDirective,
    SummaryListHeaderComponent,
    TakeBreakModalComponent,
    TopNavigationBarComponent,
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
    CreateNewSkillModalComponent,
    CreateActivityButtonComponent,
    CreateActivityModalComponent,
    ExplorationSummaryTileComponent,
    CollectionSummaryTileComponent,
    SharingLinksComponent,
    SkillMasteryViewerComponent, AttributionGuideComponent,
    LazyLoadingComponent, LoadingMessageComponent,
    LoadingDotsComponent, SocialButtonsComponent,
    OnScreenKeyboardComponent,
    ProfileLinkImageComponent, ProfileLinkTextComponent,
    // These elements will remain here even after migration.
    SkillSelectorComponent,
    TakeBreakModalComponent,
    ExplorationEmbedButtonModalComponent,
    OutcomeFeedbackEditorComponent,
    KeyboardShortcutHelpModalComponent,
    PromoBarComponent,
    RubricsEditorComponent,
    SideNavigationBarComponent,
    SummaryListHeaderComponent,
    ThumbnailDisplayComponent,
    UploadActivityModalComponent,
    ThreadTableComponent,
    TopNavigationBarComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    WarningsAndAlertsComponent,
    LearnerDashboardIconsComponent
  ],

  exports: [
    // Modules.
    CodeMirrorModule,
    DynamicContentModule,
    DirectivesModule,
    FormsModule,
    MaterialModule,
    NgbTooltipModule,
    NgbModalModule,
    ObjectComponentsModule,
    SharedFormsModule,
    SharedPipesModule,
    // Components, directives, and pipes.
    AttributionGuideComponent,
    AudioFileUploaderComponent,
    AlertMessageComponent,
    BackgroundBannerComponent,
    CreateNewSkillModalComponent,
    CreateActivityButtonComponent,
    CreateActivityModalComponent,
    ExplorationSummaryTileComponent,
    CollectionSummaryTileComponent,
    LazyLoadingComponent,
    LoadingMessageComponent,
    FilterForMatchingSubstringPipe,
    LimitToPipe,
    PromoBarComponent,
    RubricsEditorComponent,
    FilterForMatchingSubstringPipe,
    OnScreenKeyboardComponent,
    OutcomeFeedbackEditorComponent,
    SideNavigationBarComponent,
    SharingLinksComponent,
    SkillSelectorComponent,
    SocialButtonsComponent,
    StorySummaryTileDirective,
    SubtopicSummaryTileDirective,
    SummaryListHeaderComponent,
    TakeBreakModalComponent,
    ThumbnailDisplayComponent,
    TopNavigationBarComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    WarningsAndAlertsComponent,
    UploadActivityModalComponent,
    WrapTextWithEllipsisPipe,
    TruncateAndCapitalizePipe,
    TruncatePipe,
    SummarizeNonnegativeNumberPipe,
    SortByPipe,
    LoadingDotsComponent,
    LearnerDashboardIconsComponent
  ],
})

export class SharedComponentsModule { }
