// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the navbar pre-logo-action
 *  of the blog dashboard.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Subscription } from 'rxjs';
import { BlogDashboardPageService } from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';

@Component({
  selector: 'oppia-blog-post-editor-pre-logo-action',
  templateUrl: './blog-post-editor-pre-logo-action.component.html'
})
export class BlogPostEditorNavbarPreLogoActionComponent
implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  activeTab!: string;
  directiveSubscriptions = new Subscription();
  constructor(
    private blogDashboardPageService: BlogDashboardPageService,
  ) {}

  ngOnInit(): void {
    this.activeTab = this.blogDashboardPageService.activeTab;
    this.directiveSubscriptions.add(
      this.blogDashboardPageService.updateViewEventEmitter.subscribe(
        () => {
          this.activeTab = this.blogDashboardPageService.activeTab;
        }
      )
    );
  }

  ngOnDestroy(): void {
    return this.directiveSubscriptions.unsubscribe();
  }
}
angular.module('oppia').directive('oppiaBlogPostEditorPreLogoAction',
  downgradeComponent({component: BlogPostEditorNavbarPreLogoActionComponent}));
