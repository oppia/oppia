// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for displaying real-time score tracking.
 */

import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import './score-tracker.component.css';

@Component({
  selector: 'oppia-score-tracker',
  templateUrl: './score-tracker.component.html',
  styleUrls: ['./score-tracker.component.css'],
})
export class ScoreTrackerComponent implements OnChanges {
  @Input() correctAnswers: number = 0;
  @Input() totalAnswered: number = 0;
  @Input() lastAnswerCorrect: boolean | null = null;

  scorePercentage: number = 0;
  showFeedback: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['totalAnswered'] || changes['correctAnswers']) {
      this.updateScorePercentage();
    }

    // Show feedback animation when a new answer is submitted
    if (changes['lastAnswerCorrect'] && this.lastAnswerCorrect !== null) {
      this.showFeedback = true;
      setTimeout(() => {
        this.showFeedback = false;
      }, 1500);
    }
  }

  updateScorePercentage(): void {
    if (this.totalAnswered > 0) {
      this.scorePercentage = (this.correctAnswers / this.totalAnswered) * 100;
    } else {
      this.scorePercentage = 0;
    }
  }

  getScoreColor(): string {
    if (this.totalAnswered === 0) {
      return '#9E9E9E'; // Gray for no answers yet
    }
    const percentage = (this.correctAnswers / this.totalAnswered) * 100;
    if (percentage >= 70) {
      return '#00965F'; // Green for good score
    } else if (percentage >= 50) {
      return '#F89E1C'; // Orange for medium score
    } else {
      return '#D92818'; // Red for low score
    }
  }

  getFeedbackClass(): string {
    if (!this.showFeedback || this.lastAnswerCorrect === null) {
      return '';
    }
    return this.lastAnswerCorrect ? 'feedback-correct' : 'feedback-incorrect';
  }
}
