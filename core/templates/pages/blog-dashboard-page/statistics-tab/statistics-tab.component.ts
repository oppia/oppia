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

@Component({
  selector: 'oppia-blog-statistics-tab',
  templateUrl: './statistics-tab.component.html'
})

export class BlogStatisticsTabComponent implements OnInit {
  @Input() publishedBlogPostList!: BlogPostSummary[];
  @ViewChild('barStats') chartContainer: ElementRef;

  private _svg;
  private _width: number;
  private _height: number;
  private _dataForActiveChart: Stats | ReadingTimeStats;
  private data = {
    '00': 1000, '01': 2000, '02': 3000, '09': 5000
  };

  margin = { top: 20, right: 20, bottom: 30, left: 40 };
  authorAggregatedStatsShown!: boolean;
  selectedChartType!: string;
  viewsChartShown: boolean = true;
  readsChartShown: boolean = false;
  readingTimeChartShown: boolean = false;
  loadedBlogPostStats: BlogPostStatsDict = {};
  authorAggregatedStats: AuthorStatsDict = {};
  activeStatsBlogPostId: string;
  activeTimePeriod: string;
  loadingChartSpinnerShown: boolean;
  directiveSubscriptions = new Subscription();
  constructor(
    private blogDashboardBackendApiService: BlogDashboardBackendApiService,
    private blogDashboardPageService: BlogDashboardPageService,
  ) {}

  ngOnInit(): void {
    this.showAuthorStats();
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
    this.loadingChartSpinnerShown = true;
    if (this.authorAggregatedStats.hasOwnProperty('views')) {
      this._dataForActiveChart = this.authorAggregatedStats.views;
      this.showHourlyStats();
    } else {
      this.blogDashboardBackendApiService.fetchAuthorBlogViewsStatsAsync().then(
        (viewsStats: Stats) => {
          this._dataForActiveChart = viewsStats;
          this.authorAggregatedStats.views = viewsStats;
          this.showHourlyStats();
        }
      );
    }
  }

  showAuthorAggregatedReadsStats(): void {
    this.readsChartShown = true;
    this.loadingChartSpinnerShown = true;
    if (this.authorAggregatedStats.hasOwnProperty('reads')) {
      this._dataForActiveChart = this.authorAggregatedStats.reads;
      this.showHourlyStats();
    } else {
      this.blogDashboardBackendApiService.fetchAuthorBlogReadsStatsAsync().then(
        (readsStats: Stats) => {
          this._dataForActiveChart = readsStats;
          this.authorAggregatedStats.reads = readsStats;
          this.showHourlyStats();
        }
      );
    }
  }

  showAuthorStats(): void {
    this.authorAggregatedStatsShown = true;
    // SetTimeout(() => {
    //   this._createSvg();
    //   this._drawBars(this.data);
    // })
    // this.showViewsChartStats();
  }

  showAuthorAggregatedReadingTimeStats(): void {
    this.readingTimeChartShown = true;
    this.loadingChartSpinnerShown = true;
    if (this.authorAggregatedStats.hasOwnProperty('readingTime')) {
      this._dataForActiveChart = this.authorAggregatedStats.readingTime;
      this.plotReadingTimeStatsChart();
    } else {
      this.blogDashboardBackendApiService
        .fetchAuthorBlogReadingTimeStatsAsync().then(
          (readingTimeStats: ReadingTimeStats) => {
            this._dataForActiveChart = readingTimeStats;
            this.authorAggregatedStats.readingTime = readingTimeStats;
            this.plotReadingTimeStatsChart();
          }
        );
    }
  }

  showblogPostViewsChart(): void {
    this.viewsChartShown = true;
    this.loadingChartSpinnerShown = true;
    if (this.activeStatsBlogPostId in this.loadedBlogPostStats) {
      if (
        this.loadedBlogPostStats[this.activeStatsBlogPostId].hasOwnProperty(
          'views')
      ) {
        this._dataForActiveChart = (
          this.loadedBlogPostStats[this.activeStatsBlogPostId].views
        );
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
      this._dataForActiveChart = viewStats;
      this.showHourlyStats();
      this.addStatsToLoadedBlogPostStats(stats.blogPostId, viewStats, 'views');
    }, () => {});
  }

  showblogPostReadsChart(): void {
    this.readsChartShown = true;
    this.loadingChartSpinnerShown = true;
    if (this.activeStatsBlogPostId in this.loadedBlogPostStats) {
      if (
        this.loadedBlogPostStats[this.activeStatsBlogPostId].hasOwnProperty(
          'reads')
      ) {
        this._dataForActiveChart = (
          this.loadedBlogPostStats[this.activeStatsBlogPostId].reads
        );
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
      this._dataForActiveChart = readsStats;
      this.showHourlyStats();
      this.addStatsToLoadedBlogPostStats(stats.blogPostId, readsStats, 'reads');
    }, () => {});
  }

  showblogPostReadingTimeChart(): void {
    this.readingTimeChartShown = true;
    this.loadingChartSpinnerShown = true;
    if (this.activeStatsBlogPostId in this.loadedBlogPostStats) {
      if (
        this.loadedBlogPostStats[this.activeStatsBlogPostId].hasOwnProperty(
          'readingTime')
      ) {
        this._dataForActiveChart = (
          this.loadedBlogPostStats[this.activeStatsBlogPostId].readingTime
        );
        this.plotReadingTimeStatsChart();
        return;
      }
    }
    this.blogDashboardBackendApiService.fetchBlogPostReadingTimeStatsAsync(
      this.activeStatsBlogPostId
    ).then((stats: BlogPostReadingTimeStats) => {
      this._dataForActiveChart = stats;
      this.addStatsToLoadedBlogPostStats(
        stats.blogPostId, stats, 'readingTime'
      );
      this.plotReadingTimeStatsChart();
    }, () => {});
  }

  showHourlyStats(): void {
    this.loadingChartSpinnerShown = true;
    let utcKeyedToLocaleHourDict = {};
    let data = (this._dataForActiveChart as Stats).hourlyStats;
    let statsKeys = Object.keys(data);
    let hourOffset = statsKeys.length;
    statsKeys.map(key => {
      utcKeyedToLocaleHourDict[key] = (
        this.blogDashboardPageService.getPastHourString(hourOffset)
      );
      hourOffset -= 1;
    });
    this.blogDashboardPageService.renameKeysInDict(
      utcKeyedToLocaleHourDict, data);
    this.plotStatsGraph(data);
  }

  showMonthlyStats(): void {
    this.loadingChartSpinnerShown = true;
    let data = (this._dataForActiveChart as Stats).monthlyStats;
    let statsKeys = Object.keys(data);
    let dayOffset = statsKeys.length;
    let utcKeyedToLocaleDayDict = {};
    statsKeys.map(key => {
      utcKeyedToLocaleDayDict[key] = (
        this.blogDashboardPageService.getPastDayString(dayOffset)
      );
      dayOffset -= 1;
    });
    this.blogDashboardPageService.renameKeysInDict(
      utcKeyedToLocaleDayDict, data);
    this.plotStatsGraph(data);
  }

  showWeeklyStats(): void {
    this.loadingChartSpinnerShown = true;
    let data = (this._dataForActiveChart as Stats).weeklyStats;
    let statsKeys = Object.keys(data);
    let dayOffset = statsKeys.length;
    let utcKeyedToLocaleDayDict = {};
    statsKeys.map(key => {
      utcKeyedToLocaleDayDict[key] = (
        this.blogDashboardPageService.getPastDayString(dayOffset)
      );
      dayOffset -= 1;
    });
    this.blogDashboardPageService.renameKeysInDict(
      utcKeyedToLocaleDayDict, data);
    this.plotStatsGraph(data);
  }

  showYearlyStats(): void {
    this.loadingChartSpinnerShown = true;
    let data = (this._dataForActiveChart as Stats).yearlyStats;
    let statsKeys = Object.keys(data);
    let monthOffset = statsKeys.length;
    let utcKeyedToLocaleMonthDict = {};
    statsKeys.map(key => {
      utcKeyedToLocaleMonthDict[key] = (
        this.blogDashboardPageService.getPastMonthString(monthOffset));
      monthOffset -= 1;
    });
    this.blogDashboardPageService.renameKeysInDict(
      utcKeyedToLocaleMonthDict, data);
    this.plotStatsGraph(data);
  }

  showAllStats(): void {
    this.loadingChartSpinnerShown = true;
  }

  plotReadingTimeStatsChart(): void {
    let data = this._dataForActiveChart as ReadingTimeStats;
    this.blogDashboardPageService.renameKeysInDict(
      BlogDashboardPageConstants.READING_TIME_BUCKET_KEYS_TO_DISPLAY,
      data
    );
    setTimeout(() => {
      this._createSvg();
      this._drawBars(this._dataForActiveChart);
    });
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
      let statisticsObj = {};
      statisticsObj[statsType] = stats;
      this.loadedBlogPostStats[blogPostId] = statisticsObj;
    }
  }

  getBlogPostStats(blogPostId: string): void {
    this.authorAggregatedStatsShown = false;
    this.activeStatsBlogPostId = blogPostId;
    this.showViewsChartStats();
  }

  plotStatsGraph(data: {[statsKey: string]: number}): void {
    this._createSvg();
    this._drawBars(data);
  }

  getYAxisBandScale(data: {[key: string]: number}): number {
    let maxStat;
    let highestPlaceValue;
    let statValues = Object.values(data);
    maxStat = Math.max(...statValues);
    highestPlaceValue = 10 ** maxStat.toString().length;
    return (
      ((maxStat / highestPlaceValue) * highestPlaceValue) + highestPlaceValue);
  }

  private _createSvg(): void {
    d3.select('svg').remove();
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
  }

  private _drawBars(data): void {
    let plotData = d3.entries(data);
    // Let label = (
    //   BlogDashboardPageConstants.STATS_CHART_LABLES[this.selectedChartType]
    // );
    // Create the X-axis band scale.
    const x = d3.scaleBand()
      .range([0, this._width])
      .domain(plotData.map(d => d.key))
      .padding(0.1);

    // Draw the X-axis on the DOM.
    this._svg.append('g')
      .attr('transform', 'translate(0,' + this._height + ')')
      .call(d3.axisBottom(x).tickSize(0))
      .selectAll('text')
      .style('text-anchor', 'end');

    // Create the Y-axis band scale.
    const y = d3.scaleLinear()
      .domain([0, d3.max(plotData, d => d.value)])
      .range([this._height, 0]);

    // Draw the Y-axis on the DOM.
    this._svg.append('g')
      .attr('stroke-width', 0.1)
      .call(d3.axisLeft(y).ticks(10).tickSize(-this._width));

    // Create and fill the bars.
    this._svg.selectAll('bars')
      .data(plotData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.key))
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => this._height - y(d.value))
      .attr('fill', '#1F78B4');

    this.loadingChartSpinnerShown = false;
  }
}

angular.module('oppia').directive('oppiaBlogPostEditor',
    downgradeComponent({
      component: BlogStatisticsTabComponent
    }) as angular.IDirectiveFactory);
