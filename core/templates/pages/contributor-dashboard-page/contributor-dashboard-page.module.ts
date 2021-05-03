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
 * @fileoverview Module for the contributor dashboard page.
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

import { CkEditorCopyToolbarComponent } from 'components/ck-editor-helpers/ck-editor-copy-toolbar/ck-editor-copy-toolbar.component';
import { InteractionExtensionsModule } from 'interactions/interactions.module';
import { TranslationLanguageSelectorComponent } from
  './translation-language-selector/translation-language-selector.component';
import { LoginRequiredMessageComponent } from './login-required-message/login-required-message.component';
import { LoginRequiredModalContent } from './modal-templates/login-required-modal.component';

import { OpportunitiesListItemComponent } from './opportunities-list-item/opportunities-list-item.component';
import { OpportunitiesListComponent } from './opportunities-list/opportunities-list.component';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { TranslationModalComponent } from './modal-templates/translation-modal.component';
import { TranslationOpportunitiesComponent } from './translation-opportunities/translation-opportunities.component';


@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    InteractionExtensionsModule,
    SharedComponentsModule,
    NgbModalModule,
    SharedFormsModule
  ],
  declarations: [
    OppiaAngularRootComponent,
    CkEditorCopyToolbarComponent,
    LoginRequiredMessageComponent,
    LoginRequiredModalContent,
    OpportunitiesListItemComponent,
    OpportunitiesListComponent,
    TranslationLanguageSelectorComponent,
    TranslationOpportunitiesComponent,
    TranslationModalComponent
  ],
  entryComponents: [
    OppiaAngularRootComponent,
    CkEditorCopyToolbarComponent,
    LoginRequiredMessageComponent,
    LoginRequiredModalContent,
    OpportunitiesListItemComponent,
    OpportunitiesListComponent,
    TranslationLanguageSelectorComponent,
    TranslationOpportunitiesComponent,
    TranslationModalComponent
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
class ContributorDashboardPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { SharedFormsModule } from 'components/forms/shared-forms.module';

const bootstrapFn = (extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(ContributorDashboardPageModule);
};
const downgradedModule = downgradeModule(bootstrapFn);

declare var angular: ng.IAngularStatic;

angular.module('oppia').requires.push(downgradedModule);

angular.module('oppia').directive(
  // This directive is the downgraded version of the Angular component to
  // bootstrap the Angular 8.
  'oppiaAngularRoot',
  downgradeComponent({
    component: OppiaAngularRootComponent
  }) as angular.IDirectiveFactory);
