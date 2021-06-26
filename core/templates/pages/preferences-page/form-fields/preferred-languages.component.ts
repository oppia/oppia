import { ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipList } from '@angular/material/chips';

@Component({
  selector: 'oppia-preferred-languages',
  templateUrl: './preferred-languages.component.html'
})
export class PreferredLanguagesComponent {
  @Input() preferredLanguages: string[];
  @Input() choices: string[];
  @Output() preferredLanguagesChange: EventEmitter<string[]> = (
    new EventEmitter());
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER];
  fruitCtrl = new FormControl();
  @ViewChild('chipList') chipList: MatChipList;
  @ViewChild('fruitInput') fruitInput: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    this.fruitCtrl.valueChanges.subscribe((value: string) => {
      if (!this.validInput(value)) {
        this.chipList.errorState = true;
      } else {
        this.chipList.errorState = false;
      }
    });
  }

  validInput(value: string): boolean {
    let availableLanguage = false;
    for (let i = 0; i < this.choices.length; i++) {
      if (this.choices[i].id === value) {
        availableLanguage = true;
        break;
      }
    }

    return availableLanguage &&
      this.preferredLanguages.indexOf(value) < 0 ? true : false;
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (!value) {
      return;
    }

    if (this.validInput(value)) {
      this.preferredLanguages.push(value);
      this.preferredLanguagesChange.emit(this.preferredLanguages);
      this.fruitInput.nativeElement.value = '';
    }
  }

  remove(fruit: string): void {
    const index = this.preferredLanguages.indexOf(fruit);

    if (index >= 0) {
      this.preferredLanguages.splice(index, 1);
      this.preferredLanguagesChange.emit(this.preferredLanguages);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    if (this.preferredLanguages.indexOf(event.option.value) > -1) {
      this.remove(event.option.value);
    } else {
      this.add(event.option);
    }
  }
}
