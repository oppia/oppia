import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';

@Component({
  selector: 'card-display',
  templateUrl: './card-display.component.html',
})
export class CardDisplayComponent implements OnInit {
  @Input() heading!: string;
  @Input() numCards!: number;
  @Input() tabType!: string;
  @Input() cardWidth: number = 232;

  currentShift: number = 0;

  @ViewChild('cards', {static: false}) cards!: ElementRef;

  ngOnInit(): void {}

  getMaxShifts(width: number): number {
    return this.numCards - Math.floor(width / this.cardWidth);
  }

  nextCard(num: number): void {
    const allCards = this.cards.nativeElement;
    //(this.numCards - 1 - (this.getMaxShifts(allCards.offsetWidth) - 2)))
    const maxShifts = this.getMaxShifts(allCards.offsetWidth);
    const lastShift =
      ((this.cardWidth * (this.numCards - (maxShifts - 1))) %
        allCards.offsetWidth) +
      28.5;

    if (allCards !== null) {
      if (this.currentShift > num) {
        allCards.scrollLeft -= this.shiftLeft({
          max: maxShifts,
          last: lastShift,
        });
      } else {
        allCards.scrollLeft += this.shiftRight({
          max: maxShifts,
          last: lastShift,
          next: num,
        });
      }
    }
    this.currentShift = num;
  }

  shiftLeft(shift: {max: number; last: number}): number {
    if (this.currentShift === shift.max) {
      return shift.last;
    }
    return this.cardWidth - (this.currentShift === 1 ? 32 : 0);
  }

  shiftRight(shift: {max: number; last: number; next: number}): number {
    if (shift.next === 1) {
      return this.cardWidth - 32;
    }
    return shift.next === shift.max ? shift.last : this.cardWidth;
  }
}

angular
  .module('oppia')
  .directive(
    'cardDisplayComponent',
    downgradeComponent({component: CardDisplayComponent})
  );
