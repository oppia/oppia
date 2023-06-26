// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for blog post editor.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import { BlogPostViewsStats,
  BlogPostReadsStats,
  Stats,
  ReadingTimeStats,
  BlogPostReadingTimeStats,
  BlogDashboardBackendApiService
} from 'domain/blog/blog-dashboard-backend-api.service';
import { MaterialModule } from 'modules/material.module';
import { BlogDashboardPageConstants } from '../blog-dashboard-page.constants';
import { BlogDashboardPageService } from '../services/blog-dashboard-page.service';
import { BlogStatisticsTabComponent } from './blog-statistics-tab.component';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ElementRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { AlertsService } from 'services/alerts.service';

describe('Blog Dashboard Statistics Component', () => {
  let component: BlogStatisticsTabComponent;
  let fixture: ComponentFixture<BlogStatisticsTabComponent>;
  let blogDashboardBackendApiService: BlogDashboardBackendApiService;
  let alertsService: AlertsService;
  let readingTimeStatsObj: ReadingTimeStats = {
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
  let hourlyStats: {[key: string]: number} = {
    '00_': 100,
    '02_': 200,
    '03_': 400,
    '04_': 100
  };
  let weeklyStats: {[key: string]: number} = {
    '02_': 200,
    '03_': 400,
    '04_': 100,
    '05_': 200,
    '06_': 300,
    '07_': 100,
    '08_': 200
  };
  let monthlyStats: {[key: string]: number} = {
    '01_': 100,
    '02_': 200,
    '03_': 400,
    '04_': 100,
    '05_': 200,
    '06_': 300,
    '07_': 100,
    '08_': 200
  };
  let yearlyStats: {[key: string]: number} = {
    '01_': 100,
    '02_': 200,
    '03_': 400,
    '04_': 100,
    '05_': 200,
    '06_': 300,
    '07_': 100,
    '08_': 200,
    '09_': 300,
    '10_': 400,
    '11_': 10,
    '12_': 10
  };
  let allStats: {[key: string]: {[key: string]: number}} = {
    2022: {
      '01_': 100,
      '02_': 200,
      '03_': 400,
      '04_': 100,
      '05_': 200,
      '06_': 300,
      '07_': 100,
      '08_': 200,
      '09_': 300,
      '10_': 0,
      '11_': 0,
      '12_': 0
    },
    2021: {
      '01_': 100,
      '02_': 200,
      '03_': 400,
      '04_': 100,
      '05_': 200,
      '06_': 300,
      '07_': 100,
      '08_': 200,
      '09_': 300,
      '10__': 0,
      '11_': 400,
      '12_': 0
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
  let statsObject: Stats = {
    hourlyStats: hourlyStats,
    weeklyStats: weeklyStats,
    monthlyStats: monthlyStats,
    yearlyStats: yearlyStats,
    allStats: allStats,
  };
  let blogPostReadsStatsObject: BlogPostReadsStats = {
    blogPostId: 'sample_id',
    hourlyReads: hourlyStats,
    weeklyReads: weeklyStats,
    monthlyReads: monthlyStats,
    yearlyReads: yearlyStats,
    allReads: allStats,
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
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MaterialModule,
      ],
      declarations: [
        BlogStatisticsTabComponent,
        MockTranslatePipe
      ],
      providers: [
        BlogDashboardBackendApiService,
        BlogDashboardPageService,
        UrlInterpolationService,
        AlertsService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogStatisticsTabComponent);
    component = fixture.componentInstance;
    blogDashboardBackendApiService = TestBed.inject(
      BlogDashboardBackendApiService);
    alertsService = TestBed.inject(AlertsService);
    let svgContainer = document.createElement('div');
    svgContainer.setAttribute('id', 'barStats');
    svgContainer.appendChild(document.createElement('svg'));
    component.chartContainer = new ElementRef(
      document.createElement('div').appendChild(svgContainer));
    let baseTime = new Date();
    baseTime.setHours(5);
    baseTime.setFullYear(2022, 10, 20);
    jasmine.clock().mockDate(baseTime);
  });

  it('should initialize', fakeAsync(() => {
    expect(component.authorAggregatedStatsShown).toBeUndefined();
    expect(component.selectedChartType).toBeUndefined();
    spyOn(component, 'showHourlyStats');
    spyOn(alertsService, 'addWarning');
    spyOn(blogDashboardBackendApiService, 'fetchAuthorBlogViewsStatsAsync')
      .and.returnValue(Promise.resolve(statsObject));

    component.ngOnInit();

    expect(component.authorAggregatedStatsShown).toBeTrue();
    expect(component.selectedChartType).toBe(
      BlogDashboardPageConstants.STATS_CHART_TYPES.VIEWS_CHART);
    expect(component.readsChartShown).toBeFalse();
    expect(component.readingTimeChartShown).toBeFalse();
    expect(component.loadingChartSpinnerShown).toBeTrue();

    tick();

    expect(component.authorAggregatedStats.views).toEqual(statsObject);
    expect(component.showHourlyStats).toHaveBeenCalled();
    expect(alertsService.addWarning).not.toHaveBeenCalled();
  }));

  it('should get published on date string', () => {
    // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
    let DATE = '11-21-2014';
    expect(component.getPublishedOnDateString(DATE))
      .toBe('11/21/2014');

    DATE = '01/16/2027';
    expect(component.getPublishedOnDateString(DATE))
      .toBe('01/16/2027');

    DATE = '02/02/2018';
    expect(component.getPublishedOnDateString(DATE))
      .toBe('02/02/2018');
  });

  it('should show author views stats from already loaded data', () => {
    component.authorAggregatedStats.views = statsObject;
    component.authorAggregatedStatsShown = false;
    component.viewsChartShown = false;
    component.loadingChartSpinnerShown = false;
    spyOn(blogDashboardBackendApiService, 'fetchAuthorBlogViewsStatsAsync');
    spyOn(component, 'showHourlyStats');

    component.showAuthorAggregatedViewsStats();

    expect(component.showHourlyStats).toHaveBeenCalled();
    expect(blogDashboardBackendApiService.fetchAuthorBlogViewsStatsAsync)
      .not.toHaveBeenCalled();
    expect(component.authorAggregatedStatsShown).toBeTrue();
    expect(component.viewsChartShown).toBeTrue();
    expect(component.loadingChartSpinnerShown).toBeTrue();
  });

  it('should show author reads stats from already loaded data', () => {
    component.authorAggregatedStats.reads = statsObject;
    component.readsChartShown = false;
    component.loadingChartSpinnerShown = false;
    spyOn(blogDashboardBackendApiService, 'fetchAuthorBlogReadsStatsAsync');
    spyOn(component, 'showHourlyStats');

    component.showAuthorAggregatedReadsStats();

    expect(component.showHourlyStats).toHaveBeenCalled();
    expect(blogDashboardBackendApiService.fetchAuthorBlogReadsStatsAsync)
      .not.toHaveBeenCalled();
    expect(component.readsChartShown).toBeTrue();
    expect(component.loadingChartSpinnerShown).toBeTrue();
  });

  it('should show author reading time stats from already loaded data', () => {
    component.authorAggregatedStats.readingTime = readingTimeStatsObj;
    component.readingTimeChartShown = false;
    component.loadingChartSpinnerShown = false;
    spyOn(
      blogDashboardBackendApiService, 'fetchAuthorBlogReadingTimeStatsAsync');
    spyOn(component, 'plotReadingTimeStatsChart');

    component.showAuthorAggregatedReadingTimeStats();

    expect(component.plotReadingTimeStatsChart).toHaveBeenCalled();
    expect(blogDashboardBackendApiService.fetchAuthorBlogReadingTimeStatsAsync)
      .not.toHaveBeenCalled();
    expect(component.readingTimeChartShown).toBeTrue();
    expect(component.loadingChartSpinnerShown).toBeTrue();
  });

  it('should display error if fetching author aggregated views fails',
    fakeAsync(() => {
      component.authorAggregatedStats = {};
      component.authorAggregatedStatsShown = false;
      component.viewsChartShown = false;
      component.loadingChartSpinnerShown = false;
      spyOn(blogDashboardBackendApiService, 'fetchAuthorBlogViewsStatsAsync')
        .and.returnValue(Promise.reject('Some backend error'));
      spyOn(component, 'showHourlyStats');
      spyOn(alertsService, 'addWarning');

      component.showAuthorAggregatedViewsStats();
      tick();

      expect(component.showHourlyStats).not.toHaveBeenCalled();
      expect(blogDashboardBackendApiService.fetchAuthorBlogViewsStatsAsync)
        .toHaveBeenCalled();
      expect(component.authorAggregatedStatsShown).toBeTrue();
      expect(component.viewsChartShown).toBeTrue();
      expect(component.loadingChartSpinnerShown).toBeTrue();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Some backend error');
    }));

  it('should fetch author aggregated reads stats', fakeAsync(() => {
    component.authorAggregatedStats = {};
    component.readsChartShown = false;
    component.loadingChartSpinnerShown = false;
    component.authorAggregatedStatsShown = true;
    spyOn(blogDashboardBackendApiService, 'fetchAuthorBlogReadsStatsAsync')
      .and.returnValue(Promise.resolve(statsObject));
    spyOn(component, 'showHourlyStats');
    spyOn(alertsService, 'addWarning');

    component.showReadsChartStats();
    tick();

    expect(component.showHourlyStats).toHaveBeenCalled();
    expect(blogDashboardBackendApiService.fetchAuthorBlogReadsStatsAsync)
      .toHaveBeenCalled();
    expect(component.readsChartShown).toBeTrue();
    expect(component.loadingChartSpinnerShown).toBeTrue();
    expect(component.authorAggregatedStats.reads).toEqual(statsObject);
    expect(alertsService.addWarning).not.toHaveBeenCalled();
  }));

  it('should fetch author aggregated reading time stats', fakeAsync(() => {
    component.authorAggregatedStats = {};
    component.readingTimeChartShown = false;
    component.loadingChartSpinnerShown = false;
    component.authorAggregatedStatsShown = true;
    spyOn(
      blogDashboardBackendApiService, 'fetchAuthorBlogReadingTimeStatsAsync'
    ).and.returnValue(Promise.resolve(readingTimeStatsObj));
    spyOn(component, 'plotReadingTimeStatsChart');
    spyOn(alertsService, 'addWarning');

    component.showReadingTimeChartStats();
    tick();

    expect(component.plotReadingTimeStatsChart).toHaveBeenCalled();
    expect(blogDashboardBackendApiService.fetchAuthorBlogReadingTimeStatsAsync)
      .toHaveBeenCalled();
    expect(component.readingTimeChartShown).toBeTrue();
    expect(component.loadingChartSpinnerShown).toBeTrue();
    expect(component.authorAggregatedStats.readingTime).toEqual(
      readingTimeStatsObj);
    expect(alertsService.addWarning).not.toHaveBeenCalled();
  }));

  it('should show warning if fetching author aggregated reads stats fails',
    fakeAsync(() => {
      component.authorAggregatedStats = {};
      component.readsChartShown = false;
      component.loadingChartSpinnerShown = false;
      spyOn(blogDashboardBackendApiService, 'fetchAuthorBlogReadsStatsAsync')
        .and.returnValue(Promise.reject('Some backend error'));
      spyOn(component, 'showHourlyStats');
      spyOn(alertsService, 'addWarning');

      component.showAuthorAggregatedReadsStats();
      tick();

      expect(component.showHourlyStats).not.toHaveBeenCalled();
      expect(blogDashboardBackendApiService.fetchAuthorBlogReadsStatsAsync)
        .toHaveBeenCalled();
      expect(component.readsChartShown).toBeTrue();
      expect(component.loadingChartSpinnerShown).toBeTrue();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Some backend error');
    }));

  it('should show display error if fetching author aggregated reading time' +
  ' stats fails', fakeAsync(() => {
    component.authorAggregatedStats = {};
    component.readingTimeChartShown = false;
    component.loadingChartSpinnerShown = false;
    spyOn(
      blogDashboardBackendApiService, 'fetchAuthorBlogReadingTimeStatsAsync'
    ).and.returnValue(Promise.reject('Some backend error'));
    spyOn(component, 'showHourlyStats');
    spyOn(alertsService, 'addWarning');

    component.showAuthorAggregatedReadingTimeStats();
    tick();

    expect(component.showHourlyStats).not.toHaveBeenCalled();
    expect(
      blogDashboardBackendApiService.fetchAuthorBlogReadingTimeStatsAsync
    ).toHaveBeenCalled();
    expect(component.readingTimeChartShown).toBeTrue();
    expect(component.loadingChartSpinnerShown).toBeTrue();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Some backend error');
  }));

  it('should show display error if fetching blog post aggregated views fails',
    fakeAsync(() => {
      component.loadedBlogPostStats = {};
      component.viewsChartShown = false;
      component.loadingChartSpinnerShown = false;
      spyOn(blogDashboardBackendApiService, 'fetchBlogPostViewsStatsAsync')
        .and.returnValue(Promise.reject('Some backend error'));
      spyOn(component, 'showHourlyStats');
      spyOn(alertsService, 'addWarning');

      component.showblogPostViewsChart();
      tick();

      expect(component.showHourlyStats).not.toHaveBeenCalled();
      expect(blogDashboardBackendApiService.fetchBlogPostViewsStatsAsync)
        .toHaveBeenCalled();
      expect(component.viewsChartShown).toBeTrue();
      expect(component.loadingChartSpinnerShown).toBeTrue();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Some backend error');
    }));

  it('should show display error if fetching blog post aggregated reads fails',
    fakeAsync(() => {
      component.loadedBlogPostStats = {};
      component.readsChartShown = false;
      component.loadingChartSpinnerShown = false;
      spyOn(blogDashboardBackendApiService, 'fetchBlogPostReadsStatsAsync')
        .and.returnValue(Promise.reject('Some backend error'));
      spyOn(component, 'showHourlyStats');
      spyOn(alertsService, 'addWarning');

      component.showblogPostReadsChart();
      tick();

      expect(component.showHourlyStats).not.toHaveBeenCalled();
      expect(blogDashboardBackendApiService.fetchBlogPostReadsStatsAsync)
        .toHaveBeenCalled();
      expect(component.readsChartShown).toBeTrue();
      expect(component.loadingChartSpinnerShown).toBeTrue();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Some backend error');
    }));

  it('should show display error if fetching blog post aggregated reading' +
    ' time stats fails',
  fakeAsync(() => {
    component.loadedBlogPostStats = {};
    component.readingTimeChartShown = false;
    component.loadingChartSpinnerShown = false;
    spyOn(
      blogDashboardBackendApiService, 'fetchBlogPostReadingTimeStatsAsync'
    ).and.returnValue(Promise.reject('Some backend error'));
    spyOn(component, 'showHourlyStats');
    spyOn(alertsService, 'addWarning');

    component.showblogPostReadingTimeChart();
    tick();

    expect(component.showHourlyStats).not.toHaveBeenCalled();
    expect(
      blogDashboardBackendApiService.fetchBlogPostReadingTimeStatsAsync
    ).toHaveBeenCalled();
    expect(component.readingTimeChartShown).toBeTrue();
    expect(component.loadingChartSpinnerShown).toBeTrue();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Some backend error');
  }));

  it('should fetch blog post views stats for the given blog post', fakeAsync(
    () => {
      spyOn(component, 'showHourlyStats');
      spyOn(alertsService, 'addWarning');
      spyOn(blogDashboardBackendApiService, 'fetchBlogPostViewsStatsAsync')
        .and.returnValue(Promise.resolve(blogPostViewsStatsObject));
      component.loadedBlogPostStats = {};
      component.authorAggregatedStatsShown = true;
      component.selectedChartType = (
        BlogDashboardPageConstants.STATS_CHART_TYPES.READS_CHART);
      component.readsChartShown = true;
      component.viewsChartShown = false;
      component.loadingChartSpinnerShown = false;

      component.getBlogPostStats('sample_id');
      tick();

      expect(component.selectedChartType).toEqual(
        BlogDashboardPageConstants.STATS_CHART_TYPES.VIEWS_CHART);
      expect(component.readsChartShown).toBeFalse();
      expect(component.viewsChartShown).toBeTrue();
      expect(component.loadingChartSpinnerShown).toBeTrue();
      expect(blogDashboardBackendApiService.fetchBlogPostViewsStatsAsync)
        .toHaveBeenCalledWith('sample_id');
      expect(component.showHourlyStats).toHaveBeenCalled();
      expect(component.loadedBlogPostStats.sample_id.views).toEqual(
        statsObject);
    }));

  it('should not fetch blog post reads stats for the given blog post' +
  'if the data for the given blog post is already loaded', fakeAsync(
    () => {
      spyOn(component, 'showHourlyStats');
      spyOn(blogDashboardBackendApiService, 'fetchBlogPostReadsStatsAsync');
      component.loadedBlogPostStats.sample_id = {};
      component.loadedBlogPostStats.sample_id.reads = statsObject;
      component.activeStatsBlogPostId = 'sample_id';
      component.authorAggregatedStatsShown = false;
      component.selectedChartType = (
        BlogDashboardPageConstants.STATS_CHART_TYPES.VIEWS_CHART);
      component.viewsChartShown = true;
      component.loadingChartSpinnerShown = false;

      component.showReadsChartStats();
      tick();

      expect(component.readsChartShown).toBeTrue();
      expect(component.viewsChartShown).toBeFalse();
      expect(component.loadingChartSpinnerShown).toBeTrue();
      expect(blogDashboardBackendApiService.fetchBlogPostReadsStatsAsync)
        .not.toHaveBeenCalled();
      expect(component.showHourlyStats).toHaveBeenCalled();
    }));

  it('should not fetch blog post reading time stats for the given blog' +
    ' post if the data for the given blog post is already loaded', fakeAsync(
    () => {
      spyOn(component, 'plotReadingTimeStatsChart');
      spyOn(
        blogDashboardBackendApiService, 'fetchBlogPostReadingTimeStatsAsync'
      );
      component.activeStatsBlogPostId = 'sample_id';
      component.loadedBlogPostStats.sample_id = {};
      component.loadedBlogPostStats.sample_id.readingTime = (
        blogPostReadingTimeStatsObj);
      component.authorAggregatedStatsShown = false;
      component.selectedChartType = (
        BlogDashboardPageConstants.STATS_CHART_TYPES.VIEWS_CHART);
      component.viewsChartShown = true;
      component.loadingChartSpinnerShown = false;

      component.showReadingTimeChartStats();
      tick();

      expect(component.readsChartShown).toBeFalse();
      expect(component.viewsChartShown).toBeFalse();
      expect(component.readingTimeChartShown).toBeTrue();
      expect(component.loadingChartSpinnerShown).toBeTrue();
      expect(blogDashboardBackendApiService.fetchBlogPostReadingTimeStatsAsync)
        .not.toHaveBeenCalled();
      expect(component.plotReadingTimeStatsChart).toHaveBeenCalled();
    }));

  it('should not fetch blog post views stats for the given blog' +
    ' post if the data for the given blog post is already loaded', fakeAsync(
    () => {
      spyOn(component, 'showHourlyStats');
      spyOn(
        blogDashboardBackendApiService, 'fetchBlogPostViewsStatsAsync'
      );
      component.activeStatsBlogPostId = 'sample_id';
      component.loadedBlogPostStats.sample_id = {};
      component.loadedBlogPostStats.sample_id.views = statsObject;
      component.authorAggregatedStatsShown = false;
      component.selectedChartType = (
        BlogDashboardPageConstants.STATS_CHART_TYPES.READS_CHART);
      component.viewsChartShown = false;
      component.loadingChartSpinnerShown = false;

      component.showViewsChartStats();
      tick();

      expect(component.selectedChartType).toEqual(
        BlogDashboardPageConstants.STATS_CHART_TYPES.VIEWS_CHART);
      expect(component.viewsChartShown).toBeTrue();
      expect(component.loadingChartSpinnerShown).toBeTrue();
      expect(blogDashboardBackendApiService.fetchBlogPostViewsStatsAsync)
        .not.toHaveBeenCalled();
      expect(component.showHourlyStats).toHaveBeenCalled();
    }));

  it('should fetch blog post reads stats for the given blog post', fakeAsync(
    () => {
      spyOn(component, 'showHourlyStats');
      spyOn(alertsService, 'addWarning');
      spyOn(blogDashboardBackendApiService, 'fetchBlogPostReadsStatsAsync')
        .and.returnValue(Promise.resolve(blogPostReadsStatsObject));
      component.loadedBlogPostStats = {};
      component.authorAggregatedStatsShown = false;
      component.readsChartShown = false;
      component.viewsChartShown = true;
      component.loadingChartSpinnerShown = false;
      component.activeStatsBlogPostId = 'sample_id';

      component.showReadsChartStats();
      tick();

      expect(component.readsChartShown).toBeTrue();
      expect(component.viewsChartShown).toBeFalse();
      expect(component.readingTimeChartShown).toBeFalse();
      expect(component.loadingChartSpinnerShown).toBeTrue();
      expect(blogDashboardBackendApiService.fetchBlogPostReadsStatsAsync)
        .toHaveBeenCalledWith('sample_id');
      expect(component.showHourlyStats).toHaveBeenCalled();
      expect(component.loadedBlogPostStats.sample_id.reads).toEqual(
        statsObject);
    }));

  it('should fetch blog post reading time stats for the given blog post',
    fakeAsync(() => {
      spyOn(component, 'plotReadingTimeStatsChart');
      spyOn(alertsService, 'addWarning');
      spyOn(
        blogDashboardBackendApiService, 'fetchBlogPostReadingTimeStatsAsync'
      ).and.returnValue(Promise.resolve(blogPostReadingTimeStatsObj));
      component.loadedBlogPostStats = {};
      component.authorAggregatedStatsShown = false;
      component.readsChartShown = true;
      component.viewsChartShown = true;
      component.loadingChartSpinnerShown = false;
      component.activeStatsBlogPostId = 'sample_id';

      component.showReadingTimeChartStats();
      tick();

      expect(component.readsChartShown).toBeFalse();
      expect(component.viewsChartShown).toBeFalse();
      expect(component.readingTimeChartShown).toBeTrue();
      expect(component.loadingChartSpinnerShown).toBeTrue();
      expect(blogDashboardBackendApiService.fetchBlogPostReadingTimeStatsAsync)
        .toHaveBeenCalledWith('sample_id');
      expect(component.plotReadingTimeStatsChart).toHaveBeenCalled();
      expect(component.loadedBlogPostStats.sample_id.readingTime).toEqual(
        readingTimeStatsObj);
    }));

  it('should show and plot hourly stats', fakeAsync(() => {
    component.loadingChartSpinnerShown = false;
    component.activeStatsBlogPostId = 'sample_id';
    component.loadedBlogPostStats.sample_id = {};
    component.loadedBlogPostStats.sample_id.reads = statsObject;
    component.viewsChartShown = false;
    spyOn(blogDashboardBackendApiService, 'fetchBlogPostReadsStatsAsync');
    expect(component.chartContainer.nativeElement.hasChildNodes()).toBeTrue();
    expect((
      component.chartContainer.nativeElement.childNodes[0].nodeName
    ).toLowerCase()).toEqual('svg');

    component.showblogPostReadsChart();

    expect(component.chartContainer.nativeElement.hasChildNodes()).toBeFalse();
    expect(component.loadingChartSpinnerShown).toBeTrue();

    tick();

    expect(component.loadingChartSpinnerShown).toBeFalse();
    expect(component.chartContainer.nativeElement.hasChildNodes()).toBeTrue();
    expect((
      component.chartContainer.nativeElement.childNodes[0].nodeName
        .toLowerCase()).toLowerCase()
    ).toEqual('svg');
    expect(blogDashboardBackendApiService.fetchBlogPostReadsStatsAsync)
      .not.toHaveBeenCalled();
    expect(component.xAxisLabels).toEqual(['2h', '3h', '4h', '5h']);
  }));

  it('should show and plot weekly stats', fakeAsync(() => {
    component.loadingChartSpinnerShown = false;
    component.activeStatsBlogPostId = 'sample_id';
    component.loadedBlogPostStats.sample_id = {};
    component.loadedBlogPostStats.sample_id.views = statsObject;
    // Changing value of all stats to less than 10 to calculate  yAxisMaxValue
    //  for cases with less than 10 as max value for any statistic key.
    component.loadedBlogPostStats.sample_id.views.weeklyStats = {
      '01': 1,
      '02': 2,
      '03': 4,
      '04': 1,
      '05': 2,
      '06': 3,
      '07': 1,
      '08': 2
    };
    component.viewsChartShown = true;
    spyOn(blogDashboardBackendApiService, 'fetchBlogPostViewsStatsAsync');
    expect(component.chartContainer.nativeElement.hasChildNodes()).toBeTrue();
    expect((
      component.chartContainer.nativeElement.childNodes[0].nodeName
    ).toLowerCase()).toEqual('svg');

    component.showblogPostViewsChart();
    component.showWeeklyStats();

    expect(component.chartContainer.nativeElement.hasChildNodes()).toBeFalse();
    expect(component.loadingChartSpinnerShown).toBeTrue();

    tick();

    expect(component.loadingChartSpinnerShown).toBeFalse();
    expect(component.chartContainer.nativeElement.hasChildNodes()).toBeTrue();
    expect((
      component.chartContainer.nativeElement.childNodes[0].nodeName
        .toLowerCase()).toLowerCase()
    ).toEqual('svg');
    expect(blogDashboardBackendApiService.fetchBlogPostViewsStatsAsync)
      .not.toHaveBeenCalled();
    expect(component.xAxisLabels).toEqual(
      ['13 Nov', '14 Nov', '15 Nov', '16 Nov', '17 Nov', '18 Nov', '19 Nov']
    );
  }));

  it('should show and plot yearly stats', () => {
    spyOn(component, 'plotStatsGraph');
    component.loadingChartSpinnerShown = false;
    component.activeStatsBlogPostId = 'sample_id';
    component.loadedBlogPostStats.sample_id = {};
    component.loadedBlogPostStats.sample_id.views = statsObject;
    component.viewsChartShown = true;

    component.showblogPostViewsChart();
    component.showYearlyStats();

    expect(component.loadingChartSpinnerShown).toBeTrue();
    expect(component.xAxisLabels).toEqual(
      [
        'Jan 22', 'Feb 22', 'Mar 22', 'Apr 22', 'May 22', 'Jun 22', 'Jul 22',
        'Aug 22', 'Sep 22', 'Oct 22', 'Nov 22', 'Dec 22'
      ]
    );
    expect(component.plotStatsGraph).toHaveBeenCalled();
  });

  it('should show and plot monthly stats', () => {
    spyOn(component, 'plotStatsGraph');
    component.loadingChartSpinnerShown = false;
    component.activeStatsBlogPostId = 'sample_id';
    component.loadedBlogPostStats.sample_id = {};
    component.loadedBlogPostStats.sample_id.views = statsObject;
    component.viewsChartShown = true;

    component.showblogPostViewsChart();
    component.showMonthlyStats();

    expect(component.loadingChartSpinnerShown).toBeTrue();
    expect(component.xAxisLabels).toEqual(
      ['01', '02', '03', '04', '05', '06', '07', '08']);
    expect(component.plotStatsGraph).toHaveBeenCalled();
  });

  it('should show and plot reading time stats', () => {
    component.loadingChartSpinnerShown = false;
    component.authorAggregatedStatsShown = false;
    component.activeStatsBlogPostId = 'sample_id';
    component.loadedBlogPostStats.sample_id = {};
    component.loadedBlogPostStats.sample_id.readingTime = readingTimeStatsObj;
    component.readingTimeChartShown = false;
    spyOn(component, 'plotStatsGraph');

    component.showblogPostReadingTimeChart();

    expect(component.loadingChartSpinnerShown).toBeTrue();
    expect(component.readingTimeChartShown).toBeTrue();
    expect(component.xAxisLabels).toEqual(Object.values(
      BlogDashboardPageConstants.READING_TIME_BUCKET_KEYS_TO_DISPLAY));
    expect(component.plotStatsGraph).toHaveBeenCalled();
  });
});
