// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the participation playbook page.
 */

import {NgModule} from '@angular/core';
import {PlaybookPageComponent} from './playbook.component';
import {SharedComponentsModule} from 'components/shared-component.module';
import {PlaybookPageRootComponent} from './playbook-page-root.component';
import {CommonModule} from '@angular/common';
import {PlaybookPageRoutingModule} from './playbook-page-routing.module';
import {SmartRouterModule} from 'hybrid-router-module-provider';

@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    // TODO(#13443): Remove hybrid router module provider once all pages are
    // migrated to angular router.
    SmartRouterModule,
    PlaybookPageRoutingModule,
  ],
  declarations: [PlaybookPageComponent, PlaybookPageRootComponent],
  entryComponents: [PlaybookPageComponent, PlaybookPageRootComponent],
})
export class PlaybookPageModule {}
