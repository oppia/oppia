// Copyright 2012 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for music phrase editor.
 */

// This component is always editable.
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AlertsService } from 'services/alerts.service';

interface MusicPhraseSchema {
  type: string;
  items: {
    type: string;
    choices: string[];
  };
  'ui_config': {'add_element_text': string;};
  validators: { id: string; 'max_value': number; }[];
}
@Component({
  selector: 'music-phrase-editor',
  templateUrl: './music-phrase-editor.component.html',
  styleUrls: []
})
export class MusicPhraseEditorComponent implements OnInit {
  @Input() modalId;
  @Input() value;

  @Output() valueChanged = new EventEmitter();
  localValue: unknown[] = [];
  // The maximum number of notes allowed in a music phrase.
  _MAX_NOTES_IN_PHRASE = 8;
  schema: MusicPhraseSchema = {
    type: 'list',
    items: {
      type: 'unicode',
      choices: [
        'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5',
        'F5', 'G5', 'A5'
      ]
    },
    ui_config: {
      add_element_text: 'Add Note ♩'
    },
    validators: [{
      id: 'has_length_at_most',
      max_value: this._MAX_NOTES_IN_PHRASE
    }]
  };
  constructor(private alertsService: AlertsService) { }

  ngOnInit(): void {
  }

  updateValue(newValue: unknown[]): void {
    if (newValue === this.localValue) {
      return;
    }
    if (newValue && this.value) {
      if (newValue.length > this._MAX_NOTES_IN_PHRASE) {
        this.alertsService.addWarning(
          'There are too many notes on the staff.');
      } else {
        const parentValues = [];
        for (let i = 0; i < newValue.length; i++) {
          parentValues.push({
            readableNoteName: newValue[i],
            noteDuration: {
              num: 1,
              den: 1
            }
          });
        }
        this.value = parentValues;
        this.localValue = newValue;
        this.valueChanged.emit();
      }
    }
  }

  getSchema(): MusicPhraseSchema {
    return this.schema;
  }
}
angular.module('oppia').directive('musicPhraseEditor', downgradeComponent({
  component: MusicPhraseEditorComponent
}) as angular.IDirectiveFactory);
