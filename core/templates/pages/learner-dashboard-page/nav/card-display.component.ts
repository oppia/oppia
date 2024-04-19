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

  @ViewChild('cards', {static: false}) cards!: ElementRef;

  shift: number = 0;

  constructor() {}

  ngOnInit(): void {
    console.log(this.numCards);
  }

  getMaxShifts(width: number): number {
    return this.numCards - Math.floor((width + 8) / 224);
  }

  nextCard(num: number): void {
    let allCards = this.cards.nativeElement;
    console.log(this.getMaxShifts(allCards.offsetWidth));
    console.log(allCards.offsetWidth);
    console.log(num);
    let lastShift =
      224 -
      (allCards.offsetWidth % 224) +
      (this.getMaxShifts(allCards.offsetWidth) > 1 ? 24 : 0);
    if (allCards !== null) {
      if (this.shift > num) {
        allCards.scrollLeft -=
          this.shift === this.getMaxShifts(allCards.offsetWidth)
            ? 200
            : this.shift === 1
              ? lastShift
              : 224;
      } else {
        allCards.scrollLeft +=
          num === 1
            ? 200
            : num === this.getMaxShifts(allCards.offsetWidth)
              ? lastShift
              : 224;
      }
    }
    this.shift = num;
  }
}

angular
  .module('oppia')
  .directive(
    'cardDisplayComponent',
    downgradeComponent({component: CardDisplayComponent})
  );
