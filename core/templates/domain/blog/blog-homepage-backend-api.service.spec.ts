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
 * @fileoverview Unit tests for BlogHomepageBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {
  BlogHomePageBackendApiService,
  BlogHomePageData,
  BlogPostPageData,
  BlogPostPageBackendResponse,
  BlogHomePageBackendResponse,
  SearchResponseData,
  SearchResponseBackendDict,
  BlogAuthorProfilePageBackendResponse,
  BlogAuthorProfilePageData,
} from 'domain/blog/blog-homepage-backend-api.service';
import {
  BlogPostSummary,
  BlogPostSummaryBackendDict,
} from 'domain/blog/blog-post-summary.model';
import {BlogPostBackendDict, BlogPostData} from 'domain/blog/blog-post.model';
import {BlogHomePageConstants} from 'pages/blog-home-page/blog-home-page.constants';
import {BlogAuthorDetailsBackendDict} from './blog-dashboard-backend-api.service';

describe('Blog home page backend api service', () => {
  let bhpbas: BlogHomePageBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;
  let blogHomePageBackendResponse: BlogHomePageBackendResponse;
  let blogPostSummary: BlogPostSummaryBackendDict = {
    id: 'sampleBlogId',
    author_username: 'test_username',
    displayed_author_name: 'test_user',
    title: 'sample_title',
    summary: 'hello',
    thumbnail_filename: 'image',
    tags: ['learners', 'news'],
    url_fragment: 'sample-url',
    last_updated: '3232323',
    published_on: '1212121',
  };
  let blogPost: BlogPostBackendDict = {
    id: 'sampleBlogId',
    displayed_author_name: 'test_user',
    title: 'sample_title',
    content: 'hello Blog Post',
    thumbnail_filename: 'image',
    tags: ['learners', 'news'],
    url_fragment: 'sample-url',
    last_updated: '3232323',
    published_on: '1212121',
  };
  let blogHomePageDataObject: BlogHomePageData;
  let blogPostSummaryObject: BlogPostSummary;
  let searchResponseData: SearchResponseData;
  let searchResponseBackendDict: SearchResponseBackendDict;
  let blogPostPageDataObject: BlogPostPageData;
  let blogPostObject: BlogPostData;
  let blogPostPageBackendResponse: BlogPostPageBackendResponse;
  let blogAuthorProfileBackendResponse: BlogAuthorProfilePageBackendResponse;
  let blogAuthorProfileDataObject: BlogAuthorProfilePageData;
  let urlSearchQuery: string;
  let blogAuthorBackendDetails: BlogAuthorDetailsBackendDict = {
    displayed_author_name: 'new_displayed_author_name',
    author_bio: 'general bio',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    bhpbas = TestBed.inject(BlogHomePageBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');

    blogHomePageBackendResponse = {
      list_of_default_tags: ['learners', 'news'],
      no_of_blog_post_summaries: 0,
      blog_post_summary_dicts: [] as BlogPostSummaryBackendDict[],
    };
    blogHomePageDataObject = {
      numOfPublishedBlogPosts: 0,
      blogPostSummaryDicts: [],
      listOfDefaultTags: ['learners', 'news'],
    };
    blogPostSummaryObject =
      BlogPostSummary.createFromBackendDict(blogPostSummary);
    searchResponseBackendDict = {
      search_offset: null,
      blog_post_summaries_list: [],
      list_of_default_tags: ['learners', 'news'],
    };
    searchResponseData = {
      searchOffset: null,
      blogPostSummariesList: [],
      listOfDefaultTags: ['learners', 'news'],
    };
    blogPostObject = BlogPostData.createFromBackendDict(blogPost);
    blogPostPageBackendResponse = {
      author_username: 'test_username',
      blog_post_dict: blogPost,
      summary_dicts: [] as BlogPostSummaryBackendDict[],
    };
    blogPostPageDataObject = {
      authorUsername: 'test_username',
      blogPostDict: blogPostObject,
      summaryDicts: [],
    };
    blogAuthorProfileBackendResponse = {
      author_details: blogAuthorBackendDetails,
      no_of_blog_post_summaries: 0,
      summary_dicts: [] as BlogPostSummaryBackendDict[],
    };
    blogAuthorProfileDataObject = {
      numOfBlogPostSummaries: 0,
      blogPostSummaries: [],
      displayedAuthorName: 'new_displayed_author_name',
      authorBio: 'general bio',
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch the blog home page data.', fakeAsync(() => {
    bhpbas.fetchBlogHomePageDataAsync('0').then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      BlogHomePageConstants.BLOG_HOMEPAGE_DATA_URL_TEMPLATE + '?offset=0'
    );
    expect(req.request.method).toEqual('GET');

    req.flush(blogHomePageBackendResponse);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(blogHomePageDataObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fetch the blog home page data with blog post summary data', fakeAsync(() => {
    blogHomePageBackendResponse.blog_post_summary_dicts = [blogPostSummary];
    blogHomePageDataObject.blogPostSummaryDicts = [blogPostSummaryObject];
    bhpbas.fetchBlogHomePageDataAsync('0').then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      BlogHomePageConstants.BLOG_HOMEPAGE_DATA_URL_TEMPLATE + '?offset=0'
    );
    expect(req.request.method).toEqual('GET');

    req.flush(blogHomePageBackendResponse);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(blogHomePageDataObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should use the rejection handler if the backend request fails to fetch' +
      'blog home page data',
    fakeAsync(() => {
      bhpbas.fetchBlogHomePageDataAsync('0').then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        BlogHomePageConstants.BLOG_HOMEPAGE_DATA_URL_TEMPLATE + '?offset=0'
      );
      expect(req.request.method).toEqual('GET');

      req.flush(
        {
          error: 'Some error in the backend.',
        },
        {
          status: 500,
          statusText: 'Internal Server Error',
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );

  it('should successfully fetch search data', fakeAsync(() => {
    urlSearchQuery = '?q=testBlogSearch&tags=("News"%20OR%20"Mathematics")';
    bhpbas
      .fetchBlogPostSearchResultAsync(urlSearchQuery)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      BlogHomePageConstants.BLOG_SEARCH_DATA_URL + urlSearchQuery
    );
    expect(req.request.method).toEqual('GET');

    req.flush(searchResponseBackendDict);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(searchResponseData);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should use the rejection handler if the backend request fails to fetch' +
      'search data',
    fakeAsync(() => {
      urlSearchQuery = '?q=testBlogSearch&tags=("News"%20OR%20"Mathematics")';
      bhpbas
        .fetchBlogPostSearchResultAsync(urlSearchQuery)
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        BlogHomePageConstants.BLOG_SEARCH_DATA_URL + urlSearchQuery
      );
      expect(req.request.method).toEqual('GET');

      req.flush(
        {
          error: 'Some error in the backend.',
        },
        {
          status: 500,
          statusText: 'Internal Server Error',
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );

  it('should fetch search data with blog post summary data', fakeAsync(() => {
    urlSearchQuery = '?q=testBlogSearch&tags=("News"%20OR%20"Mathematics")';
    searchResponseBackendDict.blog_post_summaries_list = [blogPostSummary];
    searchResponseData.blogPostSummariesList = [blogPostSummaryObject];
    bhpbas
      .fetchBlogPostSearchResultAsync(urlSearchQuery)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      BlogHomePageConstants.BLOG_SEARCH_DATA_URL + urlSearchQuery
    );
    expect(req.request.method).toEqual('GET');

    req.flush(searchResponseBackendDict);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(searchResponseData);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fetch the blog post data to populate blog post page', fakeAsync(() => {
    bhpbas
      .fetchBlogPostPageDataAsync('sample-url')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      BlogHomePageConstants.BLOG_HOMEPAGE_DATA_URL_TEMPLATE + '/sample-url'
    );
    expect(req.request.method).toEqual('GET');

    req.flush(blogPostPageBackendResponse);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(blogPostPageDataObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should fetch the blog post data to populate blog post page with summary' +
      'dicts',
    fakeAsync(() => {
      blogPostPageBackendResponse.summary_dicts = [blogPostSummary];
      blogPostPageDataObject.summaryDicts = [blogPostSummaryObject];
      bhpbas
        .fetchBlogPostPageDataAsync('sample-url')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        BlogHomePageConstants.BLOG_HOMEPAGE_DATA_URL_TEMPLATE + '/sample-url'
      );
      expect(req.request.method).toEqual('GET');

      req.flush(blogPostPageBackendResponse);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(blogPostPageDataObject);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should use the rejection handler if the backend request fails to fetch' +
      'blog post page data',
    fakeAsync(() => {
      bhpbas
        .fetchBlogPostPageDataAsync('sample-url')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        BlogHomePageConstants.BLOG_HOMEPAGE_DATA_URL_TEMPLATE + '/sample-url'
      );
      expect(req.request.method).toEqual('GET');

      req.flush(
        {
          error: 'Some error in the backend.',
        },
        {
          status: 500,
          statusText: 'Internal Server Error',
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );

  it('should successfully fetch the author profile page data.', fakeAsync(() => {
    bhpbas
      .fetchBlogAuthorProfilePageDataAsync('test_username', '0')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blog/author/data/test_username?offset=0'
    );
    expect(req.request.method).toEqual('GET');

    req.flush(blogAuthorProfileBackendResponse);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(blogAuthorProfileDataObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should fetch the blog author profile page data with blog post summary' +
      'data',
    fakeAsync(() => {
      blogAuthorProfileBackendResponse.summary_dicts = [blogPostSummary];
      blogAuthorProfileDataObject.blogPostSummaries = [blogPostSummaryObject];
      bhpbas
        .fetchBlogAuthorProfilePageDataAsync('test_username', '0')
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/blog/author/data/test_username?offset=0'
      );
      expect(req.request.method).toEqual('GET');

      req.flush(blogAuthorProfileBackendResponse);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(blogAuthorProfileDataObject);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should use the rejection handler if the backend request fails to fetch' +
      'blog home page data',
    fakeAsync(() => {
      bhpbas
        .fetchBlogAuthorProfilePageDataAsync('test_username', '0')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/blog/author/data/test_username?offset=0'
      );
      expect(req.request.method).toEqual('GET');

      req.flush(
        {
          error: 'Some error in the backend.',
        },
        {
          status: 500,
          statusText: 'Internal Server Error',
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );
});
