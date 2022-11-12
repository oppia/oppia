import { Component, Input } from '@angular/core';
import { AppConstants } from 'app.constants';

@Component({
  selector: 'translation-badge',
  templateUrl: './translation-badge.component.html',
  styleUrls: []
})
export class TranslationBadgeComponent {
  @Input() type!: string;
  @Input() value: number;
  @Input() language!: string;
  @Input() isUnlocked: boolean;
  contributionTypeText: string;

  fontSize: string = '13px';
  lineHeight: string = '20px';

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

    if (this.value > 1) {
      this.contributionTypeText += 's';
    }

    if (this.language.length >= 10) {
      this.fontSize = '10px';
    }

    if (this.language.split(' ').length > 1) {
      this.lineHeight = '90%';
    }
  }
}
