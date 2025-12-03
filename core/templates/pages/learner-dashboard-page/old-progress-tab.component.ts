// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for old progress tab in the Learner Dashboard page.
 */

import { OnInit } from '@angular/core';
import { AfterViewInit, Component, Input, EventEmitter, Output } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { StorySummary } from 'domain/story/story-summary.model';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';
import { LearnerDashboardPageConstants } from './learner-dashboard-page.constants';
import {
  LearnerDashboardBackendApiService,
  SubtopicMasterySummaryBackendDict,
} from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import { Subscription } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import * as d3 from 'd3';

// Badge interface used in the component
interface Badge {
  name: string;
  icon: string;
  minLectures: number;
  maxLectures: number;
  cssClass?: string; // Keeping for compatibility if needed, though new logic uses min/max
  unlocked?: boolean; // Derived property
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  badges: number;
  points: number;
}

@Component({
  selector: 'oppia-old-progress-tab',
  templateUrl: './old-progress-tab.component.html',
})
export class OldProgressTabComponent implements OnInit, AfterViewInit {
  @Output() setActiveSection: EventEmitter<string> = new EventEmitter();
  @Input() completedStoriesList!: StorySummary[];
  @Input() partiallyLearntTopicsList!: LearnerTopicSummary[];
  @Input() activeSubsection!: string;
  @Input() learntTopicsList!: LearnerTopicSummary[];

  displaySkills!: boolean[];
  width!: number;
  topicsInSkillProficiency: LearnerTopicSummary[] = [];
  emptySkillProficiency: boolean = true;
  widthConst: number = 233;
  subtopicMastery: Record<string, SubtopicMasterySummaryBackendDict> = {};
  topicIdsInSkillProficiency: string[] = [];
  goldBadgeImageUrl: string = '';
  bronzeBadgeImageUrl: string = '';
  silverBadgeImageUrl: string = '';
  emptyBadgeImageUrl: string = '';
  topicMastery: [number, LearnerTopicSummary][] = [];
  LEARNER_DASHBOARD_SUBSECTION_I18N_IDS =
    LearnerDashboardPageConstants.LEARNER_DASHBOARD_SUBSECTION_I18N_IDS;

  windowIsNarrow: boolean = false;
  directiveSubscriptions = new Subscription();

  // Lecture Badge System Properties
  badges: Badge[] = [
    { name: "Rookie", icon: "🌱", minLectures: 1, maxLectures: 2 },
    { name: "Bronze", icon: "🥉", minLectures: 3, maxLectures: 4 },
    { name: "Silver", icon: "🥈", minLectures: 5, maxLectures: 6 },
    { name: "Gold", icon: "🥇", minLectures: 7, maxLectures: 8 },
    { name: "Platinum", icon: "💎", minLectures: 9, maxLectures: 9 },
    { name: "Master", icon: "👑", minLectures: 10, maxLectures: Infinity }
  ];

  TOTAL_LECTURES: number = 10;

  unlockingBadgeId: number | null = null;
  notificationMessage: string = '';
  notificationVisible: boolean = false;

  // Leaderboard Data
  leaderboardData: LeaderboardEntry[] = [
    { rank: 1, username: 'StarLearner', badges: 15, points: 2500 },
    { rank: 2, username: 'CodeWizard', badges: 12, points: 2100 },
    { rank: 3, username: 'MathGenius', badges: 10, points: 1800 },
    { rank: 4, username: 'You', badges: 0, points: 0 }, // Will update dynamically
    { rank: 5, username: 'Explorer', badges: 5, points: 900 }
  ];

  constructor(
    private windowDimensionService: WindowDimensionsService,
    private urlInterpolationService: UrlInterpolationService,
    private learnerDashboardBackendApiService: LearnerDashboardBackendApiService
  ) { }

  async ngOnInit(): Promise<void> {
    this.width = this.widthConst * this.completedStoriesList.length;
    this.topicsInSkillProficiency.push(
      ...this.partiallyLearntTopicsList,
      ...this.learntTopicsList
    );
    let topic: LearnerTopicSummary;
    for (topic of this.topicsInSkillProficiency) {
      this.topicIdsInSkillProficiency.push(topic.id);
    }
    this.goldBadgeImageUrl = this.getStaticImageUrl(
      '/learner_dashboard/gold.png'
    );
    this.bronzeBadgeImageUrl = this.getStaticImageUrl(
      '/learner_dashboard/bronze.png'
    );
    this.silverBadgeImageUrl = this.getStaticImageUrl(
      '/learner_dashboard/silver.png'
    );
    this.emptyBadgeImageUrl = this.getStaticImageUrl(
      '/learner_dashboard/empty_badge.png'
    );
    if (this.topicsInSkillProficiency.length !== 0) {
      this.subtopicMastery =
        await this.learnerDashboardBackendApiService.fetchSubtopicMastery(
          this.topicIdsInSkillProficiency
        );
    }
    this.displaySkills = new Array(this.topicsInSkillProficiency.length).fill(
      false
    );
    let atLeastOnetopicHasPracticeTabEnabled = false;
    for (topic of this.topicsInSkillProficiency) {
      if (topic.practiceTabIsDisplayed === true) {
        atLeastOnetopicHasPracticeTabEnabled = true;
        break;
      }
    }
    if (
      atLeastOnetopicHasPracticeTabEnabled === true &&
      this.topicsInSkillProficiency.length !== 0
    ) {
      this.emptySkillProficiency = false;
    }
    this.getTopicMastery();

    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionService.getResizeEvent().subscribe(() => {
        this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
      })
    );

    // Initial check for badges
    this.checkBadgeUnlockConditions();
    this.updateUserLeaderboardStats();
  }

  ngAfterViewInit(): void {
    this.renderCharts();
  }

  // Getters for Lecture Badge System
  get watchedLecturesCount(): number {
    // Mapping "Lectures" to "Completed Stories"
    return this.completedStoriesList ? this.completedStoriesList.length : 0;
  }

  get progressPercentage(): number {
    return Math.min(100, (this.watchedLecturesCount / this.TOTAL_LECTURES) * 100);
  }

  get currentBadge(): Badge | null {
    const count = this.watchedLecturesCount;
    for (const badge of this.badges) {
      if (count >= badge.minLectures && count <= badge.maxLectures) {
        return badge;
      }
    }
    return null;
  }

  checkBadgeUnlockConditions(): void {
    // This method is now implicitly handled by the getters for the UI,
    // but we can use it to trigger notifications or updates if needed.
    const current = this.currentBadge;
    if (current) {
      // Logic to handle new unlocks could go here
    }
  }

  showSkills(index: number): void {
    this.displaySkills[index] = !this.displaySkills[index];
    this.width = this.widthConst * this.completedStoriesList.length;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  getTopicMastery(): void {
    let keyArr = Object.keys(this.subtopicMastery);
    for (let i = 0; i < keyArr.length; i++) {
      let valArr = Object.values(
        this.subtopicMastery[this.topicsInSkillProficiency[i].id]
      );
      let sum = valArr.reduce((a, b) => a + b, 0);
      let arrLength = this.topicsInSkillProficiency[i].subtopics.length;
      this.topicMastery.push([
        Math.floor((sum / arrLength) * 100),
        this.topicsInSkillProficiency[i],
      ]);
    }
    this.topicMastery = this.topicMastery.sort(function (a, b) {
      return b[0] - a[0];
    });
  }

  calculateCircularProgress(i: number): string {
    let degree = 90 + (360 * this.topicMastery[i][0]) / 100;
    let cssStyle =
      `linear-gradient(${degree}deg, transparent 50%, #CCCCCC 50%)` +
      ', linear-gradient(90deg, #CCCCCC 50%, transparent 50%)';
    if (this.topicMastery[i][0] > 50) {
      degree = 3.6 * (this.topicMastery[i][0] - 50) - 90;
      cssStyle =
        'linear-gradient(270deg, #00645C 50%, transparent 50%), ' +
        `linear-gradient(${degree}deg, #00645C 50%, #CCCCCC 50%)`;
    }
    return cssStyle;
  }

  changeActiveSection(): void {
    console.log('changeActiveSection called - switching to GOALS section');
    this.setActiveSection.emit(
      LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS.GOALS
    );
    console.log('Event emitted:', LearnerDashboardPageConstants.LEARNER_DASHBOARD_SECTION_I18N_IDS.GOALS);
  }

  // Badge related methods
  unlockBadge(id: number): void {
    // Deprecated in favor of automatic range-based unlocking, 
    // but kept for compatibility with existing HTML click handlers if any.
  }

  showNotification(message: string): void {
    this.notificationMessage = message;
    this.notificationVisible = true;
    setTimeout(() => {
      this.notificationVisible = false;
    }, 3500);
  }

  get totalBadges(): number {
    return this.badges.length;
  }

  get unlockedBadges(): number {
    return this.badges.filter(b => this.watchedLecturesCount >= b.minLectures).length;
  }

  get progressInPercent(): number {
    const total = this.totalBadges;
    return total ? Math.round((this.unlockedBadges / total) * 100) : 0;
  }

  shareBadge(platform: 'facebook' | 'twitter' | 'linkedin'): void {
    const unlockedBadges = this.badges
      .filter(b => this.watchedLecturesCount >= b.minLectures)
      .map(b => b.name)
      .join(', ');

    if (!unlockedBadges) {
      alert("You haven't unlocked any badges yet!");
      return;
    }

    const text = encodeURIComponent(`I just unlocked these badges on Oppia: ${unlockedBadges}`);
    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=https://oppia.org&quote=${text}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${text}&url=https://oppia.org`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/shareArticle?mini=true&url=https://oppia.org&title=My Achievements&summary=${text}`;
        break;
    }
    window.open(url, '_blank', 'width=600,height=400');
  }

  addBadge(): void {
    // Deprecated
  }

  updateUserLeaderboardStats(): void {
    const userEntry = this.leaderboardData.find(e => e.username === 'You');
    if (userEntry) {
      userEntry.badges = this.unlockedBadges;
      userEntry.points = this.unlockedBadges * 150;
      this.leaderboardData.sort((a, b) => b.points - a.points);
      this.leaderboardData.forEach((entry, index) => entry.rank = index + 1);
    }
  }

  renderCharts(): void {
    this.renderPieChart();
    this.renderBarChart();
  }

  renderPieChart(): void {
    const data = [
      { label: 'Unlocked', value: this.unlockedBadges },
      { label: 'Locked', value: this.totalBadges - this.unlockedBadges }
    ];

    const width = 200;
    const height = 200;
    const radius = Math.min(width, height) / 2;

    d3.select('#pie-chart').selectAll('*').remove();

    const svg = d3.select('#pie-chart')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.label))
      .range(['#4caf50', '#e0e0e0']);

    const pie = d3.pie<any>()
      .value(d => d.value);

    const arc = d3.arc<any>()
      .innerRadius(0)
      .outerRadius(radius);

    svg.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label) as string)
      .attr('stroke', 'white')
      .style('stroke-width', '2px');
  }

  renderBarChart(): void {
    const data = [
      { label: 'Total', value: this.totalBadges },
      { label: 'Unlocked', value: this.unlockedBadges }
    ];

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 300 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    d3.select('#bar-chart').selectAll('*').remove();

    const svg = d3.select('#bar-chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .padding(0.1);
    const y = d3.scaleLinear()
      .range([height, 0]);

    x.domain(data.map(d => d.label));
    y.domain([0, d3.max(data, d => d.value) || 10]);

    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label)!)
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value))
      .attr('fill', '#2196f3');

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));
  }
}
