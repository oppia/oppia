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
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

interface BlogDashboardBackendResponse {
  'username': string;
  'profile_picture_data_url': string;
  'no_of_published_blog_posts': number;
  'no_of_draft_blog_posts': number;
  'published_blog_post_summary_dicts': BlogPostSummaryBackendDict[];
  'draft_blog_post_summary_dicts': BlogPostSummaryBackendDict[];
}

interface NewBlogPostBackendResponse {
  'blog_post_id': string;
}

interface HourlyStats {
  [hourKey: string]: number;
}

interface WeeklyStats {
  [dateKey: string]: number;
}

interface MonthlyStats {
  [dateKey: string]: number;
}

interface YearlyStats {
  [monthKey: string]: number;
}

interface AllStats {
  [yearKey: string]: YearlyStats;
}

interface BlogPostReadsStatsBackendDict {
  'blog_post_id': string;
  'hourly_reads': HourlyStats;
  'weekly_reads': WeeklyStats;
  'monthly_reads': MonthlyStats;
  'yearly_reads': YearlyStats;
  'all_reads': AllStats;
}

interface BlogPostViewsStatsBackendDict {
  'blog_post_id': string;
  'hourly_views': HourlyStats;
  'weekly_views': WeeklyStats;
  'monthly_views': MonthlyStats;
  'yearly_views': YearlyStats;
  'all_views': AllStats;
}

interface BlogPostReadingTimeStatsBackendDict {
  'blog_post_id': string;
  'zero_to_one_min': number;
  'one_to_two_min': number;
  'two_to_three_min': number;
  'three_to_four_min': number;
  'four_to_five_min': number;
  'five_to_six_min': number;
  'six_to_seven_min': number;
  'seven_to_eight_min': number;
  'eight_to_nine_min': number;
  'nine_to_ten_min': number;
  'more_than_ten_min': number;
}

export interface BlogPostViewsStats {
  blogPostId: string;
  hourlyViews: HourlyStats;
  weeklyViews: WeeklyStats;
  monthlyViews: MonthlyStats;
  yearlyViews: YearlyStats;
  allViews: AllStats;
}

export interface BlogPostReadsStats {
  blogPostId: string;
  hourlyReads: HourlyStats;
  weeklyReads: WeeklyStats;
  monthlyReads: MonthlyStats;
  yearlyReads: YearlyStats;
  allReads: AllStats;
}

export interface AuthorBlogPostViewsStats {
  hourlyViews: HourlyStats;
  weeklyViews: WeeklyStats;
  monthlyViews: MonthlyStats;
  yearlyViews: YearlyStats;
  allViews: AllStats;
}

export interface AuthorBlogPostReadsStats {
  hourlyReads: HourlyStats;
  weeklyReads: WeeklyStats;
  monthlyReads: MonthlyStats;
  yearlyReads: YearlyStats;
  allReads: AllStats;
}

export interface BlogPostReadingTimeStats {
  blogPostId: string;
  zeroToOneMin: number;
  oneToTwoMin: number;
  twoToThreeMin: number;
  threeToFourMin: number;
  fourToFiveMin: number;
  fiveToSixMin: number;
  sixToSevenMin: number;
  sevenToEightMin: number;
  eightToNineMin: number;
  nineToTenMin: number;
  moreThanTenMin: number;
}

export interface BlogDashboardData {
  username: string;
  profilePictureDataUrl: string;
  numOfPublishedBlogPosts: number;
  numOfDraftBlogPosts: number;
  publishedBlogPostSummaryDicts: BlogPostSummary[];
  draftBlogPostSummaryDicts: BlogPostSummary[];
}
@Injectable({
  providedIn: 'root'
})
export class BlogDashboardBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

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
            publishedBlogPostSummaryDicts: (
              response.published_blog_post_summary_dicts.map(
                blogPostSummary => {
                  return BlogPostSummary.createFromBackendDict(blogPostSummary);
                })),
            draftBlogPostSummaryDicts: (
              response.draft_blog_post_summary_dicts.map(
                blogPostSummary => {
                  return BlogPostSummary.createFromBackendDict(blogPostSummary);
                })),
          });
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async createBlogPostAsync(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.http.post<NewBlogPostBackendResponse>(
        BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE, {}
      ).toPromise().then(response => {
        resolve(response.blog_post_id);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async fetchBlogPostViewsStatsAsync(
      blogPostId: string
  ): Promise<BlogPostViewsStats> {
    const statsHandlerUrl = (
      this.urlInterpolationService.interpolateUrl(
        BlogDashboardPageConstants.BLOG_POST_STATS_DATA_URL_TEMPLATE, {
          blog_post_id: blogPostId,
          chart_type: BlogDashboardPageConstants.STATS_CHART_TYPES.READS_CHART
        }
      )
    );
    return new Promise((resolve, reject) => {
      this.http.get<BlogPostViewsStatsBackendDict>(
        statsHandlerUrl).toPromise().then(response => {
        resolve({
          blogPostId: response.blog_post_id,
          hourlyViews: response.hourly_views,
          weeklyViews: response.weekly_views,
          monthlyViews: response.monthly_views,
          yearlyViews: response.yearly_views,
          allViews: response.all_views,
        });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async fetchBlogPostReadsStatsAsync(
      blogPostId: string
  ): Promise<BlogPostReadsStats> {
    const statsHandlerUrl = (
      this.urlInterpolationService.interpolateUrl(
        BlogDashboardPageConstants.BLOG_POST_STATS_DATA_URL_TEMPLATE, {
          blog_post_id: blogPostId,
          chart_type: BlogDashboardPageConstants.STATS_CHART_TYPES.READS_CHART
        }
      )
    );
    return new Promise((resolve, reject) => {
      this.http.get<BlogPostReadsStatsBackendDict>(
        statsHandlerUrl).toPromise().then(response => {
        resolve({
          blogPostId: response.blog_post_id,
          hourlyReads: response.hourly_reads,
          weeklyReads: response.weekly_reads,
          monthlyReads: response.monthly_reads,
          yearlyReads: response.yearly_reads,
          allReads: response.all_reads,
        });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }


  async fetchBlogPostReadingTimeStatsAsync(
      blogPostId: string
  ): Promise<BlogPostReadingTimeStats> {
    const statsHandlerUrl = (
      this.urlInterpolationService.interpolateUrl(
        BlogDashboardPageConstants.BLOG_POST_STATS_DATA_URL_TEMPLATE, {
          blog_post_id: blogPostId,
          chart_type: BlogDashboardPageConstants.STATS_CHART_TYPES.READING_TIME
        }
      )
    );
    return new Promise((resolve, reject) => {
      this.http.get<BlogPostReadingTimeStatsBackendDict>(
        statsHandlerUrl).toPromise().then(response => {
        resolve({
          blogPostId: response.blog_post_id,
          zeroToOneMin: response.zero_to_one_min,
          oneToTwoMin: response.one_to_two_min,
          twoToThreeMin: response.two_to_three_min,
          threeToFourMin: response.three_to_four_min,
          fourToFiveMin: response.four_to_five_min,
          fiveToSixMin: response.five_to_six_min,
          sixToSevenMin: response.six_to_seven_min,
          sevenToEightMin: response.seven_to_eight_min,
          eightToNineMin: response.eight_to_nine_min,
          nineToTenMin: response.nine_to_ten_min,
          moreThanTenMin: response.more_than_ten_min,
        });
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }
}

angular.module('oppia').factory(
  'BlogDashboardBackendApiService',
  downgradeInjectable(BlogDashboardBackendApiService));
