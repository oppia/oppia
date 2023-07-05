// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to get data for to a blog homepage from backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BlogPostSummaryBackendDict, BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { BlogHomePageConstants } from 'pages/blog-home-page/blog-home-page.constants';
import { BlogPostPageConstants } from 'pages/blog-post-page/blog-post-page.constants';
import { BlogPostBackendDict, BlogPostData } from 'domain/blog/blog-post.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { BlogAuthorProfilePageConstants } from 'pages/blog-author-profile-page/blog-author-profile-page.constants';
import { BlogAuthorDetailsBackendDict } from './blog-dashboard-backend-api.service';

export interface BlogHomePageBackendResponse {
  'no_of_blog_post_summaries': number;
  'blog_post_summary_dicts': BlogPostSummaryBackendDict[];
  'list_of_default_tags': string[];
}

export interface BlogAuthorProfilePageBackendResponse {
  'author_details': BlogAuthorDetailsBackendDict;
  'no_of_blog_post_summaries': number;
  'summary_dicts': BlogPostSummaryBackendDict[];
}

export interface SearchResponseBackendDict {
  'search_offset': number | null;
  'blog_post_summaries_list': BlogPostSummaryBackendDict[];
  'list_of_default_tags': string[];
}

export interface BlogPostPageBackendResponse {
  'author_username': string;
  'blog_post_dict': BlogPostBackendDict;
  'summary_dicts': BlogPostSummaryBackendDict[];
}

export interface SearchResponseData {
  searchOffset: number | null;
  blogPostSummariesList: BlogPostSummary[];
  listOfDefaultTags: string[];
}

export interface BlogHomePageData {
  numOfPublishedBlogPosts: number;
  blogPostSummaryDicts: BlogPostSummary[];
  listOfDefaultTags: string[];
}

export interface BlogPostPageData {
  authorUsername: string;
  blogPostDict: BlogPostData;
  summaryDicts: BlogPostSummary[];
}

export interface BlogAuthorProfilePageData {
  displayedAuthorName: string;
  authorBio: string;
  numOfBlogPostSummaries: number;
  blogPostSummaries: BlogPostSummary[];
}

@Injectable({
  providedIn: 'root'
})

export class BlogHomePageBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService,
  ) {}

  async fetchBlogHomePageDataAsync(
      offset: string
  ): Promise<BlogHomePageData> {
    return new Promise((resolve, reject) => {
      this.http.get<BlogHomePageBackendResponse>(
        BlogHomePageConstants.BLOG_HOMEPAGE_DATA_URL_TEMPLATE + '?offset=' +
        offset
      ).toPromise().then(response => {
        resolve({
          numOfPublishedBlogPosts: response.no_of_blog_post_summaries,
          listOfDefaultTags: response.list_of_default_tags,
          blogPostSummaryDicts: (
            response.blog_post_summary_dicts.map(
              blogPostSummary => {
                return BlogPostSummary.createFromBackendDict(blogPostSummary);
              })),
        });
      }, errorResponse => {
        reject(errorResponse);
      });
    });
  }


  async fetchBlogAuthorProfilePageDataAsync(
      authorUsername: string, offset: string
  ): Promise<BlogAuthorProfilePageData> {
    return new Promise((resolve, reject) => {
      const authorProfilePageUrl = this.urlInterpolationService.interpolateUrl(
        BlogAuthorProfilePageConstants.BLOG_AUTHOR_PROFILE_PAGE_DATA_URL_TEMPLATE, { // eslint-disable-line max-len
          author_username: authorUsername
        });
      this.http.get<BlogAuthorProfilePageBackendResponse>(
        authorProfilePageUrl + '?offset=' + offset
      ).toPromise().then(response => {
        resolve({
          numOfBlogPostSummaries: response.no_of_blog_post_summaries,
          blogPostSummaries: (
            response.summary_dicts.map(
              blogPostSummary => {
                return BlogPostSummary.createFromBackendDict(blogPostSummary);
              })),
          displayedAuthorName: response.author_details.displayed_author_name,
          authorBio: response.author_details.author_bio
        });
      }, errorResponse => {
        reject(errorResponse);
      });
    });
  }

  async fetchBlogPostSearchResultAsync(
      searchQuery: string): Promise<SearchResponseData> {
    return new Promise((resolve, reject) => {
      this.http.get<SearchResponseBackendDict>(
        BlogHomePageConstants.BLOG_SEARCH_DATA_URL + searchQuery
      ).toPromise().then(response => {
        resolve({
          searchOffset: response.search_offset,
          listOfDefaultTags: response.list_of_default_tags,
          blogPostSummariesList: (
            response.blog_post_summaries_list.map(
              blogPostSummary => {
                return BlogPostSummary.createFromBackendDict(blogPostSummary);
              })),
        });
      }, errorResponse => {
        reject(errorResponse);
      });
    });
  }

  async fetchBlogPostPageDataAsync(
      blogPostUrl: string): Promise<BlogPostPageData> {
    return new Promise((resolve, reject) => {
      const blogPostDataUrl = this.urlInterpolationService.interpolateUrl(
        BlogPostPageConstants.BLOG_POST_PAGE_DATA_URL_TEMPLATE, {
          blog_post_url: blogPostUrl
        });
      this.http.get<BlogPostPageBackendResponse>(blogPostDataUrl).toPromise()
        .then(response => {
          resolve({
            authorUsername: response.author_username,
            summaryDicts: (
              response.summary_dicts.map(
                blogPostSummary => {
                  return BlogPostSummary.createFromBackendDict(blogPostSummary);
                })),
            blogPostDict: BlogPostData.createFromBackendDict(
              response.blog_post_dict),
          });
        }, errorResponse => {
          reject(errorResponse);
        });
    });
  }
}

angular.module('oppia').factory(
  'BlogHomePageBackendApiService',
  downgradeInjectable(BlogHomePageBackendApiService));
