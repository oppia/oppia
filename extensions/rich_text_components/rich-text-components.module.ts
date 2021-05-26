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
 * @fileoverview Module for the rich text extension components.
 */
import 'core-js/es7/reflect';
import 'zone.js';

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { NgbAccordionModule, NgbModalModule, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NoninteractiveCollapsible } from './Collapsible/directives/oppia-noninteractive-collapsible.component';
import { DynamicContentModule } from 'components/angular-html-bind/dynamic-content.module';
import { NoninteractiveImage } from './Image/directives/oppia-noninteractive-image.component';
import { NoninteractiveLink } from './Link/directives/oppia-noninteractive-link.component';
import { NoninteractiveMath } from './Math/directives/oppia-noninteractive-math.component';
import { NoninteractiveSvgdiagram } from './Svgdiagram/directives/oppia-noninteractive-svgdiagram.component';
import { NoninteractiveTabs } from './Tabs/directives/oppia-noninteractive-tabs.component';
import { NoninteractiveVideo } from './Video/directives/oppia-noninteractive-video.component';
import { NoninteractiveSkillreview } from './Skillreview/directives/oppia-noninteractive-skillreview.component';
import { OppiaNoninteractiveSkillreviewConceptCardModalComponent } from './Skillreview/directives/oppia-noninteractive-skillreview-concept-card-modal.component';
import { ConceptCardComponent } from 'components/concept-card/concept-card.directive';


@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    DynamicContentModule,
    MatButtonModule,
    NgbAccordionModule,
    NgbModalModule,
    NgbNavModule,
    NgbTooltipModule,
    YouTubePlayerModule
  ],
  declarations: [
    ConceptCardComponent,
    NoninteractiveCollapsible,
    NoninteractiveImage,
    NoninteractiveLink,
    NoninteractiveMath,
    NoninteractiveSkillreview,
    NoninteractiveSvgdiagram,
    NoninteractiveTabs,
    NoninteractiveVideo,
    OppiaNoninteractiveSkillreviewConceptCardModalComponent
  ],
  entryComponents: [
    NoninteractiveCollapsible,
    NoninteractiveImage,
    NoninteractiveLink,
    NoninteractiveMath,
    NoninteractiveSkillreview,
    NoninteractiveSvgdiagram,
    NoninteractiveTabs,
    NoninteractiveVideo,
    OppiaNoninteractiveSkillreviewConceptCardModalComponent
  ],
  exports: [
    ConceptCardComponent,
    NoninteractiveCollapsible,
    NoninteractiveImage,
    NoninteractiveLink,
    NoninteractiveMath,
    NoninteractiveSkillreview,
    NoninteractiveSvgdiagram,
    NoninteractiveTabs,
    NoninteractiveVideo,
    OppiaNoninteractiveSkillreviewConceptCardModalComponent
  ],
})

export class RichTextComponentsModule { }
