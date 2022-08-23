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
 * @fileoverview Component for confirming blog post actions.
 */

import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { BlogDashboardPageService } from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';
import { BlogDashboardPageConstants } from 'pages/blog-dashboard-page/blog-dashboard-page.constants';

@Component({
  selector: 'oppia-blog-post-action-confirmation-modal',
  templateUrl: './blog-post-action-confirmation.component.html',
  styleUrls: []
})
export class BlogPostActionConfirmationModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  blogPostAction!: string;
  constructor(
      ngbActiveModal: NgbActiveModal,
      private blogDashboardPageService: BlogDashboardPageService,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.blogPostAction = this.blogDashboardPageService.blogPostAction;
  }

  isActionDelete(): boolean {
    return this.blogPostAction === (
      BlogDashboardPageConstants.BLOG_POST_ACTIONS.DELETE);
  }

  isActionPublish(): boolean {
    return this.blogPostAction === (
      BlogDashboardPageConstants.BLOG_POST_ACTIONS.PUBLISH);
  }

  isActionUnpublish(): boolean {
    return this.blogPostAction === (
      BlogDashboardPageConstants.BLOG_POST_ACTIONS.UNPUBLISH);
  }
}
