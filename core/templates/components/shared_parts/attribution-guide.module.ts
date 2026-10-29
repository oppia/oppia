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
 * @fileoverview Auto-generated granular module for one shared component.
 * Each component lives in its own module so pages import only what they use.
 */

import {NgModule} from '@angular/core';
import {AttributionGuideComponent} from '../common-layout-directives/common-elements/attribution-guide.component';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {MatButtonModule} from '@angular/material/button';
import {NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {SharingLinksModule} from 'components/shared_parts/sharing-links.module';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
    NgbTooltipModule,
    SharingLinksModule,
  ],
  declarations: [AttributionGuideComponent],
  exports: [AttributionGuideComponent],
})
export class AttributionGuideModule {}
