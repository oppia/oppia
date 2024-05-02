import {Component, ElementRef, Input, ViewChild} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';

@Component({
  selector: 'card-display',
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
