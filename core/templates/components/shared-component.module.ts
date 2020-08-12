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
import 'core-js/es7/reflect';
import 'zone.js';

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslatePipe } from 'filters/translate.pipe';
import { SafePipe } from 'filters/safe-pipe';
import { SocialButtonsComponent } from
  'components/button-directives/social-buttons.component';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ProfileLinkImageComponent } from
  'components/profile-link-directives/profile-link-image.component';
import { ProfileLinkTextComponent } from
  'components/profile-link-directives/profile-link-text.component';
import { BackgroundBannerComponent } from
  './common-layout-directives/common-elements/background-banner.component';
import { AttributionGuideComponent } from
  './common-layout-directives/common-elements/attribution-guide.component';
import { LazyLoadingComponent } from
  './common-layout-directives/common-elements/lazy-loading.component';
import { LoadingDotsComponent } from
  './common-layout-directives/common-elements/loading-dots.component';
import { MaterialModule } from './material.module';
import { SkillMasteryViewerComponent } from
  './skill-mastery/skill-mastery.component';
import { ExplorationEmbedButtonModalComponent } from
  './button-directives/exploration-embed-button-modal.component';
import { SharingLinksComponent } from
  './common-layout-directives/common-elements/sharing-links.component';
import { StorySummaryTileDirective } from
  './summary-tile/story-summary-tile.directive';
import { SubtopicSummaryTileDirective } from
  './summary-tile/subtopic-summary-tile.directive';
import { ExplorationSummaryTileDirective } from
  './summary-tile/exploration-summary-tile.directive';


@NgModule({
  imports: [CommonModule, MaterialModule, NgbModalModule, FormsModule],

  declarations: [
    AttributionGuideComponent,
    BackgroundBannerComponent,
    ExplorationEmbedButtonModalComponent,
    ExplorationSummaryTileDirective,
    LazyLoadingComponent,
    LoadingDotsComponent,
    ProfileLinkImageComponent,
    ProfileLinkTextComponent,
    SafePipe,
    SharingLinksComponent,
    SkillMasteryViewerComponent,
    StorySummaryTileDirective,
    SocialButtonsComponent,
    SubtopicSummaryTileDirective,
    TranslatePipe
  ],

  entryComponents: [
    BackgroundBannerComponent,
    SharingLinksComponent,
    SkillMasteryViewerComponent, AttributionGuideComponent,
    LazyLoadingComponent, LoadingDotsComponent, SocialButtonsComponent,
    ProfileLinkImageComponent, ProfileLinkTextComponent,
    // These elements will remain here even after migration.
    ExplorationEmbedButtonModalComponent,
    SkillMasteryViewerComponent,
    SocialButtonsComponent
  ],

  exports: [
    // Modules.
    FormsModule,
    MaterialModule,
    // Components, directives, and pipes.
    BackgroundBannerComponent,
    ExplorationSummaryTileDirective,
    SafePipe,
    SharingLinksComponent,
    StorySummaryTileDirective,
    SubtopicSummaryTileDirective,
    TranslatePipe
  ],
})

export class SharedComponentsModule { }
