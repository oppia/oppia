// Copyright 2021 The Oppia Authors. All Rights Reserved.
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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertsService } from 'services/alerts.service';
import { MusicPhraseEditorComponent } from './music-phrase-editor.component';

describe('MusicPhraseEditorComponent', () => {
  let component: MusicPhraseEditorComponent;
  let fixture: ComponentFixture<MusicPhraseEditorComponent>;
  let alertsService: AlertsService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MusicPhraseEditorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    alertsService = TestBed.inject(AlertsService);
    fixture = TestBed.createComponent(MusicPhraseEditorComponent);
    component = fixture.componentInstance;
    component.value = [
      {
        readableNoteName: 'C4',
        noteDuration: {
          num: 1,
          den: 1
        }
      }
    ];
  });

  it('should initialise component when user add interaction', () => {
    component.ngOnInit();
  });

  it('should return proxy when called', () => {
    let proxy = component.localValue;

    expect(proxy).toEqual([]);
  });

  it('should update value when user modifies a note in the list', () => {
    component.localValue = ['C4', 'C4'];

    expect(component._proxy).toEqual(['C4', 'C4']);

    component.updateValue(['C4', 'F4']);

    expect(component.localValue).toEqual(['C4', 'F4']);
    expect(component._proxy).toEqual(['C4', 'F4']);
  });

  it('should add a new note when user adds a new note', () => {
    component.localValue = ['C4'];

    expect(component._proxy).toEqual(['C4']);

    component._proxy.push('C4');

    expect(component._proxy).toEqual(['C4', 'C4']);
  });

  it('should delete a note when user deletes a note', () => {
    component.localValue = ['C4', 'C4'];

    expect(component._proxy).toEqual(['C4', 'C4']);

    component._proxy.splice(1);

    expect(component._proxy).toEqual(['C4']);
  });

  it('should warn user when the numbber of notes on the staff is more' +
  ' than the limit', () => {
    spyOn(alertsService, 'addWarning');
    component.localValue = new Array(8).fill('C4');

    component._proxy.push('C4');

    expect(alertsService.addWarning)
      .toHaveBeenCalledWith('There are too many notes on the staff.');
  });

  it('should not execute updateValue when the user adds/deletes a note', () => {
    component.localValue = ['C4'];

    component.updateValue(['C4', 'C4']);

    expect(component.localValue).toEqual(['C4']);
  });

  it('should return schema when called', () => {
    expect(component.getSchema()).toEqual({
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
        max_value: component._MAX_NOTES_IN_PHRASE
      }]
    });
  });
});
