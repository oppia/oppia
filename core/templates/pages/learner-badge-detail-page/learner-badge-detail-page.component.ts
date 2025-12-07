import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LearnerBadgeService } from 'services/learner-badge.service';

@Component({
  selector: 'oppia-learner-badge-detail',
  templateUrl: './learner-badge-detail-page.component.html',
  styleUrls: ['./learner-badge-detail-page.component.css']
})
export class LearnerBadgeDetailPageComponent implements OnInit {
  badge: any = {};
  progress: number = 0;
  motivationalMessage: string = '';
  relatedBadges: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private badgeService: LearnerBadgeService
  ) { }

  ngOnInit(): void {
    const badgeId = this.route.snapshot.paramMap.get('id');
    this.fetchBadgeDetails(badgeId!);
  }

  fetchBadgeDetails(badgeId: string): void {
    this.badgeService.getBadgeDetail(badgeId).subscribe((data) => {
      this.badge = data.badge;
      // Get progress for this badge
      this.badgeService.getBadgeProgress(badgeId).subscribe((progressData) => {
        if (progressData.badge_progress) {
          this.progress = progressData.badge_progress.progress_percentage;
        }
      });
      this.motivationalMessage = `Keep going! You're making great progress on ${this.badge.name}!`;
      this.fetchRelatedBadges(data.badge.category);
    });
  }

  fetchRelatedBadges(category: string): void {
    this.badgeService.getBadgesByCategory(category).subscribe((data) => {
      this.relatedBadges = data.badges.filter(b => b.badge_id !== this.badge.badge_id);
    });
  }
}