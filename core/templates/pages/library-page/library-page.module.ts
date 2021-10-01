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
 * @fileoverview Module for the library page.
 */

import { NgModule } from '@angular/core';
import { SharedComponentsModule } from 'components/shared-component.module';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { LearnerPlaylistModalComponent } from 'pages/learner-dashboard-page/modal-templates/learner-playlist-modal.component';

import { LibraryFooterComponent } from './library-footer/library-footer.component';
import { LibraryPageRootComponent } from './library-page-root.component';
import { LibraryPageComponent } from './library-page.component';
import { ActivityTilesInfinityGridComponent } from './search-results/activity-tiles-infinity-grid.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { CommonModule } from '@angular/common';
import { LibraryPageRoutingModule } from './library-page-routing.module';

@NgModule({
  imports: [
    CommonModule,
    SharedComponentsModule,
    InfiniteScrollModule,
    LibraryPageRoutingModule
  ],
  declarations: [
    LearnerPlaylistModalComponent,
    LibraryFooterComponent,
    SearchResultsComponent,
    ActivityTilesInfinityGridComponent,
    LibraryPageComponent,
    LibraryPageRootComponent
  ],
  entryComponents: [
    LearnerPlaylistModalComponent,
    LibraryFooterComponent,
    SearchResultsComponent,
    ActivityTilesInfinityGridComponent,
    LibraryPageComponent,
    LibraryPageRootComponent
  ]
})
export class LibraryPageModule {}
