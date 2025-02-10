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
 * @fileoverview Module for the collection player page.
 */

import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';

import {SharedComponentsModule} from 'components/shared-component.module';
import {CollectionFooterComponent} from './collection-footer/collection-footer.component';
import {CollectionLocalNavComponent} from './collection-local-nav/collection-local-nav.component';
import {CollectionNavbarComponent} from './collection-navbar/collection-navbar.component';
import {CollectionNodeListComponent} from './collection-node-list/collection-node-list.component';
import {CollectionPlayerPageComponent} from './collection-player-page.component';
import {CollectionPlayerAuthGuard} from './collection-player-auth.guard';
import {CollectionPlayerPageRootComponent} from './collection-player-page-root.component';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {ToastrModule} from 'ngx-toastr';

@NgModule({
  imports: [
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: CollectionPlayerPageRootComponent,
        canActivate: [CollectionPlayerAuthGuard],
      },
    ]),
  ],
  declarations: [
    CollectionFooterComponent,
    CollectionLocalNavComponent,
    CollectionNavbarComponent,
    CollectionNodeListComponent,
    CollectionPlayerPageComponent,
    CollectionPlayerPageRootComponent,
  ],
  entryComponents: [
    CollectionFooterComponent,
    CollectionLocalNavComponent,
    CollectionNodeListComponent,
    CollectionNavbarComponent,
    CollectionPlayerPageComponent,
  ],
})
export class CollectionPlayerPageModule {}
