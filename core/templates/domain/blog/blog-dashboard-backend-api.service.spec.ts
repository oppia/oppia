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
 * @fileoverview Unit tests for BlogDashboardBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { BlogDashboardBackendApiService } from 'domain/blog/blog-dashboard-backend-api.service';
import { BlogDashboardPageConstants } from 'pages/blog-dashboard-page/blog-dashboard-page.constants';
import { BlogPostSummary, BlogPostSummaryBackendDict } from 'domain/blog/blog-post-summary.model';

describe('Blog Dashboard backend api service', () => {
  let bdbas: BlogDashboardBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;
  let blogDashboardBackendResponse = {
    username: 'testUsername',
    profile_picture_data_url: 'image',
    no_of_published_blog_posts: 0,
    no_of_draft_blog_posts: 0,
    published_blog_post_summary_dicts: [] as BlogPostSummaryBackendDict[],
    draft_blog_post_summary_dicts: [] as BlogPostSummaryBackendDict[]
  };
  let blogPostSummary: BlogPostSummaryBackendDict = {
    id: 'sampleBlogId',
    author_username: 'test_user',
    title: 'sample_title',
    summary: 'hello',
    thumbnail_filename: 'image',
    tags: ['learners', 'news'],
    url_fragment: 'sample#url',
    last_updated: '3232323',
    published_on: '1212121',
  };
  let blogDashboardDataObject = {
    username: blogDashboardBackendResponse.username,
    profilePictureDataUrl: (
      blogDashboardBackendResponse.profile_picture_data_url),
    numOfDraftBlogPosts: blogDashboardBackendResponse.no_of_draft_blog_posts,
    numOfPublishedBlogPosts: (
      blogDashboardBackendResponse.no_of_published_blog_posts),
    publishedBlogPostSummaryDicts: [] as BlogPostSummary[],
    draftBlogPostSummaryDicts: [] as BlogPostSummary[],
  };
  let blogPostSummaryObject = BlogPostSummary.createFromBackendDict(
    blogPostSummary);
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    bdbas = TestBed.inject(BlogDashboardBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch the blog dashboard data.', fakeAsync(() => {
    bdbas.fetchBlogDashboardDataAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE);
    expect(req.request.method).toEqual('GET');
    req.flush(blogDashboardBackendResponse);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(blogDashboardDataObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fetch the blog dashboard data with blog post summary data',
    fakeAsync(() => {
      blogDashboardBackendResponse.published_blog_post_summary_dicts = [
        blogPostSummary];
      blogDashboardBackendResponse.draft_blog_post_summary_dicts = [
        blogPostSummary];
      blogDashboardDataObject.publishedBlogPostSummaryDicts = [
        blogPostSummaryObject];
      blogDashboardDataObject.draftBlogPostSummaryDicts = [
        blogPostSummaryObject];
      bdbas.fetchBlogDashboardDataAsync().then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE);
      expect(req.request.method).toEqual('GET');
      req.flush(blogDashboardBackendResponse);

      flushMicrotasks();
      expect(successHandler).toHaveBeenCalledWith(blogDashboardDataObject);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use the rejection handler if the backend request failed.',
    fakeAsync(() => {
      bdbas.fetchBlogDashboardDataAsync().then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE);
      expect(req.request.method).toEqual('GET');

      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    })
  );

  it('should post image data successfully to the backend', fakeAsync(() => {
    bdbas.createBlogPostAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE);
    expect(req.request.method).toEqual('POST');
    req.flush({blog_post_id: 'newBlogId'});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith('newBlogId');
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler if the request for new blog failed.',
    fakeAsync(() => {
      bdbas.createBlogPostAsync().then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE);
      expect(req.request.method).toEqual('POST');

      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    })
  );
});
