// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tag filter component for the blog home page.
 */

import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter} from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import '../blog-home-page.component.css';

@Component({
  selector: 'oppia-tag-filter',
  templateUrl: './tag-filter.component.html'
})

export class TagFilterComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() listOfDefaultTags!: string[];
  @Input() smallScreenViewIsActive: boolean = false;
  @Input() selectedTags: string[] = [];
  @Output() selectionsChange: EventEmitter<string[]> = (
    new EventEmitter());

  separatorKeysCodes: number[] = [ENTER, COMMA];
  tagFilter = new FormControl('');
  searchDropDownTags: string[] = [];
  filteredTags!: Observable<string[]>;

  @ViewChild('tagFilterInput') tagFilterInput!: ElementRef<HTMLInputElement>;

  constructor() {
    this.filteredTags = this.tagFilter.valueChanges.pipe(
      startWith(null),
      map((tag: string | null) => (
        tag ? this.filter(tag) : this.searchDropDownTags.slice())),
    );
  }

  filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.searchDropDownTags.filter(
      tag => tag.toLowerCase().includes(filterValue));
  }

  removeTag(tag: string, tagsList: string[]): void {
    const index = tagsList.indexOf(tag);
    if (index >= 0) {
      tagsList.splice(index, 1);
    }
  }

  deselectTag(tag: string): void {
    this.removeTag(tag, this.selectedTags);
    this.refreshSearchDropDownTags();
    this.tagFilter.setValue(null);
    this.selectionsChange.emit(this.selectedTags);
  }

  selectTag(event: { option: { viewValue: string}}): void {
    this.selectedTags.push(event.option.viewValue);
    this.refreshSearchDropDownTags();
    this.tagFilterInput.nativeElement.value = '';
    this.tagFilter.setValue(null);
    this.selectionsChange.emit(this.selectedTags);
  }

  refreshSearchDropDownTags(): void {
    this.searchDropDownTags = this.listOfDefaultTags;
    if (this.selectedTags.length > 0) {
      for (let tag of this.selectedTags) {
        this.removeTag(tag, this.searchDropDownTags);
      }
    }
  }

  ngOnInit(): void {
    this.refreshSearchDropDownTags();
  }
}
