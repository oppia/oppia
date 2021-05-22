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
 * @fileoverview Module for the skill editor page.
 */

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { InteractionExtensionsModule } from 'interactions/interactions.module';
import { ContentLanguageSelectorComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-player-page/layout-directives/content-language-selector.component';
import { SkillEditorNavbarBreadcrumbComponent } from 'pages/skill-editor-page/navbar/skill-editor-navbar-breadcrumb.component';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { DeleteMisconceptionModalComponent } from './modal-templates/delete-misconception-modal.component';
import { SkillDescriptionEditorComponent } from './editor-tab/skill-description-editor/skill-description-editor.component';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    InteractionExtensionsModule,
    SharedComponentsModule
  ],
  declarations: [
    ContentLanguageSelectorComponent,
    OppiaAngularRootComponent,
    DeleteMisconceptionModalComponent,
    SkillEditorNavbarBreadcrumbComponent,
    SkillDescriptionEditorComponent
  ],
  entryComponents: [
    ContentLanguageSelectorComponent,
    OppiaAngularRootComponent,
    DeleteMisconceptionModalComponent,
    SkillEditorNavbarBreadcrumbComponent,
    SkillDescriptionEditorComponent
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: platformFeatureInitFactory,
      deps: [PlatformFeatureService],
      multi: true
    }
  ]
})
class SkillEditorPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(SkillEditorPageModule);
};
const downgradedModule = downgradeModule(bootstrapFnAsync);

declare var angular: ng.IAngularStatic;

angular.module('oppia').requires.push(downgradedModule);

angular.module('oppia').directive(
  // This directive is the downgraded version of the Angular component to
  // bootstrap the Angular 8.
  'oppiaAngularRoot',
  downgradeComponent({
    component: OppiaAngularRootComponent
  }) as angular.IDirectiveFactory);
