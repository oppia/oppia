// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the animated score ring.
 */

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { QuestionPlayerConstants } from '../question-directives/question-player/question-player.constants';

@Component({
  selector: 'oppia-score-ring',
  templateUrl: './score-ring.component.html'
})
export class ScoreRingComponent implements OnInit, OnChanges {
  constructor() {}
  @Input() score;
  @Input() isTestPassed: boolean;
  circle: SVGCircleElement;
  radius: number;
  circumference: number;
  COLORS_FOR_PASS_FAIL_MODE = QuestionPlayerConstants.COLORS_FOR_PASS_FAIL_MODE;

  setScore(percent: number): void {
    const offset = this.circumference - percent / 100 * this.circumference;
    this.circle.style.strokeDashoffset = offset.toString();
  }

  getScoreRingColor(): string {
    if (this.isTestPassed) {
      return this.COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR;
    } else {
      return this.COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR;
    }
  }

  getScoreOuterRingColor(): string {
    if (this.isTestPassed) {
      // Return color green when passed.
      return this.COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR_OUTER;
    } else {
      // Return color orange when failed.
      return this.COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR_OUTER;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.score &&
      changes.score.currentValue !== changes.score.previousValue &&
      changes.score.currentValue > 0
    ) {
      this.setScore(changes.score.currentValue);
    }
  }

  ngOnInit(): void {
    this.circle = <SVGCircleElement>(
      document.querySelector('.score-ring-circle'));
    this.radius = this.circle.r.baseVal.value;
    this.circumference = (this.radius * 2 * Math.PI);
    this.circle.style.strokeDasharray = (
      `${this.circumference} ${this.circumference}`);
    this.circle.style.strokeDashoffset = this.circumference.toString();
  }
}

angular.module('oppia').directive(
  'oppiaScoreRing', downgradeComponent({
    component: ScoreRingComponent
  }) as angular.IDirectiveFactory);
