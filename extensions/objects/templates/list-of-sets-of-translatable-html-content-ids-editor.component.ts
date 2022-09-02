// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for list of sets of translatable html content id
 * editor.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';
import { EventBusGroup, EventBusService } from 'app-events/event-bus.service';

interface Choice {
  id: string;
  selectedRank: string;
  val: string;
}
@Component({
  selector: 'list-of-sets-of-translatable-html-content-ids-editor',
  // eslint-disable-next-line max-len
  templateUrl: './list-of-sets-of-translatable-html-content-ids-editor.component.html',
  styleUrls: []
})
export class ListOfSetsOfTranslatableHtmlContentIdsEditorComponent {
  @Output() valueChanged = new EventEmitter;
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() modalId!: symbol;
  @Input() initArgs!: {
    choices: Choice[];
  };

  @Input() value!: string[][];
  choices!: Choice[];
  initValues!: number[];
  eventBusGroup!: EventBusGroup;
  errorMessage: string = '';
  validOrdering: boolean = true;
  constructor(private eventBusService: EventBusService) {
    this.eventBusGroup = new EventBusGroup(this.eventBusService);
  }

  allowedChoices(): number[] {
    const allowedList: number[] = [];
    for (var i = 1; i <= this.choices.length; i++) {
      allowedList.push(i);
    }
    return allowedList;
  }

  selectItem(choiceListIndex: number): void {
    const choiceContentId = this.choices[choiceListIndex].val;
    const selectedRank = parseInt(
      this.choices[choiceListIndex].selectedRank) - 1;
    this.errorMessage = '';
    let choiceIdHasBeenAdded = false;

    for (let i = 0; i < this.value.length; i++) {
      choiceIdHasBeenAdded = false;
      const choiceIdIndex = this.value[i].indexOf(choiceContentId);
      if (choiceIdIndex > -1) {
        if (i !== selectedRank) {
          this.value[i].splice(choiceIdIndex, 1);
          if (this.value[selectedRank] === undefined) {
            this.value[selectedRank] = [choiceContentId];
          } else {
            this.value[selectedRank].push(choiceContentId);
          }
        }
        this.valueChanged.emit(this.value);
        choiceIdHasBeenAdded = true;
        break;
      }
    }
    if (!choiceIdHasBeenAdded) {
      if (this.value[selectedRank] === undefined) {
        this.value[selectedRank] = [choiceContentId];
      } else {
        this.value[selectedRank].push(choiceContentId);
      }
      this.valueChanged.emit(this.value);
    }
    // Removing any empty arrays from the end.
    while (this.value.length > 0 && (
      this.value[this.value.length - 1].length === 0)) {
      this.value.pop();
      this.valueChanged.emit(this.value);
    }
    // Inserting empty arrays for skipped slots in between.
    for (let i = 0; i < this.value.length; i++) {
      if (this.value[i] === undefined) {
        this.value[i] = [];
      }
    }
    this.validateOrdering();
  }

  validateOrdering(): void {
    const selectedRankList = [];
    for (let i = 0; i < this.choices.length; i++) {
      selectedRankList.push(+this.choices[i].selectedRank);
    }
    selectedRankList.sort();

    if (selectedRankList[0] !== 1) {
      this.errorMessage = ('Please assign some choice at position 1.');
      this.eventBusGroup.emit(new ObjectFormValidityChangeEvent({
        value: true,
        modalId: this.modalId
      }));
      this.validOrdering = false;
      return;
    }
    for (let i = 1; i < selectedRankList.length; i++) {
      if (selectedRankList[i] - selectedRankList[i - 1] > 1) {
        this.errorMessage = (
          'Please assign some choice at position ' +
          String(selectedRankList[i - 1] + 1) + '.');
        this.eventBusGroup.emit(new ObjectFormValidityChangeEvent({
          value: true,
          modalId: this.modalId
        }));
        this.validOrdering = false;
        return;
      }
    }
    this.errorMessage = '';
    this.eventBusGroup.emit(new ObjectFormValidityChangeEvent({
      value: false,
      modalId: this.modalId
    }));
    this.validOrdering = true;
    return;
  }

  ngOnInit(): void {
    this.initValues = [];
    this.choices = this.initArgs.choices;
    if (this.value === undefined) {
      this.value = [];
    }

    // Initialize the default values.
    if (this.value[0] === undefined || this.value[0].length === 0) {
      this.value = [];
      this.valueChanged.emit(this.value);
      for (let i = 0; i < this.choices.length; i++) {
        this.value.push([this.choices[i].val]);
        this.initValues.push(i + 1);
      }
      this.valueChanged.emit(this.value);
    } else {
      for (let i = 0; i < this.choices.length; i++) {
        const choice = this.choices[i].val;
        for (let j = 0; j < this.value.length; j++) {
          if (this.value[j].indexOf(choice) !== -1) {
            this.initValues.push(j + 1);
            break;
          }
        }
      }
    }
  }
}

angular.module('oppia').directive(
  'listOfSetsOfTranslatableHtmlContentIdsEditor', downgradeComponent({
    component: ListOfSetsOfTranslatableHtmlContentIdsEditorComponent
  }) as angular.IDirectiveFactory);
