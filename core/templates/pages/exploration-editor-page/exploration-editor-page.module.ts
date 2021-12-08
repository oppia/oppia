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
 * @fileoverview Module for the exploration editor page.
 */

import { APP_INITIALIZER, NgModule, StaticProvider } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SharedComponentsModule } from 'components/shared-component.module';
import { CkEditorCopyToolbarComponent } from 'components/ck-editor-helpers/ck-editor-copy-toolbar/ck-editor-copy-toolbar.component';
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { platformFeatureInitFactory, PlatformFeatureService } from
  'services/platform-feature.service';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { StateParamChangesEditorComponent } from './editor-tab/state-param-changes-editor/state-param-changes-editor.component';
import { DeleteStateSkillModalComponent } from './editor-tab/templates/modal-templates/delete-state-skill-modal.component';
import { ParamChangesEditorDirective } from './param-changes-editor/param-changes-editor.component';
import { SwitchContentLanguageRefreshRequiredModalComponent } from 'pages/exploration-player-page/switch-content-language-refresh-required-modal.component';
import { InteractionExtensionsModule } from 'interactions/interactions.module';
import { SaveVersionMismatchModalComponent } from './modal-templates/save-version-mismatch-modal.component';
import { SaveValidationFailModalComponent } from './modal-templates/save-validation-fail-modal.component';
import { ChangesInHumanReadableFormComponent } from './changes-in-human-readable-form/changes-in-human-readable-form.component';
import { LostChangesModalComponent } from './modal-templates/lost-changes-modal.component';
import { WelcomeModalComponent } from './modal-templates/welcome-modal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StateDiffModalComponent } from './modal-templates/state-diff-modal.component';
import { PostPublishModalComponent } from './modal-templates/post-publish-modal.component';
import { ExplorationPublishModalComponent } from 'pages/exploration-editor-page/modal-templates/exploration-publish-modal.component';
import { EditorReloadingModalComponent } from './modal-templates/editor-reloading-modal.component';
import { ConfirmDiscardChangesModalComponent } from './modal-templates/confirm-discard-changes-modal.component';
import { CreateFeedbackThreadModalComponent } from './feedback-tab/templates/create-feedback-thread-modal.component';
import { DeleteExplorationModalComponent } from './settings-tab/templates/delete-exploration-modal.component';
import { RemoveRoleConfirmationModalComponent } from './settings-tab/templates/remove-role-confirmation-modal.component';
import { ReassignRoleConfirmationModalComponent } from './settings-tab/templates/reassign-role-confirmation-modal.component';
import { ModeratorUnpublishExplorationModalComponent } from './settings-tab/templates/moderator-unpublish-exploration-modal.component';
import { TransferExplorationOwnershipModalComponent } from './settings-tab/templates/transfer-exploration-ownership-modal.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    InteractionExtensionsModule,
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    CkEditorCopyToolbarComponent,
    DeleteStateSkillModalComponent,
    ParamChangesEditorDirective,
    StateParamChangesEditorComponent,
    SwitchContentLanguageRefreshRequiredModalComponent,
    SaveVersionMismatchModalComponent,
    SaveValidationFailModalComponent,
    ChangesInHumanReadableFormComponent,
    LostChangesModalComponent,
    WelcomeModalComponent,
    StateDiffModalComponent,
    PostPublishModalComponent,
    ConfirmDiscardChangesModalComponent,
    ExplorationPublishModalComponent,
    EditorReloadingModalComponent,
    CreateFeedbackThreadModalComponent,
    DeleteExplorationModalComponent,
    RemoveRoleConfirmationModalComponent,
    ReassignRoleConfirmationModalComponent,
    ModeratorUnpublishExplorationModalComponent,
    TransferExplorationOwnershipModalComponent
  ],
  entryComponents: [
    CkEditorCopyToolbarComponent,
    DeleteStateSkillModalComponent,
    StateParamChangesEditorComponent,
    SwitchContentLanguageRefreshRequiredModalComponent,
    SaveVersionMismatchModalComponent,
    SaveValidationFailModalComponent,
    ChangesInHumanReadableFormComponent,
    LostChangesModalComponent,
    WelcomeModalComponent,
    StateDiffModalComponent,
    PostPublishModalComponent,
    ConfirmDiscardChangesModalComponent,
    ExplorationPublishModalComponent,
    EditorReloadingModalComponent,
    CreateFeedbackThreadModalComponent,
    DeleteExplorationModalComponent,
    RemoveRoleConfirmationModalComponent,
    ReassignRoleConfirmationModalComponent,
    ModeratorUnpublishExplorationModalComponent,
    TransferExplorationOwnershipModalComponent
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
class ExplorationEditorPageModule {
  // Empty placeholder method to satisfy the `Compiler`.
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';
import { ToastrModule } from 'ngx-toastr';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(ExplorationEditorPageModule);
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
