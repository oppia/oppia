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
import { BlogDashboardPageService } from '../services/blog-dashboard-page.service';
import { BlogPostData } from 'domain/blog/blog-post.model';
import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { TruncatePipe } from 'filters/string-utility-filters/truncate.pipe';
@Component({
  selector: 'oppia-blog-card-preview-modal',
  templateUrl: './blog-card-preview-modal.component.html',
  styleUrls: []
})
export class BlogCardPreviewModalComponent
    extends ConfirmOrCancelModal implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  blogPostData!: BlogPostData;
  blogPostSummary!: BlogPostSummary;
  summaryContent!: string;
  blogHomePageLink: string = '';
  constructor(
      ngbActiveModal: NgbActiveModal,
      private blogDashboardPageService: BlogDashboardPageService,
      private truncatePipe: TruncatePipe,
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.blogPostData = this.blogDashboardPageService.blogPostData;
    let rawContent = this.blogPostData.content.replace(
      /<strong>(.*?)<\/strong>/g, ' ').replace(/<h1>(.*?)<\/h1>/g, ' ');
    this.summaryContent = this.truncatePipe.transform(
      rawContent, 300);
    let dateString;
    if (this.blogPostData.publishedOn) {
      dateString = this.blogPostData.publishedOn;
    } else {
      dateString = this.blogPostData.lastUpdated;
    }

    this.blogPostSummary = new BlogPostSummary (
      this.blogPostData.id,
      '',
      this.blogPostData.displayedAuthorName,
      this.blogPostData.title,
      this.summaryContent,
      this.blogPostData.tags,
      this.blogPostData.thumbnailFilename,
      this.blogPostData.urlFragment,
      this.blogPostData.lastUpdated,
      dateString,
    );
    this.blogHomePageLink = (
      '<a href=\"\/blog\" rel=\"noopener\" target=\"_blank\"><span>' +
      '( link </span><span ' +
      'class=\"fas fa-external-link-alt oppia-open-new-tab-icon\">' +
      '</span> )</a>');
  }
}
