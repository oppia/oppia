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

import { downgradeInjectable } from '@angular/upgrade/static';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BlogPostSummaryBackendDict, BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { BlogDashboardPageConstants } from 'pages/blog-dashboard-page/blog-dashboard-page.constants';
interface BlogDashboardBackendResponse {
  'username': string;
  'profile_picture_data_url': string;
  'no_of_published_blog_posts': number;
  'no_of_draft_blog_posts': number;
  'published_blog_post_summary_dicts': BlogPostSummaryBackendDict[];
  'draft_blog_post_summary_dicts': BlogPostSummaryBackendDict[];
}

export interface BlogDashboardData {
  username: string;
  profilePictureDataUrl: string;
  numOfPublishedBlogPosts: number;
  numOfDraftBlogPosts: number;
  publishedBlogPostSummaryDicts: BlogPostSummary[];
  draftBlogPostSummaryDicts: BlogPostSummary[]
}

@Injectable({
  providedIn: 'root'
})
export class BlogDashboardBackendApiService {
  constructor(
    private http: HttpClient) {}

  async fetchBlogDashboardDataAsync(): Promise<BlogDashboardData> {
    return new Promise((resolve, reject) => {
      this.http.get<BlogDashboardBackendResponse>(
        BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE).toPromise()
        .then(response => {
          resolve({
            username: response.username,
            profilePictureDataUrl: response.profile_picture_data_url,
            numOfDraftBlogPosts: response.no_of_draft_blog_posts,
            numOfPublishedBlogPosts: response.no_of_published_blog_posts,
            publishedBlogPostSummaryDicts: response.published_blog_post_summary_dicts.map(
              blogPostSummary => {
                return BlogPostSummary.createFromBackendDict(blogPostSummary);
              }),
            draftBlogPostSummaryDicts: response.draft_blog_post_summary_dicts.map(
              blogPostSummary => {
                return BlogPostSummary.createFromBackendDict(blogPostSummary);
              }),
          });
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async createBlogPostAsync(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.http.post<string>(
        BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE, {}).toPromise()
      .then(response => {
        resolve(response);
      }, errorResponse => {
          reject(errorResponse.error.error);
      });
    });
  }
}

angular.module('oppia').factory(
  'BlogDashboardBackendApiService',
  downgradeInjectable(BlogDashboardBackendApiService));