// Copyright 2020 The Oppia Authors. All Rights Reserved.
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

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuth, AngularFireAuthModule } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeInjectable } from '@angular/upgrade/static';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import 'core-js/es7/reflect';
import 'zone.js';

import { AppConstants } from 'app.constants';
import { ExplorationEmbedButtonModalComponent } from 'components/button-directives/exploration-embed-button-modal.component';
import { SocialButtonsComponent } from 'components/button-directives/social-buttons.component';
import { AttributionGuideComponent } from 'components/common-layout-directives/common-elements/attribution-guide.component';
import { BackgroundBannerComponent } from 'components/common-layout-directives/common-elements/background-banner.component';
import { LazyLoadingComponent } from 'components/common-layout-directives/common-elements/lazy-loading.component';
import { LoadingDotsComponent } from 'components/common-layout-directives/common-elements/loading-dots.component';
import { SharingLinksComponent } from 'components/common-layout-directives/common-elements/sharing-links.component';
import { KeyboardShortcutHelpModalComponent } from 'components/keyboard-shortcut-help/keyboard-shortcut-help-modal.component';
import { MaterialModule } from 'components/material.module';
import { ProfileLinkImageComponent } from 'components/profile-link-directives/profile-link-image.component';
import { ProfileLinkTextComponent } from 'components/profile-link-directives/profile-link-text.component';
import { SkillMasteryViewerComponent } from 'components/skill-mastery/skill-mastery.component';
import { ExplorationSummaryTileDirective } from 'components/summary-tile/exploration-summary-tile.directive';
import { StorySummaryTileDirective } from 'components/summary-tile/story-summary-tile.directive';
import { SubtopicSummaryTileDirective } from 'components/summary-tile/subtopic-summary-tile.directive';
import { TranslatePipe } from 'filters/translate.pipe';


@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    NgbModalModule,
    BrowserModule,
    FormsModule,
    AngularFireModule.initializeApp(AppConstants.FIREBASE_ENVIRONMENT.config),
    AngularFireAuthModule,
  ],

  declarations: [
    AttributionGuideComponent,
    BackgroundBannerComponent,
    ExplorationEmbedButtonModalComponent,
    ExplorationSummaryTileDirective,
    KeyboardShortcutHelpModalComponent,
    LazyLoadingComponent,
    LoadingDotsComponent,
    ProfileLinkImageComponent,
    ProfileLinkTextComponent,
    SharingLinksComponent,
    SkillMasteryViewerComponent,
    StorySummaryTileDirective,
    SocialButtonsComponent,
    SubtopicSummaryTileDirective,
    TranslatePipe,
  ],

  entryComponents: [
    BackgroundBannerComponent,
    SharingLinksComponent,
    SkillMasteryViewerComponent, AttributionGuideComponent,
    LazyLoadingComponent, LoadingDotsComponent, SocialButtonsComponent,
    ProfileLinkImageComponent, ProfileLinkTextComponent,
    // These elements will remain here even after migration.
    ExplorationEmbedButtonModalComponent,
    KeyboardShortcutHelpModalComponent,
    SkillMasteryViewerComponent,
    SocialButtonsComponent,
  ],

  exports: [
    // Modules.
    FormsModule,
    MaterialModule,
    // Components, directives, and pipes.
    BackgroundBannerComponent,
    ExplorationSummaryTileDirective,
    SharingLinksComponent,
    StorySummaryTileDirective,
    SubtopicSummaryTileDirective,
    TranslatePipe,
  ],
})

export class SharedComponentsModule { }

angular.module('oppia').factory(
  'AngularFireAuth', downgradeInjectable(AngularFireAuth));
