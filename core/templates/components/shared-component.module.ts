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

import { BackgroundBannerComponent } from
  './common-layout-directives/common-elements/background-banner.component';
import { MaterialModule } from './material.module';
import { TranslatePipe } from 'filters/translate.pipe';
import { SkillMasteryViewerComponent } from
  './skill-mastery/skill-mastery.component';
import { SharingLinksComponent } from
  './common-layout-directives/common-elements/sharing-links.component';
import { ExplorationEmbedButtonModalComponent } from
  './button-directives/exploration-embed-button-modal.component';
import { SocialButtonsComponent } from
  'components/button-directives/social-buttons.component';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';



@NgModule({
  imports: [CommonModule, MaterialModule, NgbModalModule],
  declarations: [BackgroundBannerComponent, TranslatePipe,
    SharingLinksComponent, ExplorationEmbedButtonModalComponent,
    SkillMasteryViewerComponent, SocialButtonsComponent],
  entryComponents: [BackgroundBannerComponent, SharingLinksComponent,
    // These elements will remain here even after migration.
    ExplorationEmbedButtonModalComponent, SkillMasteryViewerComponent,
    SocialButtonsComponent
  ],
  exports: [
    BackgroundBannerComponent, TranslatePipe,
    SharingLinksComponent, MaterialModule
  ],
})

export class SharedComponentsModule { }
