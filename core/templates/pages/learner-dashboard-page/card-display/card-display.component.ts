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
import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  HostListener,
  AfterContentInit,
  NgZone,
} from '@angular/core';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
@Component({
  selector: 'oppia-card-display',
  templateUrl: './card-display.component.html',
})
export class CardDisplayComponent implements AfterContentInit {
  @Input() headingI18n!: string;
  @Input() numCards!: number;
  @Input() controlType: string = 'arrow';
  @Input() displayMaxWidth: string = '100%';
  @Input() cardWidth: number = 232;

  @ViewChild('cards', {static: false}) cards!: ElementRef;

  currentShift: number = 0;
  maxShifts: number = 0;
  lastShift: number = 0;
  isLanguageRTL: boolean = false;
  currentToggleState: boolean = false;
  toggleButtonVisibility: boolean = false;
  arrowButtonVisibility: boolean = false;

  constructor(
    private I18nLanguageCodeService: I18nLanguageCodeService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.isLanguageRTL = this.I18nLanguageCodeService.isCurrentLanguageRTL();
  }

  ngAfterContentInit(): void {
    this.ngZone.onStable.subscribe(() => {
      this.toggleButtonVisibility = this.isToggleButtonVisible();
      this.arrowButtonVisibility = this.isArrowButtonVisible();
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.toggleButtonVisibility = this.isToggleButtonVisible();
    this.arrowButtonVisibility = this.isArrowButtonVisible();
    if (!this.toggleButtonVisibility) {
      this.currentToggleState = false;
    }
  }

  getMaxShifts(width: number): number {
    return this.numCards - Math.floor(width / this.cardWidth);
  }

  moveCard(num: number): void {
    const allCards = this.cards.nativeElement;
    this.maxShifts = this.getMaxShifts(allCards.offsetWidth);
    this.lastShift =
      ((this.cardWidth * (this.numCards - (this.maxShifts - 1))) %
        allCards.offsetWidth) +
      28.5;

    if (allCards !== null) {
      if (this.currentShift > num) {
        allCards.scrollLeft -=
          (this.isLanguageRTL ? -1 : 1) * this.goToPrevCard();
      } else {
        allCards.scrollLeft +=
          (this.isLanguageRTL ? -1 : 1) * this.goToNextCard(num);
      }
    }
    this.currentShift = num;
  }

  goToPrevCard(): number {
    if (this.currentShift === this.maxShifts) {
      return this.lastShift;
    }
    return this.cardWidth - (this.currentShift === 1 ? 32 : 0);
  }

  goToNextCard(nextShift: number): number {
    if (nextShift === 1) {
      return this.cardWidth - 32;
    }
    return nextShift === this.maxShifts ? this.lastShift : this.cardWidth;
  }

  handleToggleState(updateState: boolean): void {
    this.currentToggleState = updateState;
  }

  getVisibility(): string {
    if (this.controlType === 'arrow') {
      return '';
    }
    return this.currentToggleState
      ? 'card-display-content-shown'
      : 'card-display-content-hidden';
  }

  isToggleButtonVisible(): boolean {
    if (this.controlType === 'arrow') {
      return false;
    }

    return (
      this.cards &&
      this.cards.nativeElement &&
      this.numCards * this.cardWidth - 16 > this.cards.nativeElement.offsetWidth
    );
  }

  isArrowButtonVisible(): boolean {
    if (this.controlType === 'toggle') {
      return false;
    }

    return (
      this.cards &&
      this.cards.nativeElement &&
      this.numCards > 1 &&
      (this.numCards - 1) * this.cardWidth + (this.cardWidth - 32) >
        this.cards.nativeElement.offsetWidth
    );
  }
}
