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

import {MatTabsModule} from '@angular/material/tabs';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatTooltipModule} from '@angular/material/tooltip';
import {SharedComponentsModule} from 'components/shared-component.module';
import {RouterModule} from '@angular/router';
import {BlogDashboardPageComponent} from 'pages/blog-dashboard-page/blog-dashboard-page.component';
import {SharedBlogComponentsModule} from 'pages/blog-dashboard-page/shared-blog-components.module';
import {NgModule} from '@angular/core';
import {ToastrModule} from 'ngx-toastr';
import {toastrConfig} from 'pages/oppia-root/app.module';
import {BlogDashboardPageRootComponent} from './blog-dashboard-page-root.component';
import {BlogAuthorDetailsEditorComponent} from './modal-templates/author-detail-editor-modal.component';
import {BlogDashboardPageAuthGuard} from './blog-dashboard-page-auth.guard';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {ContextService} from 'services/context.service';
import {CsrfTokenService} from 'services/csrf-token.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {ImagePreloaderService} from 'pages/exploration-player-page/services/image-preloader.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {RteHelperService} from 'services/rte-helper.service';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {BlogDashboardPageService} from './services/blog-dashboard-page.service';
import {BlogPostEditorBackendApiService} from 'domain/blog/blog-post-editor-backend-api.service';
import {BlogPostUpdateService} from 'domain/blog/blog-post-update.service';
import {LoaderService} from 'services/loader.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {UserService} from 'services/user.service';
import {UtilsService} from 'services/utils.service';
import {UrlService} from 'services/contextual/url.service';
import {BlogPostPageService} from 'pages/blog-post-page/services/blog-post-page.service';
import {ComputeGraphService} from 'services/compute-graph.service';
import {ExtractImageFilenamesFromModelService} from 'pages/exploration-player-page/services/extract-image-filenames-from-model.service';
import {UserBackendApiService} from 'services/user-backend-api.service';
import {RequestInterceptor} from 'services/request-interceptor.service';
import {ExternalRteSaveService} from 'services/external-rte-save.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {HTTP_INTERCEPTORS} from '@angular/common/http';

@NgModule({
  imports: [
    SharedComponentsModule,
    SharedBlogComponentsModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    ToastrModule.forRoot(toastrConfig),
    RouterModule.forChild([
      {
        path: '',
        component: BlogDashboardPageRootComponent,
        canActivate: [BlogDashboardPageAuthGuard],
      },
    ]),
    MatButtonToggleModule,
  ],
  declarations: [
    BlogDashboardPageComponent,
    BlogAuthorDetailsEditorComponent,
    BlogDashboardPageRootComponent,
  ],
  entryComponents: [
    BlogDashboardPageComponent,
    BlogAuthorDetailsEditorComponent,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true,
    },
    RteHelperService,
  ],
})
export class BlogDashboardPageModule {}
