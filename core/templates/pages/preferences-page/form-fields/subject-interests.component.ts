import {ENTER} from '@angular/cdk/keycodes';
import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatChipInputEvent, MatChipList} from '@angular/material/chips';
import { cloneDeep } from 'lodash';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

@Component({
  selector: 'oppia-subject-interests',
  templateUrl: './subject-interests.component.html'
})
export class SubjectInterestsComponent {
  @Input() subjectInterests: string[];
  @Output() subjectInterestsChange: EventEmitter<string[]> = (
    new EventEmitter());
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER];
  fruitCtrl = new FormControl();
  filteredSubjectInterests: Observable<string[]>;
  allSubjectInterests: string[] = [];
  @ViewChild('chipList') chipList: MatChipList;
  @ViewChild('fruitInput') fruitInput: ElementRef<HTMLInputElement>;

  constructor() {
    this.filteredSubjectInterests = this.fruitCtrl.valueChanges.pipe(
      startWith(null),
      map((fruit: string | null) => fruit ? this._filter(
        fruit) : this.allSubjectInterests.slice()));
  }

  ngOnInit(): void {
    this.fruitCtrl.valueChanges.subscribe((value: string) => {
      if (!this.validInput(value)) {
        this.chipList.errorState = true;
      } else {
        this.chipList.errorState = false;
      }
    });
    this.allSubjectInterests = cloneDeep(this.subjectInterests);
  }

  validInput(value: string): boolean {
    return value === value.toLowerCase() &&
      this.subjectInterests.indexOf(value) < 0 ? true : false;
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (!value) {
      return;
    }

    if (this.validInput(value)) {
      this.subjectInterests.push(value);
      if (this.allSubjectInterests.indexOf(value) < 0) {
        this.allSubjectInterests.push(value);
      }
      this.subjectInterestsChange.emit(this.subjectInterests);
      this.fruitInput.nativeElement.value = '';
    }
  }

  remove(fruit: string): void {
    const index = this.subjectInterests.indexOf(fruit);

    if (index >= 0) {
      this.subjectInterests.splice(index, 1);
      this.subjectInterestsChange.emit(this.subjectInterests);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    if (this.subjectInterests.indexOf(event.option.viewValue) > -1) {
      this.remove(event.option.value);
    } else {
      this.add(event.option);
    }
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.allSubjectInterests.filter(
      fruit => fruit.toLowerCase().includes(filterValue));
  }
}
