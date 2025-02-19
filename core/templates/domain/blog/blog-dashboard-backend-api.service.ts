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
 * @fileoverview Service to get data for to a blog dashboard from backend.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {
  BlogPostSummaryBackendDict,
  BlogPostSummary,
} from 'domain/blog/blog-post-summary.model';
import {BlogDashboardPageConstants} from 'pages/blog-dashboard-page/blog-dashboard-page.constants';

export interface BlogAuthorDetailsBackendDict {
  displayed_author_name: string;
  author_bio: string;
}
export interface BlogDashboardBackendResponse {
  author_details: BlogAuthorDetailsBackendDict;
  no_of_published_blog_posts: number;
  no_of_draft_blog_posts: number;
  published_blog_post_summary_dicts: BlogPostSummaryBackendDict[];
  draft_blog_post_summary_dicts: BlogPostSummaryBackendDict[];
}

interface NewBlogPostBackendResponse {
  blog_post_id: string;
}
export interface BlogDashboardData {
  displayedAuthorName: string;
  authorBio: string;
  numOfPublishedBlogPosts: number;
  numOfDraftBlogPosts: number;
  publishedBlogPostSummaryDicts: BlogPostSummary[];
  draftBlogPostSummaryDicts: BlogPostSummary[];
}
export interface BlogAuthorDetails {
  displayedAuthorName: string;
  authorBio: string;
}
@Injectable({
  providedIn: 'root',
})
export class BlogDashboardBackendApiService {
  constructor(private http: HttpClient) {}

  async fetchBlogDashboardDataAsync(): Promise<BlogDashboardData> {
    return new Promise((resolve, reject) => {
      this.http
        .get<BlogDashboardBackendResponse>(
          BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE
        )
        .toPromise()
        .then(
          response => {
            resolve({
              displayedAuthorName:
                response.author_details.displayed_author_name,
              authorBio: response.author_details.author_bio,
              numOfDraftBlogPosts: response.no_of_draft_blog_posts,
              numOfPublishedBlogPosts: response.no_of_published_blog_posts,
              publishedBlogPostSummaryDicts:
                response.published_blog_post_summary_dicts.map(
                  blogPostSummary => {
                    return BlogPostSummary.createFromBackendDict(
                      blogPostSummary
                    );
                  }
                ),
              draftBlogPostSummaryDicts:
                response.draft_blog_post_summary_dicts.map(blogPostSummary => {
                  return BlogPostSummary.createFromBackendDict(blogPostSummary);
                }),
            });
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async createBlogPostAsync(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.http
        .post<NewBlogPostBackendResponse>(
          BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE,
          {}
        )
        .toPromise()
        .then(
          response => {
            resolve(response.blog_post_id);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async updateAuthorDetailsAsync(
    displayedAuthorName: string,
    authorBio: string
  ): Promise<BlogAuthorDetails> {
    return new Promise((resolve, reject) => {
      const putData = {
        displayed_author_name: displayedAuthorName,
        author_bio: authorBio,
      };
      this.http
        .put<BlogAuthorDetailsBackendDict>(
          BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE,
          putData
        )
        .toPromise()
        .then(
          () => {
            resolve({
              displayedAuthorName: displayedAuthorName,
              authorBio: authorBio,
            });
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }
}
