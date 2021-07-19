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
import { NgbModalModule, NgbPopoverModule, NgbNavModule, NgbTooltipModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuth, AngularFireAuthModule, USE_EMULATOR } from '@angular/fire/auth';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { CustomFormsComponentsModule } from './forms/custom-forms-directives/custom-form-components.module';
import { DirectivesModule } from 'directives/directives.module';
import { DynamicContentModule } from './angular-html-bind/dynamic-content.module';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from './material.module';
import { ObjectComponentsModule } from 'objects/object-components.module';
import { SharedPipesModule } from 'filters/shared-pipes.module';
import { SharedFormsModule } from './forms/shared-forms.module';
import { ToastrModule } from 'ngx-toastr';
import { CookieModule } from 'ngx-cookie';
import { TranslateModule, TranslateLoader, TranslateService, TranslateDefaultParser, TranslateParser, MissingTranslationHandler } from '@ngx-translate/core';
import { TranslateCacheModule, TranslateCacheService, TranslateCacheSettings } from 'ngx-translate-cache';
import { CommonElementsModule } from './common-layout-directives/common-elements/common-elements.module';
import { RichTextComponentsModule } from 'rich_text_components/rich-text-components.module';
import { CodeMirrorModule } from './code-mirror/codemirror.module';
import { OppiaCkEditor4Module } from './ck-editor-helpers/ckeditor4.module';


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
import { OppiaFooterComponent } from '../base-components/oppia-footer.component';
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
import { ThumbnailUploaderComponent } from './forms/custom-forms-directives/thumbnail-uploader.component';
import { EditThumbnailModalComponent } from './forms/custom-forms-directives/edit-thumbnail-modal.component';
import { TopNavigationBarComponent } from './common-layout-directives/navigation-bars/top-navigation-bar.component';
import { CorrectnessFooterComponent } from 'pages/exploration-player-page/layout-directives/correctness-footer.component';
import { ContinueButtonComponent } from 'pages/exploration-player-page/learner-experience/continue-button.component';
import { BaseContentComponent, BaseContentNavBarBreadCrumbDirective, BaseContentPageFooterDirective } from '../base-components/base-content.component';
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


// Directives.
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
// eslint-disable-next-line oppia/disallow-httpclient
import { HttpClient } from '@angular/common/http';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';


// Miscellaneous.
import { TranslateLoaderFactory } from 'pages/translate-loader.factory';
import { TranslateCacheFactory } from 'pages/translate-cache.factory';
import { TranslateCustomParser } from 'pages/translate-custom-parser';
import { MissingTranslationCustomHandler } from 'pages/missing-translation-custom-handler';
import constants from 'assets/constants';

import { HammerGestureConfig } from '@angular/platform-browser';
import * as hammer from 'hammerjs';


export class MyHammerConfig extends HammerGestureConfig {
  overrides = {
    swipe: { direction: hammer.DIRECTION_HORIZONTAL },
    pinch: { enable: false },
    rotate: { enable: false },
  };

  options = {
    cssProps: {
      userSelect: true
    }
  };
}

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
    CustomFormsComponentsModule,
    CommonElementsModule,
    CodeMirrorModule,
    CookieModule.forRoot(),
    MaterialModule,
    DirectivesModule,
    DynamicContentModule,
    NgbDropdownModule,
    NgbTooltipModule,
    NgbNavModule,
    NgbModalModule,
    NgbPopoverModule,
    FormsModule,
    RichTextComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    ObjectComponentsModule,
    OppiaCkEditor4Module,
    SharedFormsModule,
    SharedPipesModule,
    /**
     * The Translate Module will look for translations in the following order:
     * 1. Look for translation in primary language (fetched from backend)
     * 2. Look for translation in default language (fetched from backend)
     * 3. Look for translation present in AppConstants.ts (
     *    used until translations after fetched from backend)
     * 4. shows the key, if the translation is not found.
     */
    TranslateModule.forRoot({
      defaultLanguage: constants.DEFAULT_LANGUAGE_CODE,
      missingTranslationHandler: {
        provide: MissingTranslationHandler,
        useClass: MissingTranslationCustomHandler
      },
      loader: {
        provide: TranslateLoader,
        useFactory: TranslateLoaderFactory.createHttpLoader,
        deps: [HttpClient],
      },
      parser: {
        provide: TranslateParser,
        useClass: TranslateCustomParser,
        deps: [TranslateDefaultParser, I18nLanguageCodeService]
      }
    }),
    TranslateCacheModule.forRoot({
      cacheService: {
        provide: TranslateCacheService,
        useFactory: TranslateCacheFactory.createTranslateCacheService,
        deps: [TranslateService, TranslateCacheSettings]
      },
      cacheName: 'NG_TRANSLATE_LANG_KEY',
      cacheMechanism: 'Cookie',
      cookieExpiry: 30
    }),
    AngularFireModule.initializeApp(AuthService.firebaseConfig),
    AngularFireAuthModule,
  ],

  providers: [
    TranslateDefaultParser,
    AngularFireAuth,
    {provide: USE_EMULATOR, useValue: AuthService.firebaseEmulatorConfig},
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig
    }
  ],

  declarations: [
    AlertMessageComponent,
    AudioBarComponent,
    AudioFileUploaderComponent,
    AttributionGuideComponent,
    BackgroundBannerComponent,
    BaseContentComponent,
    BaseContentNavBarBreadCrumbDirective,
    BaseContentPageFooterDirective,
    CorrectnessFooterComponent,
    ContinueButtonComponent,
    CreateNewSkillModalComponent,
    CreateActivityButtonComponent,
    CreateActivityModalComponent,
    DisplaySolutionModalComponent,
    DisplaySolutionInterstititalModalComponent,
    DisplayHintModalComponent,
    ExplorationFooterComponent,
    ExplorationSummaryTileComponent,
    CollectionSummaryTileComponent,
    ExplorationEmbedButtonModalComponent,
    FilterForMatchingSubstringPipe,
    HintAndSolutionButtonsComponent,
    InputResponsePairComponent,
    KeyboardShortcutHelpModalComponent,
    LazyLoadingComponent,
    LimitToPipe,
    LoadingMessageComponent,
    OnScreenKeyboardComponent,
    OppiaFooterComponent,
    OutcomeFeedbackEditorComponent,
    ProfileLinkImageComponent,
    ProfileLinkTextComponent,
    PromoBarComponent,
    QuestionDifficultySelectorComponent,
    SelectSkillModalComponent,
    RubricsEditorComponent,
    SearchBarComponent,
    SharingLinksComponent,
    SideNavigationBarComponent,
    SkillSelectorComponent,
    SkillMasteryViewerComponent,
    StateSkillEditorComponent,
    SocialButtonsComponent,
    StorySummaryTileComponent,
    SubtopicSummaryTileDirective,
    SummaryListHeaderComponent,
    TakeBreakModalComponent,
    ThumbnailUploaderComponent,
    EditThumbnailModalComponent,
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
    LearnerDashboardIconsComponent,
    PreviewThumbnailComponent
  ],

  entryComponents: [
    AlertMessageComponent,
    AudioBarComponent,
    AudioFileUploaderComponent,
    BackgroundBannerComponent,
    CorrectnessFooterComponent,
    ContinueButtonComponent,
    CreateNewSkillModalComponent,
    CreateActivityButtonComponent,
    CreateActivityModalComponent,
    ExplorationFooterComponent,
    ExplorationSummaryTileComponent,
    CollectionSummaryTileComponent,
    BaseContentComponent,
    SharingLinksComponent,
    SkillMasteryViewerComponent, AttributionGuideComponent,
    LazyLoadingComponent, LoadingMessageComponent,
    SocialButtonsComponent,
    OnScreenKeyboardComponent,
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
    OppiaFooterComponent,
    PreviewThumbnailComponent,
    PromoBarComponent,
    QuestionDifficultySelectorComponent,
    RubricsEditorComponent,
    SearchBarComponent,
    SideNavigationBarComponent,
    StorySummaryTileComponent,
    SummaryListHeaderComponent,
    ThumbnailDisplayComponent,
    ThumbnailUploaderComponent,
    EditThumbnailModalComponent,
    UploadActivityModalComponent,
    ThreadTableComponent,
    TopNavigationBarComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    WarningsAndAlertsComponent,
    LearnerDashboardIconsComponent,
    PreviewThumbnailComponent
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
    NgbModalModule,
    RichTextComponentsModule,
    ObjectComponentsModule,
    OppiaCkEditor4Module,
    SharedFormsModule,
    SharedPipesModule,
    TranslateModule,
    // Components, directives, and pipes.
    AlertMessageComponent,
    AttributionGuideComponent,
    AudioBarComponent,
    AudioFileUploaderComponent,
    BackgroundBannerComponent,
    BaseContentComponent,
    BaseContentNavBarBreadCrumbDirective,
    BaseContentPageFooterDirective,
    CorrectnessFooterComponent,
    ContinueButtonComponent,
    CreateNewSkillModalComponent,
    CreateActivityButtonComponent,
    CreateActivityModalComponent,
    DisplaySolutionModalComponent,
    DisplaySolutionInterstititalModalComponent,
    DisplayHintModalComponent,
    ExplorationFooterComponent,
    ExplorationSummaryTileComponent,
    CollectionSummaryTileComponent,
    HintAndSolutionButtonsComponent,
    InputResponsePairComponent,
    LazyLoadingComponent,
    LoadingMessageComponent,
    FilterForMatchingSubstringPipe,
    LimitToPipe,
    PreviewThumbnailComponent,
    PromoBarComponent,
    RubricsEditorComponent,
    FilterForMatchingSubstringPipe,
    OnScreenKeyboardComponent,
    OppiaFooterComponent,
    OutcomeFeedbackEditorComponent,
    SearchBarComponent,
    QuestionDifficultySelectorComponent,
    StateSkillEditorComponent,
    SelectSkillModalComponent,
    SideNavigationBarComponent,
    SharingLinksComponent,
    SkillSelectorComponent,
    SocialButtonsComponent,
    StorySummaryTileComponent,
    SubtopicSummaryTileDirective,
    SummaryListHeaderComponent,
    TakeBreakModalComponent,
    ThumbnailDisplayComponent,
    ThumbnailUploaderComponent,
    EditThumbnailModalComponent,
    TopNavigationBarComponent,
    TopicsAndSkillsDashboardNavbarBreadcrumbComponent,
    WarningsAndAlertsComponent,
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
