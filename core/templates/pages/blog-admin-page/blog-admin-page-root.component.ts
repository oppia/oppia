// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Blog admin page root component.
 */

import {Component} from '@angular/core';
import {AppConstants} from 'app.constants';
import {BaseRootComponent, MetaTagData} from 'pages/base-root.component';

@Component({
  selector: 'oppia-blog-admin-page-root',
  templateUrl: './blog-admin-page-root.component.html',
})
export class BlogAdminPageRootComponent extends BaseRootComponent {
  title: string = AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_ADMIN.TITLE;
  meta: MetaTagData[] = AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_ADMIN
    .META as unknown as Readonly<MetaTagData>[];
}
