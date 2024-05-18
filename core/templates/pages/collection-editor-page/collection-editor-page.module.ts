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
 * @fileoverview Module for the collection editor page.
 */

import {RouterModule} from '@angular/router';
import {SharedComponentsModule} from 'components/shared-component.module';
import {CollectionHistoryTabComponent} from 'pages/collection-editor-page/history-tab/collection-history-tab.component';
import {CollectionNodeEditorComponent} from './editor-tab/collection-node-editor.component';
import {CollectionSettingsTabComponent} from 'pages/collection-editor-page/settings-tab/collection-settings-tab.component';
import {CollectionStatisticsTabComponent} from 'pages/collection-editor-page/statistics-tab/collection-statistics-tab.component';
import {CollectionDetailsEditorComponent} from './settings-tab/collection-details-editor.component';
import {CollectionPermissionsCardComponent} from './settings-tab/collection-permissions-card.component';
import {CollectionEditorNavbarBreadcrumbComponent} from './navbar/collection-editor-navbar-breadcrumb.component';
import {CollectionEditorNavbarComponent} from './navbar/collection-editor-navbar.component';
import {CollectionNodeCreatorComponent} from './editor-tab/collection-node-creator.component';
import {CollectionEditorTabComponent} from './editor-tab/collection-editor-tab.component';
import {CollectionEditorSaveModalComponent} from './modals/collection-editor-save-modal.component';
import {CollectionEditorPrePublishModalComponent} from './modals/collection-editor-pre-publish-modal.component';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/lightweight-oppia-root/app.module';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {CollectionEditorPageComponent} from './collection-editor-page.component';
import {CollectionEditorPageAuthGuard} from './collection-editor-page-auth.guard';
import {CollectionEditorPageRootComponent} from './collection-editor-page-root.component';

@NgModule({
  imports: [
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    SharedComponentsModule,
    FormsModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: CollectionEditorPageRootComponent,
        canActivate: [CollectionEditorPageAuthGuard],
      },
    ]),
  ],
  declarations: [
    CollectionNodeCreatorComponent,
    CollectionEditorNavbarBreadcrumbComponent,
    CollectionEditorNavbarComponent,
    CollectionEditorPageComponent,
    CollectionEditorPrePublishModalComponent,
    CollectionEditorSaveModalComponent,
    CollectionEditorTabComponent,
    CollectionDetailsEditorComponent,
    CollectionHistoryTabComponent,
    CollectionNodeEditorComponent,
    CollectionPermissionsCardComponent,
    CollectionSettingsTabComponent,
    CollectionStatisticsTabComponent,
    CollectionEditorPageRootComponent,
  ],
  entryComponents: [
    CollectionNodeCreatorComponent,
    CollectionEditorNavbarBreadcrumbComponent,
    CollectionEditorNavbarComponent,
    CollectionEditorPageComponent,
    CollectionEditorPrePublishModalComponent,
    CollectionEditorSaveModalComponent,
    CollectionEditorTabComponent,
    CollectionDetailsEditorComponent,
    CollectionHistoryTabComponent,
    CollectionNodeEditorComponent,
    CollectionSettingsTabComponent,
    CollectionStatisticsTabComponent,
  ],
})
export class CollectionEditorPageModule {}
