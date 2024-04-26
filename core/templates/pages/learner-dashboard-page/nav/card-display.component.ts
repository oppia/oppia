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
  @Input() cardWidth: number = 216;

  currentShift: number = 0;

  @ViewChild('cards', {static: false}) cards!: ElementRef;

  ngOnInit(): void {}

  getMaxShifts(width: number): number {
    return this.numCards - Math.floor(width / (this.cardWidth + 8));
  }

  nextCard(num: number): void {
    const allCards = this.cards.nativeElement;
    const lastShift =
      (((this.cardWidth + 8) *
        (this.numCards - 1 - (this.getMaxShifts(allCards.offsetWidth) - 2))) %
        allCards.offsetWidth) +
      28.5;

    if (allCards !== null) {
      if (this.currentShift > num) {
        allCards.scrollLeft -=
          this.currentShift === this.getMaxShifts(allCards.offsetWidth)
            ? lastShift
            : this.currentShift === 1
              ? this.cardWidth - 16
              : this.cardWidth + 8;
      } else {
        allCards.scrollLeft +=
          num === 1
            ? this.cardWidth - 16
            : num === this.getMaxShifts(allCards.offsetWidth)
              ? lastShift
              : this.cardWidth + 8;
      }
    }
    this.currentShift = num;
  }
}

angular
  .module('oppia')
  .directive(
    'cardDisplayComponent',
    downgradeComponent({component: CardDisplayComponent})
  );
