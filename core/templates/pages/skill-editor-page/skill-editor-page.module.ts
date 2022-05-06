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
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { InteractionExtensionsModule } from 'interactions/interactions.module';
import { SkillEditorNavbarBreadcrumbComponent } from 'pages/skill-editor-page/navbar/skill-editor-navbar-breadcrumb.component';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { DeleteMisconceptionModalComponent } from './modal-templates/delete-misconception-modal.component';
import { SkillDescriptionEditorComponent } from './editor-tab/skill-description-editor/skill-description-editor.component';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';
import { SkillPrerequisiteSkillsEditorComponent } from './editor-tab/skill-prerequisite-skills-editor/skill-prerequisite-skills-editor.component';
import { WorkedExampleEditorComponent } from './editor-tab/skill-concept-card-editor/worked-example-editor.component';
import { MisconceptionEditorComponent } from './editor-tab/skill-misconceptions-editor/misconception-editor.component';
import { DeleteWorkedExampleComponent } from './modal-templates/delete-worked-example-modal.component';
import { AddWorkedExampleModalComponent } from './modal-templates/add-worked-example.component';
import { SkillRubricsEditorComponent } from './editor-tab/skill-rubrics-editor/skill-rubrics-editor.component';
import { AddMisconceptionModalComponent } from './modal-templates/add-misconception-modal.component';
import { SkillEditorSaveModalComponent } from './modal-templates/skill-editor-save-modal.component';
import { SkillMisconceptionsEditorComponent } from './editor-tab/skill-misconceptions-editor/skill-misconceptions-editor.component';
import { SkillPreviewModalComponent } from './editor-tab/skill-preview-modal.component';
import { SkillConceptCardEditorComponent } from './editor-tab/skill-concept-card-editor/skill-concept-card-editor.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    DragDropModule,
    HttpClientModule,
    InteractionExtensionsModule,
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    DeleteMisconceptionModalComponent,
    SkillConceptCardEditorComponent,
    SkillEditorNavbarBreadcrumbComponent,
    SkillDescriptionEditorComponent,
    SkillPrerequisiteSkillsEditorComponent,
    SkillPreviewModalComponent,
    SkillEditorSaveModalComponent,
    WorkedExampleEditorComponent,
    MisconceptionEditorComponent,
    AddWorkedExampleModalComponent,
    DeleteWorkedExampleComponent,
    SkillRubricsEditorComponent,
    AddMisconceptionModalComponent,
    SkillMisconceptionsEditorComponent,
    StaleTabInfoModalComponent,
    UnsavedChangesStatusInfoModalComponent
  ],
  entryComponents: [
    DeleteMisconceptionModalComponent,
    SkillConceptCardEditorComponent,
    SkillEditorNavbarBreadcrumbComponent,
    SkillDescriptionEditorComponent,
    SkillPrerequisiteSkillsEditorComponent,
    SkillPreviewModalComponent,
    SkillEditorSaveModalComponent,
    WorkedExampleEditorComponent,
    MisconceptionEditorComponent,
    AddWorkedExampleModalComponent,
    DeleteWorkedExampleComponent,
    SkillRubricsEditorComponent,
    AddMisconceptionModalComponent,
    SkillMisconceptionsEditorComponent,
    StaleTabInfoModalComponent,
    UnsavedChangesStatusInfoModalComponent
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
    },
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig
    }
  ]
})
class SkillEditorPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { StaleTabInfoModalComponent } from './modal-templates/stale-tab-info-modal.component';
import { UnsavedChangesStatusInfoModalComponent } from './modal-templates/unsaved-changes-status-info-modal.component';

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
