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
 * @fileoverview Component for a blog dashboard statistics tab.
 */

import * as d3 from 'd3';
import dayjs from 'dayjs';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { BlogPostViewsStats,
  BlogPostReadsStats,
  Stats,
  ReadingTimeStats,
  BlogPostReadingTimeStats,
  BlogDashboardBackendApiService
} from 'domain/blog/blog-dashboard-backend-api.service';
import { BlogDashboardPageConstants } from '../blog-dashboard-page.constants';
import { BlogDashboardPageService } from '../services/blog-dashboard-page.service';
import { Subscription } from 'rxjs';
import { AlertsService } from 'services/alerts.service';
import { NumberValue } from 'd3';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';

interface BlogPostStatsDict {
  [blogPostId: string]: {
    views?: Stats;
    reads?: Stats;
    readingTime?: ReadingTimeStats;
  };
}

interface AuthorStatsDict {
  views?: Stats;
  reads?: Stats;
  readingTime?: ReadingTimeStats;
}

interface StatsDict {
  [statsKey: string]: number;
}

@Component({
  selector: 'oppia-blog-statistics-tab',
  templateUrl: './blog-statistics-tab.component.html'
})

export class BlogStatisticsTabComponent implements OnInit {
  @Input() publishedBlogPostList!: BlogPostSummary[];
  @ViewChild('barStats') chartContainer!: ElementRef;

  private _svg!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private _width!: number;
  private _height!: number;
  private _dataForActiveChart!: Stats | ReadingTimeStats;
  private _x!: d3.ScaleBand<string>;
  private _y!: d3.ScaleLinear<number, number>;
  private _xAxis!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private _yAxis!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private _currentPlotData!: StatsDict | ReadingTimeStats;

  margin = { top: 20, right: 20, bottom: 50, left: 60 };
  authorAggregatedStatsShown!: boolean;
  selectedChartType!: string;
  selectedTimePeriod!: 'hourly' | 'weekly' | 'monthly' | 'yearly' | 'all';
  viewsChartShown: boolean = true;
  readsChartShown: boolean = false;
  readingTimeChartShown: boolean = false;
  loadedBlogPostStats: BlogPostStatsDict = {};
  authorAggregatedStats: AuthorStatsDict = {};
  activeStatsBlogPostId!: string;
  loadingChartSpinnerShown: boolean = false;
  xAxisLabels: string[] = [];
  smallScreenViewIsActive: boolean = false;
  directiveSubscriptions = new Subscription();
  constructor(
    private blogDashboardBackendApiService: BlogDashboardBackendApiService,
    private blogDashboardPageService: BlogDashboardPageService,
    private alertsService: AlertsService,
    private windowDimensionsService: WindowDimensionsService,
  ) {}

  ngOnInit(): void {
    this.authorAggregatedStatsShown = true;
    this.activeStatsBlogPostId = 'all';
    this.showViewsChartStats();
    if (this.isSmallScreenViewActive()) {
      this.smallScreenViewIsActive = true;
      this.margin = { top: 10, right: 10, bottom: 40, left: 40 };
    }
    this.windowDimensionsService.getResizeEvent().subscribe(() => {
      if (this.isSmallScreenViewActive()) {
        this.smallScreenViewIsActive = true;
        this.margin = { top: 10, right: 10, bottom: 45, left: 40 };
      } else {
        this.smallScreenViewIsActive = false;
        this.margin = { top: 20, right: 20, bottom: 50, left: 60 };
      }
      this.showLoadingChartSpinner();
      this.plotStatsGraph(this._currentPlotData);
    });
  }

  isSmallScreenViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 900;
  }

  showViewsChartStats(): void {
    if (this.authorAggregatedStatsShown) {
      this.showAuthorAggregatedViewsStats();
    } else {
      this.showblogPostViewsChart();
    }
    this.selectedChartType = (
      BlogDashboardPageConstants.STATS_CHART_TYPES.VIEWS_CHART
    );
    this.readsChartShown = false;
    this.readingTimeChartShown = false;
  }

  showReadsChartStats(): void {
    if (this.authorAggregatedStatsShown) {
      this.showAuthorAggregatedReadsStats();
    } else {
      this.showblogPostReadsChart();
    }
    this.viewsChartShown = false;
    this.readingTimeChartShown = false;
  }

  showReadingTimeChartStats(): void {
    if (this.authorAggregatedStatsShown) {
      this.showAuthorAggregatedReadingTimeStats();
    } else {
      this.showblogPostReadingTimeChart();
    }
    this.viewsChartShown = false;
    this.readsChartShown = false;
  }

  showAuthorAggregatedViewsStats(): void {
    this.authorAggregatedStatsShown = true;
    this.viewsChartShown = true;
    this.showLoadingChartSpinner();
    if (this.authorAggregatedStats.hasOwnProperty('views')) {
      this._dataForActiveChart = this.authorAggregatedStats.views as Stats;
      this.showHourlyStats();
    } else {
      this.blogDashboardBackendApiService.fetchAuthorBlogViewsStatsAsync().then(
        (viewsStats: Stats) => {
          this._dataForActiveChart = viewsStats;
          this.authorAggregatedStats.views = viewsStats;
          this.showHourlyStats();
        }, (error) => {
          this.alertsService.addWarning(error);
        }
      );
    }
  }

  showAuthorAggregatedReadsStats(): void {
    this.readsChartShown = true;
    this.showLoadingChartSpinner();
    if (this.authorAggregatedStats.hasOwnProperty('reads')) {
      this._dataForActiveChart = this.authorAggregatedStats.reads as Stats;
      this.showHourlyStats();
    } else {
      this.blogDashboardBackendApiService.fetchAuthorBlogReadsStatsAsync().then(
        (readsStats: Stats) => {
          this._dataForActiveChart = readsStats;
          this.authorAggregatedStats.reads = readsStats;
          this.showHourlyStats();
        }, (error) => {
          this.alertsService.addWarning(error);
        }
      );
    }
  }

  showAuthorAggregatedReadingTimeStats(): void {
    this.readingTimeChartShown = true;
    this.showLoadingChartSpinner();
    if (this.authorAggregatedStats.hasOwnProperty('readingTime')) {
      this._dataForActiveChart = (
        this.authorAggregatedStats.readingTime as ReadingTimeStats
      );
      this.plotReadingTimeStatsChart();
    } else {
      this.blogDashboardBackendApiService
        .fetchAuthorBlogReadingTimeStatsAsync().then(
          (readingTimeStats: ReadingTimeStats) => {
            this._dataForActiveChart = readingTimeStats as ReadingTimeStats;
            this.authorAggregatedStats.readingTime = readingTimeStats;
            this.plotReadingTimeStatsChart();
          }, (error) => {
            this.alertsService.addWarning(error);
          }
        );
    }
  }

  showblogPostViewsChart(): void {
    this.viewsChartShown = true;
    this.showLoadingChartSpinner();
    if (this.activeStatsBlogPostId in this.loadedBlogPostStats) {
      if (
        this.loadedBlogPostStats[this.activeStatsBlogPostId].hasOwnProperty(
          'views')
      ) {
        this._dataForActiveChart = (
          this.loadedBlogPostStats[this.activeStatsBlogPostId].views
        ) as Stats;
        this.showHourlyStats();
        return;
      }
    }
    this.blogDashboardBackendApiService.fetchBlogPostViewsStatsAsync(
      this.activeStatsBlogPostId
    ).then((stats: BlogPostViewsStats) => {
      let viewStats: Stats;
      viewStats = {
        hourlyStats: stats.hourlyViews,
        weeklyStats: stats.weeklyViews,
        monthlyStats: stats.monthlyViews,
        yearlyStats: stats.yearlyViews,
        allStats: stats.allViews
      };
      this._dataForActiveChart = viewStats as Stats;
      this.showHourlyStats();
      this.addStatsToLoadedBlogPostStats(stats.blogPostId, viewStats, 'views');
    }, (error) => {
      this.alertsService.addWarning(error);
    });
  }

  showblogPostReadsChart(): void {
    this.readsChartShown = true;
    this.showLoadingChartSpinner();
    if (this.activeStatsBlogPostId in this.loadedBlogPostStats) {
      if (
        this.loadedBlogPostStats[this.activeStatsBlogPostId].hasOwnProperty(
          'reads')
      ) {
        this._dataForActiveChart = (
          this.loadedBlogPostStats[this.activeStatsBlogPostId].reads
        ) as Stats;
        this.showHourlyStats();
        return;
      }
    }
    this.blogDashboardBackendApiService.fetchBlogPostReadsStatsAsync(
      this.activeStatsBlogPostId
    ).then((stats: BlogPostReadsStats) => {
      let readsStats: Stats;
      readsStats = {
        hourlyStats: stats.hourlyReads,
        weeklyStats: stats.weeklyReads,
        monthlyStats: stats.monthlyReads,
        yearlyStats: stats.yearlyReads,
        allStats: stats.allReads
      };
      this._dataForActiveChart = readsStats as Stats;
      this.showHourlyStats();
      this.addStatsToLoadedBlogPostStats(
        stats.blogPostId, readsStats, 'reads');
    }, (error) => {
      this.alertsService.addWarning(error);
    });
  }

  showblogPostReadingTimeChart(): void {
    this.readingTimeChartShown = true;
    this.showLoadingChartSpinner();
    if (this.activeStatsBlogPostId in this.loadedBlogPostStats) {
      if (
        this.loadedBlogPostStats[this.activeStatsBlogPostId].hasOwnProperty(
          'readingTime')
      ) {
        this._dataForActiveChart = (
          this.loadedBlogPostStats[this.activeStatsBlogPostId].readingTime
        ) as ReadingTimeStats;
        this.plotReadingTimeStatsChart();
        return;
      }
    }
    this.blogDashboardBackendApiService.fetchBlogPostReadingTimeStatsAsync(
      this.activeStatsBlogPostId
    ).then((stats: BlogPostReadingTimeStats) => {
      this._dataForActiveChart = stats as ReadingTimeStats;
      let readingTimeStats: ReadingTimeStats = {
        zeroToOneMin: stats.zeroToOneMin,
        oneToTwoMin: stats.oneToTwoMin,
        twoToThreeMin: stats.twoToThreeMin,
        threeToFourMin: stats.threeToFourMin,
        fourToFiveMin: stats.fourToFiveMin,
        fiveToSixMin: stats.fiveToSixMin,
        sixToSevenMin: stats.sixToSevenMin,
        sevenToEightMin: stats.sevenToEightMin,
        eightToNineMin: stats.eightToNineMin,
        nineToTenMin: stats.nineToTenMin,
        moreThanTenMin: stats.moreThanTenMin,
      };
      this.addStatsToLoadedBlogPostStats(
        stats.blogPostId, readingTimeStats, 'readingTime'
      );
      this.plotReadingTimeStatsChart();
    }, (error) => {
      this.alertsService.addWarning(error);
    });
  }

  showHourlyStats(): void {
    let data = (this._dataForActiveChart as Stats).hourlyStats;
    let statsKeys = Object.keys(data);
    this.xAxisLabels = [];
    statsKeys.map(hourKey => this.xAxisLabels.push(hourKey.replace('_', 'h')));
    this.selectedTimePeriod = 'hourly';
    this.plotStatsGraph(data);
  }

  showMonthlyStats(): void {
    let data = (this._dataForActiveChart as Stats).monthlyStats;
    let statsKeys = Object.keys(data);
    this.xAxisLabels = [];
    statsKeys.map(dayKey => this.xAxisLabels.push(dayKey.replace('_', ' ')));
    this.selectedTimePeriod = 'monthly';
    this.plotStatsGraph(data);
  }

  showWeeklyStats(): void {
    let data = (this._dataForActiveChart as Stats).weeklyStats;
    let statsKeys = Object.keys(data);
    this.xAxisLabels = [];
    statsKeys.map(key => this.xAxisLabels.push(key.replace('_', ' ')));
    this.selectedTimePeriod = 'weekly';
    this.plotStatsGraph(data);
  }

  showYearlyStats(): void {
    let data = (this._dataForActiveChart as Stats).yearlyStats;
    let statsKeys = Object.keys(data);
    this.xAxisLabels = [];
    let year = (new Date()).getFullYear();
    statsKeys.map(key => this.xAxisLabels.push(
      dayjs(new Date (year, Number(key.replace('_', ' ')))).format('MMM YY')));
    this.selectedTimePeriod = 'yearly';
    this.plotStatsGraph(data);
  }

  plotReadingTimeStatsChart(): void {
    let data = this._dataForActiveChart as ReadingTimeStats;
    this.xAxisLabels = Object.values(
      BlogDashboardPageConstants.READING_TIME_BUCKET_KEYS_TO_DISPLAY);
    this.plotStatsGraph(data);
  }

  addStatsToLoadedBlogPostStats(
      blogPostId: string,
      stats: Stats | ReadingTimeStats,
      statsType: 'views' | 'reads' | 'readingTime'
  ): void {
    if (blogPostId in this.loadedBlogPostStats) {
      if (statsType === 'views') {
        this.loadedBlogPostStats[blogPostId].views = stats as Stats;
      } else if (statsType === 'reads') {
        this.loadedBlogPostStats[blogPostId].reads = stats as Stats;
      } else {
        this.loadedBlogPostStats[blogPostId].readingTime = (
          stats as ReadingTimeStats);
      }
    } else {
      let statisticsObj = {
        [statsType]: stats
      };
      this.loadedBlogPostStats[blogPostId] = statisticsObj;
    }
  }

  getBlogPostStats(blogPostId: string): void {
    this.authorAggregatedStatsShown = false;
    this.activeStatsBlogPostId = blogPostId;
    this.showViewsChartStats();
  }

  plotStatsGraph(data: StatsDict | ReadingTimeStats): void {
    const element = this.chartContainer.nativeElement;
    setTimeout(() => {
      this.loadingChartSpinnerShown = false;
      if (element.childNodes[1].nodeName.toLowerCase() !== 'svg') {
        this._createSvg();
      }
      this._drawBars(data);
    });
  }

  showLoadingChartSpinner(): void {
    if (this.chartContainer) {
      const element = this.chartContainer.nativeElement;
      d3.select(element).select('svg').selectAll('*').remove();
      d3.select(element).select('svg').remove();
    }
    this.loadingChartSpinnerShown = true;
  }

  private _createSvg(): void {
    const element = this.chartContainer.nativeElement;
    this._svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')');

    this._width = element.offsetWidth - this.margin.left - this.margin.right;
    this._height = element.offsetHeight - this.margin.top - this.margin.bottom;

    this._x = d3.scaleBand()
      .range([0, this._width])
      .padding(0.1);
    this._xAxis = this._svg.append('g');
    this._xAxis.attr('transform', 'translate(0,' + this._height + ')');

    // Draw the Y-axis on the DOM.
    this._y = d3.scaleLinear()
      .range([this._height, 0]);
    this._yAxis = this._svg.append('g');
  }


  private _drawBars(data: StatsDict | ReadingTimeStats): void {
    this._currentPlotData = data;
    let plotData = d3.entries(data);
    // Create the X-axis band scale.
    this._x.domain(plotData.map(d => d.key));

    let xAxisGenerator = d3.axisBottom(this._x);
    if (this.viewsChartShown || this.readsChartShown) {
      xAxisGenerator.tickSize(0);
    } else {
      xAxisGenerator.ticks(11).tickSize(-this._height);
    }
    xAxisGenerator.tickFormat((d, i) => this.xAxisLabels[i]);
    // Draw the X-axis on the DOM.
    this._xAxis.call(
      xAxisGenerator.tickSizeOuter(-this._height)
    );
    this._xAxis.select('.domain')
      .attr('stroke', '#000');
    this._xAxis.selectAll('.tick:not(:first-of-type) line')
      .attr('stroke', '#4682B4')
      .attr('stroke-width', 2.5)
      .attr('opacity', 0.5);
    if (this.readingTimeChartShown) {
      this._xAxis.selectAll('.tick line')
        .attr('stroke', '#4682B4')
        .attr('stroke-width', 2.5)
        .attr('opacity', 0.5);
    }
    if (this.isSmallScreenViewActive()) {
      this._xAxis.selectAll('text')
        .style('text-anchor', 'middle')
        .style('font-size', '9px')
        .attr('transform', 'translate(-8,8)rotate(-45)');
    } else {
      this._xAxis.selectAll('text')
        .style('text-anchor', 'middle');
    }

    // Create the Y-axis band scale.
    let yAxisMaxValue = (
      d3.max(plotData, d => Number(d.value)) as number + 50
    );
    this._y.domain([0, yAxisMaxValue]);
    // Draw the Y-axis on the DOM.
    this._yAxis.transition().duration(1000).call(
      d3.axisLeft(this._y).ticks(10).tickSize(-this._width)
    );

    this._yAxis.select('.domain')
      .attr('stroke-width', 1)
      .attr('stroke', '#000');
    this._yAxis.selectAll('.tick:not(:first-of-type) line')
      .attr('stroke', '#4682B4')
      .attr('stroke-width', 2.5)
      .attr('opacity', 0.5);

    d3.scaleBand().paddingOuter(0.35);

    // Remove already existing bars.
    this._svg.selectAll('rect').remove().transition().attr('opacity', 0);
    // Create and fill the bars.

    // This throws argument of 'Type 'number | undefined' is not assignable to
    // type string | number | boolean'. This comes when data is entered in d3
    // Selection as '.data' dependancy of d3 return 'number | undefined'. We
    // need to suppress this error because of strict type checking.
    // @ts-ignore
    this._svg.selectAll('bars')
      .data(plotData)
      .enter()
      .append('rect') // Add a new rect for each new elements.
      .attr('class', 'bar')
      .attr('x', d => this._x(d.key))
      .attr('y', d => this._y(d.value as NumberValue) || 0)
      .transition()
      .attr('opacity', 1)
      .attr('width', this._x.bandwidth() || 0)
      .attr(
        'height',
        d => this._height - (this._y(d.value as NumberValue) as number || 0))
      .attr('fill', '#1F78B4');

    // Y axis label.
    let yAxisLabel = this._svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - this.margin.left + 20)
      .attr('x', 0 - this._height / 2)
      .text(this.getYaxisLabel())
      .style('fill', '#00645c');

    // X axis label for reading time chart.
    if (this.readingTimeChartShown) {
      let xAxisLabel = this._svg.append('text')
        .style('text-anchor', 'middle')
        .text('MINUTES')
        .style('fill', '#00645c');

      if (this.isSmallScreenViewActive()) {
        xAxisLabel.attr(
          'transform',
          'translate(' + (this._width / 2) + ' ,' + (this._height + this.margin.bottom) + ')') // eslint-disable-line max-len
          .style('font-size', '12px');
      } else {
        xAxisLabel.attr(
          'transform',
          'translate(' + (this._width / 2) + ' ,' + (this._height + this.margin.bottom - 10) + ')') // eslint-disable-line max-len
          .style('font-size', '14px');
      }
    }

    if (this.isSmallScreenViewActive()) {
      yAxisLabel.style('font-size', '12px');
    } else {
      yAxisLabel.style('font-size', '14px');
    }
  }

  getYaxisLabel(): string {
    if (this.viewsChartShown) {
      return 'VIEWS';
    } else {
      return 'READS';
    }
  }

  getPublishedOnDateString(naiveDate: string): string {
    return dayjs(
      naiveDate.split(',')[0], 'MM-DD-YYYY').format('MM/DD/YYYY');
  }
}

angular.module('oppia').directive('oppiaBlogPostEditor',
    downgradeComponent({
      component: BlogStatisticsTabComponent
    }) as angular.IDirectiveFactory);
