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
  @Input() testIsPassed: boolean;
  circle: SVGCircleElement;
  radius: number;
  circumference: number;
  COLORS_FOR_PASS_FAIL_MODE = QuestionPlayerConstants.COLORS_FOR_PASS_FAIL_MODE;

  setScore(percent: number): void {
    const offset = this.circumference - percent / 100 * this.circumference;
    this.circle.style.strokeDashoffset = offset.toString();
  }

  getScoreRingColor(): string {
    if (this.testIsPassed) {
      return this.COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR;
    } else {
      return this.COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR;
    }
  }

  getScoreOuterRingColor(): string {
    if (this.testIsPassed) {
      // Return color green when passed.
      return this.COLORS_FOR_PASS_FAIL_MODE.PASSED_COLOR_OUTER;
    } else {
      // Return color orange when failed.
      return this.COLORS_FOR_PASS_FAIL_MODE.FAILED_COLOR_OUTER;
    }
  }

  getScoreRing(): boolean {
    if (document.querySelector('.score-ring-circle')) {
      this.circle = (
        document.querySelector('.score-ring-circle') as SVGCircleElement);
      return true;
    }
    return false;
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
    // In certain case(s), such as when the results page is reloaded,
    // document.querySelector() attempts to grab the required element before
    // it even exists in the view causing it to return null,
    // thus breaking the score-ring. Checking for the existence of
    // the element before retrieving it fixes this problem.
    // ngOnInit() (and hence getScoreRing() too) is called recursively until
    // the circle element is returned by document.querySelector()

    if (!this.getScoreRing()) {
      let that = this;
      setTimeout(function() {
        that.ngOnInit();
      }, 160);
      return;
    }
    this.radius = this.circle.r.baseVal.value;
    this.circumference = (this.radius * 2 * Math.PI);
    // The default stroke-dashoffset value for an svg-element is 0
    // (visually, this renders the score-ring as filled 100%). To initialize
    // the score-ring as filled 0%, the stroke-dashoffset value is set to the
    // circumference of the circle. However, since transition-duration is 5s,
    // the ring can be caught animating down to 0%.
    // To instantly render the score-ring as 0% filled, transition-duration is
    // temporarily set to 0s until stroke-dashoffset has been set, and then
    // reverted back to 5s so subsequent animations can play out as intended.

    this.circle.style.transitionDuration = '0s';
    this.circle.style.transitionDelay = '0s';
    this.circle.style.strokeDasharray = (
      `${this.circumference} ${this.circumference}`);
    this.circle.style.strokeDashoffset = this.circumference.toString();
    // A reflow needs to be triggered so that the browser picks up the
    // assigned starting values before reverting back the transition-duration
    // and transition-delay values. clientHeight property triggers a reflow.

    this.circle.clientHeight;
    this.circle.style.transitionDuration = '5s';
    this.circle.style.transitionDelay = '2s';
    this.setScore(this.score);
  }
}

angular.module('oppia').directive(
  'oppiaScoreRing', downgradeComponent({
    component: ScoreRingComponent
  }) as angular.IDirectiveFactory);
