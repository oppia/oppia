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

import { Component, Input, OnInit } from '@angular/core';
import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import dayjs from 'dayjs';
@Component({
  selector: 'oppia-blog-dashboard-tile',
  templateUrl: './blog-dashboard-tile.component.html'
})
export class BlogDashboardTileComponent implements OnInit {
  @Input() blogPostSummary!: BlogPostSummary;
  @Input() blogPostIsPublished: boolean;
  lastUpdatedDateString: string = '';

  ngOnInit(): void {
    this.lastUpdatedDateString = this.getDateStringInWords(
      this.blogPostSummary.lastUpdated);
  }

  getDateStringInWords(naiveDate: string): string {
    return dayjs(
      naiveDate.split(',')[0], 'MM-DD-YYYY').format('MMMM D, YYYY');
  }
}
