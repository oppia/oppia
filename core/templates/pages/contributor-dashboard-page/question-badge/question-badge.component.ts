import { Component, Input } from '@angular/core';
import { AppConstants } from 'app.constants';

@Component({
  selector: 'question-badge',
  templateUrl: './question-badge.component.html',
  styleUrls: []
})
export class QuestionBadgeComponent {
  @Input() type!: string;
  @Input() contributionCount: number;
  @Input() isUnlocked: boolean;
  contributionTypeText: string;

  constructor() {}

  ngOnInit(): void {
    if (this.type === AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION) {
      this.contributionTypeText = 'Submission';
    } else if (this.type === AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW) {
      this.contributionTypeText = 'Review';
    } else if (
      this.type === AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION
    ) {
      this.contributionTypeText = 'Correction';
    } else {
      throw new Error('Invalid contribution type.');
    }

    if (this.contributionCount > 1) {
      this.contributionTypeText += 's';
    }
  }
}
