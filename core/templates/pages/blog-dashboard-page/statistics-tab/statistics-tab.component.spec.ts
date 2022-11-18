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
 * @fileoverview Unit tests for blog post editor.
 */

import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CapitalizePipe } from 'filters/string-utility-filters/capitalize.pipe';
import { MaterialModule } from 'modules/material.module';
import { BlogDashboardPageService } from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { BlogPostEditorBackendApiService } from 'domain/blog/blog-post-editor-backend-api.service';
import { LoaderService } from 'services/loader.service';
import { AlertsService } from 'services/alerts.service';
import { MockTranslatePipe, MockCapitalizePipe } from 'tests/unit-test-utils';
import { BlogPostData } from 'domain/blog/blog-post.model';
import { AppConstants } from 'app.constants';
import { UrlService } from 'services/contextual/url.service';
import { BlogPostUpdateService } from 'domain/blog/blog-post-update.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { FormsModule } from '@angular/forms';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { UploadBlogPostThumbnailComponent } from '../modal-templates/upload-blog-post-thumbnail.component';
import { ImageUploaderComponent } from 'components/forms/custom-forms-directives/image-uploader.component';
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('Blog Post Editor Component', () => {})

