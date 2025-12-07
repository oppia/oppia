import { Component, OnInit } from '@angular/core';
import { LearnerBadgeService } from 'services/learner-badge.service';

@Component({
  selector: 'oppia-learner-badge-overview',
  templateUrl: './learner-badge-overview-page.component.html',
  styleUrls: ['./learner-badge-overview-page.component.css']
})
export class LearnerBadgeOverviewPageComponent implements OnInit {
  earnedBadges: any[] = [];
  lockedBadges: any[] = [];
  filterOptions: string[] = ['All', 'Achievement', 'Milestone'];
  selectedFilter: string = 'All';

  constructor(private badgeService: LearnerBadgeService) { }

  ngOnInit(): void {
    this.fetchBadges();
  }

  fetchBadges(): void {
    this.badgeService.getUserBadges().subscribe((data) => {
      // user_badges contains the earned badges
      this.earnedBadges = data.badge_details || [];
      // Get all badges and filter out earned ones for locked badges
      this.badgeService.getAllBadges().subscribe((allBadgesData) => {
        const earnedBadgeIds = new Set((data.user_badges || []).map(ub => ub.badge_id));
        this.lockedBadges = allBadgesData.badges.filter(b => !earnedBadgeIds.has(b.badge_id));
      });
    });
  }

  applyFilter(): void {
    if (this.selectedFilter === 'All') {
      this.fetchBadges();
    } else {
      this.badgeService.getBadgesByCategory(this.selectedFilter).subscribe((data) => {
        this.earnedBadges = data.badges;
      });
    }
  }
}