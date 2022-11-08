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
 * @fileoverview Module for the blog-dashboard page.
 */

import { APP_INITIALIZER, NgModule, StaticProvider, DoBootstrap} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { SharedComponentsModule } from 'components/shared-component.module';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { BlogDashboardPageComponent } from 'pages/blog-dashboard-page/blog-dashboard-page.component';
import { BlogPostActionConfirmationModalComponent } from 'pages/blog-dashboard-page/blog-post-action-confirmation/blog-post-action-confirmation.component';
import { BlogCardComponent } from 'pages/blog-dashboard-page/blog-card/blog-card.component';
import { BlogDashboardTileComponent } from 'pages/blog-dashboard-page/blog-dashboard-tile/blog-dashboard-tile.component';
import { BlogDashboardNavbarBreadcrumbComponent } from 'pages/blog-dashboard-page/navbar/navbar-breadcrumb/blog-dashboard-navbar-breadcrumb.component';
import { platformFeatureInitFactory, PlatformFeatureService } from 'services/platform-feature.service';
import { ToastrModule } from 'ngx-toastr';
import { BlogPostEditorComponent } from 'pages/blog-dashboard-page/blog-post-editor/blog-post-editor.component';
import { UploadBlogPostThumbnailModalComponent } from 'pages/blog-dashboard-page/modal-templates/upload-blog-post-thumbnail-modal.component';
import { BlogCardPreviewModalComponent } from 'pages/blog-dashboard-page/modal-templates/blog-card-preview-modal.component';
import { UploadBlogPostThumbnailComponent } from 'pages/blog-dashboard-page/modal-templates/upload-blog-post-thumbnail.component';
import { BlogAuthorDetailsEditorComponent } from './modal-templates/author-detail-editor-modal.component';
import { BlogPostEditorNavbarPreLogoActionComponent } from 'pages/blog-dashboard-page/navbar/navbar-pre-logo-action/blog-post-editor-pre-logo-action.component';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';
import { SmartRouterModule } from 'hybrid-router-module-provider';
import { AppErrorHandlerProvider } from 'pages/oppia-root/app-error-handler';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig),
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    MatButtonToggleModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    SmartRouterModule,
    RouterModule.forRoot([]),
    BrowserAnimationsModule
  ],
  declarations: [
    BlogDashboardNavbarBreadcrumbComponent,
    BlogDashboardPageComponent,
    BlogCardComponent,
    BlogDashboardTileComponent,
    BlogPostEditorComponent,
    BlogPostActionConfirmationModalComponent,
    UploadBlogPostThumbnailModalComponent,
    BlogCardPreviewModalComponent,
    UploadBlogPostThumbnailComponent,
    BlogPostEditorNavbarPreLogoActionComponent,
    BlogAuthorDetailsEditorComponent
  ],
  entryComponents: [
    BlogDashboardNavbarBreadcrumbComponent,
    BlogDashboardPageComponent,
    BlogCardComponent,
    BlogDashboardTileComponent,
    BlogPostEditorComponent,
    BlogPostActionConfirmationModalComponent,
    UploadBlogPostThumbnailModalComponent,
    BlogCardPreviewModalComponent,
    UploadBlogPostThumbnailComponent,
    BlogPostEditorNavbarPreLogoActionComponent,
    BlogAuthorDetailsEditorComponent
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
class BlogDashboardPageModule implements DoBootstrap {
  ngDoBootstrap() {}
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeModule } from '@angular/upgrade/static';

const bootstrapFnAsync = async(extraProviders: StaticProvider[]) => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(BlogDashboardPageModule);
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
