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

import {
  Component,
  Input,
  OnChanges,
  AfterViewInit,
  ViewChild,
  ElementRef,
  SimpleChanges,
} from '@angular/core';
import {QuestionPlayerConstants} from '../question-directives/question-player/question-player.constants';

@Component({
  selector: 'oppia-score-ring',
  templateUrl: './score-ring.component.html',
})
export class ScoreRingComponent implements AfterViewInit, OnChanges {
  constructor() {}
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() score!: number;
  @Input() testIsPassed!: boolean;
  @ViewChild('scoreRing') scoreRingElement!: ElementRef<SVGCircleElement>;
  circle!: SVGCircleElement;
  radius!: number;
  circumference!: number;
  COLORS_FOR_PASS_FAIL_MODE = QuestionPlayerConstants.COLORS_FOR_PASS_FAIL_MODE;

  setScore(percent: number): void {
    setTimeout(() => {
      const offset = this.circumference - (percent / 100) * this.circumference;
      this.circle.style.strokeDashoffset = offset.toString();
    }, 2000);
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

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.score &&
      changes.score.currentValue !== changes.score.previousValue &&
      changes.score.currentValue > 0
    ) {
      this.setScore(changes.score.currentValue);
    }
  }

  ngAfterViewInit(): void {
    this.circle = this.scoreRingElement.nativeElement;
    this.radius = this.circle.r.baseVal.value;
    this.circumference = this.radius * 2 * Math.PI;

    this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    this.circle.style.strokeDashoffset = this.circumference.toString();
    // A reflow needs to be triggered so that the browser picks up the
    // assigned starting values of stroke-dashoffset and stroke-dasharray before
    // setting the transition-duration value to '5s', else the ring can be seen
    // animating down to the starting position.
    // clientHeight property triggers a reflow.
    this.circle.clientHeight;
    this.circle.style.transitionDuration = '5s';
    this.setScore(this.score);
  }
}
