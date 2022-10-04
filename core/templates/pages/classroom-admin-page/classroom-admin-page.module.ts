// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Module for the classroom-admin page.
 */


import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, DoBootstrap, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeComponent, downgradeModule } from '@angular/upgrade/static';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { SharedComponentsModule } from 'components/shared-component.module';
import { ClassroomAdminNavbarComponent } from './navbar/classroom-admin-navbar.component';
import { ClassroomAdminPageComponent } from './classroom-admin-page.component';
import { platformFeatureInitFactory, PlatformFeatureService } from 'services/platform-feature.service';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { ToastrModule } from 'ngx-toastr';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';
import { SmartRouterModule } from 'hybrid-router-module-provider';
import { AppErrorHandlerProvider } from 'pages/oppia-root/app-error-handler';
import { ClassroomEditorConfirmModalComponent } from './modals/classroom-editor-confirm-modal.component';
import { DeleteClassroomConfirmModalComponent } from './modals/delete-classroom-confirm-modal.component';
import { CreateNewClassroomModalComponent } from './modals/create-new-classroom-modal.component';
import { DeleteTopicFromClassroomModalComponent } from './modals/delete-topic-from-classroom-modal.component';
import { TopicsDependencyGraphModalComponent } from './modals/topic-dependency-graph-viz-modal.component';


declare var angular: ng.IAngularStatic;

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    SmartRouterModule,
    RouterModule.forRoot([]),
    MatCardModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    ClassroomAdminNavbarComponent,
    ClassroomAdminPageComponent,
    ClassroomEditorConfirmModalComponent,
    DeleteClassroomConfirmModalComponent,
    CreateNewClassroomModalComponent,
    DeleteTopicFromClassroomModalComponent,
    TopicsDependencyGraphModalComponent,
  ],
  entryComponents: [
    ClassroomAdminNavbarComponent,
    ClassroomAdminPageComponent,
    ClassroomEditorConfirmModalComponent,
    DeleteClassroomConfirmModalComponent,
    CreateNewClassroomModalComponent,
    DeleteTopicFromClassroomModalComponent,
    TopicsDependencyGraphModalComponent,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: platformFeatureInitFactory,
      deps: [PlatformFeatureService],
      multi: true,
    },
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig
    },
    AppErrorHandlerProvider,
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    }
  ],
})
class ClassroomAdminPageModule implements DoBootstrap {
  ngDoBootstrap() {}
}

angular.module('oppia').requires.push(downgradeModule(extraProviders => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(ClassroomAdminPageModule);
}));

angular.module('oppia').directive('oppiaAngularRoot', downgradeComponent({
  component: OppiaAngularRootComponent,
}));
