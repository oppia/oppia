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
import {
  AuthorBlogPostReadingTimeStatsBackendDict,
  AuthorBlogPostReadsStatsBackendDict,
  AuthorBlogPostViewsStatsBackendDict,
  BlogAuthorDetails,
  BlogAuthorDetailsBackendDict,
  BlogDashboardBackendApiService,
  BlogDashboardBackendResponse,
  BlogDashboardData,
  BlogPostReadingTimeStats,
  BlogPostReadingTimeStatsBackendDict,
  BlogPostReadsStats,
  BlogPostReadsStatsBackendDict,
  BlogPostViewsStats,
  BlogPostViewsStatsBackendDict,
  ReadingTimeStats,
  ReadingTimeStatsBackendDict,
  Stats,
} from 'domain/blog/blog-dashboard-backend-api.service';
import { BlogDashboardPageConstants } from 'pages/blog-dashboard-page/blog-dashboard-page.constants';
import { BlogPostSummary, BlogPostSummaryBackendDict } from 'domain/blog/blog-post-summary.model';

describe('Blog Dashboard backend api service', () => {
  let bdbas: BlogDashboardBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;
  let authorDetials: BlogAuthorDetailsBackendDict = {
    displayed_author_name: 'test_name',
    author_bio: 'author bio',
  };
  let blogDashboardBackendResponse: BlogDashboardBackendResponse = {
    author_details: authorDetials,
    profile_picture_data_url: 'image',
    no_of_published_blog_posts: 0,
    no_of_draft_blog_posts: 0,
    published_blog_post_summary_dicts: [] as BlogPostSummaryBackendDict[],
    draft_blog_post_summary_dicts: [] as BlogPostSummaryBackendDict[]
  };
  let blogPostSummary: BlogPostSummaryBackendDict = {
    id: 'sampleBlogId',
    author_username: 'test_sername',
    displayed_author_name: 'test_user',
    title: 'sample_title',
    summary: 'hello',
    thumbnail_filename: 'image',
    tags: ['learners', 'news'],
    url_fragment: 'sample#url',
    last_updated: '3232323',
    published_on: '1212121',
  };
  let blogDashboardDataObject: BlogDashboardData = {
    displayedAuthorName: 'test_name',
    authorBio: 'author bio',
    profilePictureDataUrl: (
      blogDashboardBackendResponse.profile_picture_data_url),
    numOfDraftBlogPosts: blogDashboardBackendResponse.no_of_draft_blog_posts,
    numOfPublishedBlogPosts: (
      blogDashboardBackendResponse.no_of_published_blog_posts),
    publishedBlogPostSummaryDicts: [] as BlogPostSummary[],
    draftBlogPostSummaryDicts: [] as BlogPostSummary[],
  };
  let blogAuthorBackendDetails: BlogAuthorDetailsBackendDict = {
    displayed_author_name: 'new_displayed_author_name',
    author_bio: 'general bio'
  };
  let blogAuthorDetails: BlogAuthorDetails = {
    displayedAuthorName: 'new_displayed_author_name',
    authorBio: 'general bio'
  };
  let blogPostSummaryObject = BlogPostSummary.createFromBackendDict(
    blogPostSummary);
  let hourlyStats: {[key: string]: number} = {
    '00': 100,
    '02': 200,
    '03': 400,
    '04': 100
  };
  let weeklyStats: {[key: string]: number} = {
    '02': 200,
    '03': 400,
    '04': 100,
    '06': 300,
    '07': 100,
    '08': 200
  };
  let monthlyStats: {[key: string]: number} = {
    '01': 100,
    '02': 200,
    '03': 400,
    '04': 100,
    '06': 300,
    '07': 100,
    '08': 200
  };
  let yearlyStats: {[key: string]: number} = {
    '01': 100,
    '02': 200,
    '03': 400,
    '04': 100,
    '06': 300,
    '07': 100,
    '08': 200,
    '09': 300,
    10: 400,
    11: 10,
    12: 10
  };
  let allStats: {[key: string]: {[key: string]: number}} = {
    2022: {
      '01': 100,
      '02': 200,
      '03': 400,
      '04': 100,
      '06': 300,
      '07': 100,
      '08': 200,
      '09': 300,
      10: 0,
      11: 0,
      12: 0
    },
    2021: {
      '01': 100,
      '02': 200,
      '03': 400,
      '04': 100,
      '06': 300,
      '07': 100,
      '08': 200,
      '09': 300,
      10: 0,
      11: 400,
      12: 0
    }
  };
  let readingTimeStatsBackendDict: ReadingTimeStatsBackendDict = {
    zero_to_one_min: 0,
    one_to_two_min: 10,
    two_to_three_min: 20,
    three_to_four_min: 0,
    four_to_five_min: 0,
    five_to_six_min: 0,
    six_to_seven_min: 0,
    seven_to_eight_min: 0,
    eight_to_nine_min: 0,
    nine_to_ten_min: 0,
    more_than_ten_min: 0,
  };
  let authorReadingTimeBackendDic: AuthorBlogPostReadingTimeStatsBackendDict = {
    stats: readingTimeStatsBackendDict,
  };
  let authorReadingTimeStatsObj: ReadingTimeStats = {
    zeroToOneMin: 0,
    oneToTwoMin: 10,
    twoToThreeMin: 20,
    threeToFourMin: 0,
    fourToFiveMin: 0,
    fiveToSixMin: 0,
    sixToSevenMin: 0,
    sevenToEightMin: 0,
    eightToNineMin: 0,
    nineToTenMin: 0,
    moreThanTenMin: 0,
  };
  let blogPostViewsStatsBackendDict: BlogPostViewsStatsBackendDict = {
    blog_post_id: 'sample_id',
    stats: {
      hourly_views: hourlyStats,
      weekly_views: weeklyStats,
      monthly_views: monthlyStats,
      yearly_views: yearlyStats,
      all_views: allStats,
    }
  };

  let blogPostViewsStatsObject: BlogPostViewsStats = {
    blogPostId: 'sample_id',
    hourlyViews: hourlyStats,
    weeklyViews: weeklyStats,
    monthlyViews: monthlyStats,
    yearlyViews: yearlyStats,
    allViews: allStats,
  };
  let authorBlogPostViewsStatsBackendDict: AuthorBlogPostViewsStatsBackendDict;
  authorBlogPostViewsStatsBackendDict = {
    stats: {
      hourly_views: hourlyStats,
      weekly_views: weeklyStats,
      monthly_views: monthlyStats,
      yearly_views: yearlyStats,
      all_views: allStats,
    }
  };
  let authorStatsObject: Stats = {
    hourlyStats: hourlyStats,
    weeklyStats: weeklyStats,
    monthlyStats: monthlyStats,
    yearlyStats: yearlyStats,
    allStats: allStats,
  };

  let blogPostReadsStatsBackendDict: BlogPostReadsStatsBackendDict = {
    blog_post_id: 'sample_id',
    stats: {
      hourly_reads: hourlyStats,
      weekly_reads: weeklyStats,
      monthly_reads: monthlyStats,
      yearly_reads: yearlyStats,
      all_reads: allStats,
    }
  };

  let blogPostReadsStatsObject: BlogPostReadsStats = {
    blogPostId: 'sample_id',
    hourlyReads: hourlyStats,
    weeklyReads: weeklyStats,
    monthlyReads: monthlyStats,
    yearlyReads: yearlyStats,
    allReads: allStats,
  };
  let authorBlogPostReadsStatsBackendDict: AuthorBlogPostReadsStatsBackendDict;
  authorBlogPostReadsStatsBackendDict = {
    stats: {
      hourly_reads: hourlyStats,
      weekly_reads: weeklyStats,
      monthly_reads: monthlyStats,
      yearly_reads: yearlyStats,
      all_reads: allStats,
    }
  };
  let blogPostReadingTimeStatsBackendDict: BlogPostReadingTimeStatsBackendDict;
  blogPostReadingTimeStatsBackendDict = {
    blog_post_id: 'sample_id',
    stats: readingTimeStatsBackendDict
  };
  let blogPostReadingTimeStatsObj: BlogPostReadingTimeStats = {
    blogPostId: 'sample_id',
    zeroToOneMin: 0,
    oneToTwoMin: 10,
    twoToThreeMin: 20,
    threeToFourMin: 0,
    fourToFiveMin: 0,
    fiveToSixMin: 0,
    sixToSevenMin: 0,
    sevenToEightMin: 0,
    eightToNineMin: 0,
    nineToTenMin: 0,
    moreThanTenMin: 0,
  };

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

  it('should successfully update author details in the backend.', fakeAsync(
    () => {
      bdbas.updateAuthorDetailsAsync(
        blogAuthorBackendDetails.displayed_author_name,
        blogAuthorBackendDetails.author_bio
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE);
      expect(req.request.method).toEqual('PUT');
      req.flush(blogAuthorBackendDetails);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(blogAuthorDetails);
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should use the rejection handler if updating author details in the' +
  ' backend fails.', fakeAsync(
    () => {
      bdbas.updateAuthorDetailsAsync(
        blogAuthorBackendDetails.displayed_author_name,
        blogAuthorBackendDetails.author_bio
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        BlogDashboardPageConstants.BLOG_DASHBOARD_DATA_URL_TEMPLATE);
      expect(req.request.method).toEqual('PUT');
      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Some error in the backend.');
    }));

  it('should fetch the blog post views stats for the given blog post id',
    fakeAsync(() => {
      bdbas.fetchBlogPostViewsStatsAsync(
        'sample_id'
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/blogdashboardhandler/stats/data/sample_id/views');
      expect(req.request.method).toEqual('GET');
      req.flush(blogPostViewsStatsBackendDict);

      flushMicrotasks();
      expect(successHandler).toHaveBeenCalledWith(blogPostViewsStatsObject);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use the rejection handler if fetching the blog post views stats' +
  'for the given blog post id fails', fakeAsync(() => {
    bdbas.fetchBlogPostViewsStatsAsync(
      'sample_id'
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogdashboardhandler/stats/data/sample_id/views');
    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Some error in the backend.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Some error in the backend.'
    );
  }));


  it('should fetch the author blog post views stats', fakeAsync(() => {
    bdbas.fetchAuthorBlogViewsStatsAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogdashboardhandler/authorstats/data/views');
    expect(req.request.method).toEqual('GET');
    req.flush(authorBlogPostViewsStatsBackendDict);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(authorStatsObject);
    expect(failHandler).not.toHaveBeenCalled();
  })
  );

  it('should use the rejection handler if fetching the blog post views stats' +
  'for the given blog post id fails', fakeAsync(() => {
    bdbas.fetchAuthorBlogViewsStatsAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogdashboardhandler/authorstats/data/views');
    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Some error in the backend.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Some error in the backend.'
    );
  }));

  it('should fetch the blog post reads stats for the given blog post id',
    fakeAsync(() => {
      bdbas.fetchBlogPostReadsStatsAsync(
        'sample_id'
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/blogdashboardhandler/stats/data/sample_id/reads');
      expect(req.request.method).toEqual('GET');
      req.flush(blogPostReadsStatsBackendDict);

      flushMicrotasks();
      expect(successHandler).toHaveBeenCalledWith(blogPostReadsStatsObject);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use the rejection handler if fetching the blog post reads stats' +
  'for the given blog post id fails', fakeAsync(() => {
    bdbas.fetchBlogPostReadsStatsAsync(
      'sample_id'
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogdashboardhandler/stats/data/sample_id/reads');
    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Some error in the backend.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Some error in the backend.'
    );
  }));


  it('should fetch the author blog post reads stats', fakeAsync(() => {
    bdbas.fetchAuthorBlogReadsStatsAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogdashboardhandler/authorstats/data/reads');
    expect(req.request.method).toEqual('GET');
    req.flush(authorBlogPostReadsStatsBackendDict);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(authorStatsObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler if fetching the author reads stats' +
  'for the given a author fails', fakeAsync(() => {
    bdbas.fetchAuthorBlogReadsStatsAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogdashboardhandler/authorstats/data/reads');
    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Some error in the backend.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Some error in the backend.'
    );
  }));


  it('should fetch the author blog post reading time stats', fakeAsync(() => {
    bdbas.fetchAuthorBlogReadingTimeStatsAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogdashboardhandler/authorstats/data/reading_time');
    expect(req.request.method).toEqual('GET');
    req.flush(authorReadingTimeBackendDic);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(authorReadingTimeStatsObj);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler if fetching the author reading time ' +
  'stats for the given a author fails', fakeAsync(() => {
    bdbas.fetchAuthorBlogReadingTimeStatsAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogdashboardhandler/authorstats/data/reading_time');
    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Some error in the backend.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Some error in the backend.'
    );
  }));

  it('should fetch the blog post reading time stats for the given blog post id',
    fakeAsync(() => {
      bdbas.fetchBlogPostReadingTimeStatsAsync(
        'sample_id'
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/blogdashboardhandler/stats/data/sample_id/reading_time');
      expect(req.request.method).toEqual('GET');
      req.flush(blogPostReadingTimeStatsBackendDict);

      flushMicrotasks();
      expect(successHandler).toHaveBeenCalledWith(blogPostReadingTimeStatsObj);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use the rejection handler if fetching the blog post reading time' +
  ' stats for the given blog post id fails', fakeAsync(() => {
    bdbas.fetchBlogPostReadingTimeStatsAsync(
      'sample_id'
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogdashboardhandler/stats/data/sample_id/reading_time');
    expect(req.request.method).toEqual('GET');
    req.flush({
      error: 'Some error in the backend.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Some error in the backend.'
    );
  }));
});
