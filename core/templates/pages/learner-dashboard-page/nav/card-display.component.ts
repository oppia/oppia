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

  ngOnInit(): void {}

  getMaxShifts(width: number): number {
    return this.numCards - Math.floor((width + 15) / 231);
  }

  nextCard(num: number): void {
    let allCards = this.cards.nativeElement;
    let lastShift =
      231 %
      ((allCards.offsetWidth +
        15 -
        115.5 * this.getMaxShifts(allCards.offsetWidth)) %
        231);
    console.log(lastShift);
    if (allCards !== null) {
      if (this.shift > num) {
        allCards.scrollLeft -=
          this.shift === this.getMaxShifts(allCards.offsetWidth)
            ? lastShift + 115.5
            : 115.5;
      } else {
        allCards.scrollLeft +=
          num === this.getMaxShifts(allCards.offsetWidth)
            ? lastShift + 115.5
            : 115.5;
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
