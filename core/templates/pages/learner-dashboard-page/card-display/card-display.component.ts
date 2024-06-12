// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component to display lesson cards based on tab
 */
import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';

@Component({
  selector: 'oppia-card-display',
  templateUrl: './card-display.component.html',
})
export class CardDisplayComponent {
  @Input() headingI18n!: string;
  @Input() numCards!: number;
  @Input() tabType!: string;
  @Input() cardWidth: number = 232;

  @ViewChild('cards', {static: false}) cards!: ElementRef;

  currentShift: number = 0;
  maxShifts: number = 0;
  lastShift: number = 0;

  getMaxShifts(width: number): number {
    return this.numCards - Math.floor(width / this.cardWidth);
  }

  nextCard(num: number): void {
    const allCards = this.cards.nativeElement;
    this.maxShifts = this.getMaxShifts(allCards.offsetWidth);
    this.lastShift =
      ((this.cardWidth * (this.numCards - (this.maxShifts - 1))) %
        allCards.offsetWidth) +
      28.5;

    if (allCards !== null) {
      if (this.currentShift > num) {
        allCards.scrollLeft -= this.shiftLeft();
      } else {
        allCards.scrollLeft += this.shiftRight(num);
      }
    }
    this.currentShift = num;
  }

  shiftLeft(): number {
    if (this.currentShift === this.maxShifts) {
      return this.lastShift;
    }
    return this.cardWidth - (this.currentShift === 1 ? 32 : 0);
  }

  shiftRight(nextShift: number): number {
    if (nextShift === 1) {
      return this.cardWidth - 32;
    }
    return nextShift === this.maxShifts ? this.lastShift : this.cardWidth;
  }
}

angular
  .module('oppia')
  .directive(
    'cardDisplayComponent',
    downgradeComponent({component: CardDisplayComponent})
  );
