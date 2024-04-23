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

  ngOnInit(): void {}

  getMaxShifts(width: number): number {
    return this.numCards - Math.floor(width / 224);
  }

  nextCard(num: number): void {
    let allCards = this.cards.nativeElement;
    let lastShift =
      ((224 *
        (this.numCards - 1 - (this.getMaxShifts(allCards.offsetWidth) - 2))) %
        allCards.offsetWidth) +
      28.5;

    if (allCards !== null) {
      if (this.shift > num) {
        allCards.scrollLeft -=
          this.shift === this.getMaxShifts(allCards.offsetWidth)
            ? lastShift
            : this.shift === 1
              ? 200
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
