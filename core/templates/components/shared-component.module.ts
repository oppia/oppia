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

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuth, AngularFireAuthModule, USE_EMULATOR } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { BackgroundBannerComponent } from
  './common-layout-directives/common-elements/background-banner.component';
import { AttributionGuideComponent } from
  './common-layout-directives/common-elements/attribution-guide.component';
import { LazyLoadingComponent } from
  './common-layout-directives/common-elements/lazy-loading.component';
import { LoadingDotsComponent } from
  './common-layout-directives/common-elements/loading-dots.component';
import { MaterialModule } from './material.module';
import { TranslatePipe } from 'filters/translate.pipe';
import { FilterForMatchingSubstringPipe } from 'filters/string-utility-filters/filter-for-matching-substring.pipe';
import { SkillSelectorComponent } from
  './skill-selector/skill-selector.component';
import { SkillMasteryViewerComponent } from
  './skill-mastery/skill-mastery.component';
import { ExplorationEmbedButtonModalComponent } from
  './button-directives/exploration-embed-button-modal.component';
import { KeyboardShortcutHelpModalComponent } from
  'components/keyboard-shortcut-help/keyboard-shortcut-help-modal.component';
import { SharingLinksComponent } from
  './common-layout-directives/common-elements/sharing-links.component';
import { ImageUploaderComponent } from './forms/custom-forms-directives/image-uploader.component';
import { StorySummaryTileDirective } from
  './summary-tile/story-summary-tile.directive';
import { SubtopicSummaryTileDirective } from
  './summary-tile/subtopic-summary-tile.directive';
import { SocialButtonsComponent } from
  'components/button-directives/social-buttons.component';
import { NgbModalModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { ExplorationSummaryTileDirective } from
  './summary-tile/exploration-summary-tile.directive';
import { ProfileLinkImageComponent } from
  'components/profile-link-directives/profile-link-image.component';
import { ProfileLinkTextComponent } from
  'components/profile-link-directives/profile-link-text.component';
import { ThumbnailDisplayComponent } from './forms/custom-forms-directives/thumbnail-display.component';
import { TakeBreakModalComponent } from 'pages/exploration-player-page/templates/take-break-modal.component';
import { TopicsAndSkillsDashboardNavbarBreadcrumbComponent } from 'pages/topics-and-skills-dashboard-page/navbar/topics-and-skills-dashboard-navbar-breadcrumb.component';
import { AuthService } from 'services/auth.service';
import { QuestionDifficultySelectorComponent } from './question-difficulty-selector/question-difficulty-selector.component';
import { AudioFileUploaderComponent } from './forms/custom-forms-directives/audio-file-uploader.component';
import { FocusOnDirective } from '../directives/focus-on.directive';
import { ThreadTableComponent } from 'pages/exploration-editor-page/feedback-tab/thread-table/thread-table.component';
import { TruncatePipe } from 'filters/string-utility-filters/truncate.pipe';
import { SummaryListHeaderComponent } from './state-directives/answer-group-editor/summary-list-header.component';
import { PromoBarComponent } from './common-layout-directives/common-elements/promo-bar.component';
import { DynamicContentModule } from './angular-html-bind/dynamic-content.module';
import { ObjectComponentsModule } from 'objects/object-components.module';
import { OnScreenKeyboardComponent } from './on-screen-keyboard/on-screen-keyboard.component';

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


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    MaterialModule,
    DynamicContentModule,
    MaterialModule,
    NgbTooltipModule,
    NgbModalModule,
    FormsModule,
    ObjectComponentsModule,
    ...firebaseAuthModules,
  ],

  providers: [
    ...firebaseAuthProviders,
  ],

  declarations: [
    AudioFileUploaderComponent,
    AttributionGuideComponent,
    BackgroundBannerComponent,
    ExplorationEmbedButtonModalComponent,
    ExplorationSummaryTileDirective,
    FilterForMatchingSubstringPipe,
    FocusOnDirective,
    ImageUploaderComponent,
    KeyboardShortcutHelpModalComponent,
    LazyLoadingComponent,
    LoadingDotsComponent,
    OnScreenKeyboardComponent,
    ProfileLinkImageComponent,
    ProfileLinkTextComponent,
    QuestionDifficultySelectorComponent,
    SharingLinksComponent,
    SkillSelectorComponent,
    SkillMasteryViewerComponent,
    SocialButtonsComponent,
    StorySummaryTileDirective,
    SubtopicSummaryTileDirective,
    SummaryListHeaderComponent,
    TakeBreakModalComponent,
    ThumbnailDisplayComponent,
    ThreadTableComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    TranslatePipe,
    TruncatePipe,
    PromoBarComponent
  ],

  entryComponents: [
    AudioFileUploaderComponent,
    BackgroundBannerComponent,
    SharingLinksComponent,
    SkillMasteryViewerComponent, AttributionGuideComponent,
    LazyLoadingComponent, LoadingDotsComponent, SocialButtonsComponent,
    OnScreenKeyboardComponent,
    ProfileLinkImageComponent, ProfileLinkTextComponent,
    // These elements will remain here even after migration.
    SkillSelectorComponent,
    TakeBreakModalComponent,
    ExplorationEmbedButtonModalComponent,
    ImageUploaderComponent,
    KeyboardShortcutHelpModalComponent,
    QuestionDifficultySelectorComponent,
    SkillMasteryViewerComponent,
    SocialButtonsComponent,
    SummaryListHeaderComponent,
    ThumbnailDisplayComponent,
    PromoBarComponent,
    ThreadTableComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
  ],

  exports: [
    // Modules.
    DynamicContentModule,
    FormsModule,
    MaterialModule,
    NgbTooltipModule,
    NgbModalModule,
    ObjectComponentsModule,
    // Components, directives, and pipes.
    AudioFileUploaderComponent,
    BackgroundBannerComponent,
    ExplorationSummaryTileDirective,
    FilterForMatchingSubstringPipe,
    FocusOnDirective,
    QuestionDifficultySelectorComponent,
    ImageUploaderComponent,
    OnScreenKeyboardComponent,
    SharingLinksComponent,
    SkillSelectorComponent,
    SocialButtonsComponent,
    StorySummaryTileDirective,
    SubtopicSummaryTileDirective,
    SummaryListHeaderComponent,
    TakeBreakModalComponent,
    ThumbnailDisplayComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    TranslatePipe,
    PromoBarComponent
  ],
})

export class SharedComponentsModule { }
