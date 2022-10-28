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
 * @fileoverview Wrapper over mat-slider for audio-bar.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'oppia-audio-slider',
  template: `<mat-slider
    color="accent"
    [value]="value"
    style="width: 100%;"
    [thumbLabel]="thumbLabel"
    [max]="max"
    (change)="setDuration($event)"
    tick-interval="auto"
    [step]="1"
    aria-label="audio-slider">
  </mat-slider>`,
  styles: [`
  .mat-accent /deep/ .mat-slider-track-fill,
  .mat-accent /deep/ .mat-slider-thumb,
  .mat-accent /deep/ .mat-slider-thumb-label {
    background: #ff4081;
  }`]
})
export class AudioSliderComponent {
  // These properties are initialized using component interactions
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() value!: number;
  @Input() max!: number;
  @Input() thumbLabel = false;
  @Output() valueChange = new EventEmitter<{ value: number }>();
  constructor() { }

  setDuration(event: {value: number}): void {
    this.valueChange.emit(event);
  }
}

angular.module('oppia').directive('oppiaAudioSlider', downgradeComponent({
  component: AudioSliderComponent
}) as angular.IDirectiveFactory);
