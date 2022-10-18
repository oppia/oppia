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
 * @fileoverview Component for a blog dashboard card.
 */

import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import dayjs from 'dayjs';
import { BlogDashboardPageService } from '../services/blog-dashboard-page.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BlogPostActionConfirmationModalComponent } from 'pages/blog-dashboard-page/blog-post-action-confirmation/blog-post-action-confirmation.component';
import { BlogPostEditorBackendApiService } from 'domain/blog/blog-post-editor-backend-api.service';
import { AlertsService } from 'services/alerts.service';
@Component({
  selector: 'oppia-blog-dashboard-tile',
  templateUrl: './blog-dashboard-tile.component.html'
})
export class BlogDashboardTileComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() blogPostSummary!: BlogPostSummary;
  @Input() activeView!: string;
  @Input() blogPostIsPublished: boolean = false;
  lastUpdatedDateString: string = '';
  @Output() unpublisedBlogPost: EventEmitter<void> = new EventEmitter();
  @Output() deletedBlogPost: EventEmitter<void> = new EventEmitter();
  constructor(
    private blogDashboardPageService: BlogDashboardPageService,
    private blogPostEditorBackendService: BlogPostEditorBackendApiService,
    private ngbModal: NgbModal,
    private alertsService: AlertsService
  ) {}

  ngOnInit(): void {
    const lastUpdated = this.blogPostSummary.lastUpdated;
    this.lastUpdatedDateString = this.getDateStringInWords(lastUpdated);
  }

  getDateStringInWords(naiveDate: string): string {
    return dayjs(
      naiveDate.split(',')[0], 'MM-DD-YYYY').format('MMM D, YYYY');
  }

  editBlogPost(): void {
    this.blogDashboardPageService.navigateToEditorTabWithId(
      this.blogPostSummary.id);
  }

  deleteBlogPost(): void {
    this.blogDashboardPageService.blogPostAction = 'delete';
    this.ngbModal.open(BlogPostActionConfirmationModalComponent, {
      backdrop: 'static',
      keyboard: false,
    }).result.then(() => {
      this.blogDashboardPageService.blogPostId = this.blogPostSummary.id;
      this.blogDashboardPageService.deleteBlogPost();
      this.deletedBlogPost.emit();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  unpublishBlogPost(): void {
    this.blogDashboardPageService.blogPostAction = 'unpublish';
    this.ngbModal.open(BlogPostActionConfirmationModalComponent, {
      backdrop: 'static',
      keyboard: false,
    }).result.then(() => {
      this.blogPostEditorBackendService.updateBlogPostDataAsync(
        this.blogPostSummary.id, false, {}).then(
        () => {
          this.unpublisedBlogPost.emit();
        }, (errorResponse) => {
          this.alertsService.addWarning(
            `Failed to unpublish Blog Post. Internal Error: ${errorResponse}`);
        }
      );
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }
}
