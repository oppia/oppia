// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for set of translatable html content id editor.
 */
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

interface Choice {
  val: string;
}

@Component({
  selector: 'set-of-translatable-html-content-ids-editor',
  templateUrl: './set-of-translatable-html-content-ids-editor.component.html',
  styleUrls: [],
})
export class SetOfTranslatableHtmlContentIdsEditorComponent
  implements OnInit, OnChanges
{
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() initArgs!: {choices: Choice[]};
  @Input() modalId!: symbol;
  @Input() value!: string[];
  @Output() valueChanged = new EventEmitter();
  choices!: Choice[];
  selections!: boolean[];
  SCHEMA = {
    type: 'list',
    items: {
      type: 'html',
    },
  };

  ngOnInit(): void {
    if (!this.value) {
      this.value = [];
    }
    this.choices = this.initArgs.choices;
    this.updateSelections();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle external value changes (from parent component)
    if (changes.value && !changes.value.firstChange) {
      this.updateSelections();
    }
  }

  private updateSelections(): void {
    this.selections = this.choices.map(
      choice => this.value.indexOf(choice.val) !== -1
    );
  }

  toggleSelection(choiceListIndex: number): void {
    // Update the selections array first (for immediate UI feedback)
    this.selections[choiceListIndex] = !this.selections[choiceListIndex];

    let newValue = [...this.value];
    const choiceContentId = this.choices[choiceListIndex].val;
    const selectedChoicesIndex = this.value.indexOf(choiceContentId);

    if (selectedChoicesIndex > -1) {
      newValue.splice(selectedChoicesIndex, 1);
    } else {
      newValue.push(this.choices[choiceListIndex].val);
    }

    this.value = newValue;
    this.valueChanged.emit(this.value);
  }
}
