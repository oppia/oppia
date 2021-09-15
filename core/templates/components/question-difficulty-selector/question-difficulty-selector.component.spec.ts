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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatRadioChange, _MatRadioButtonBase } from '@angular/material/radio';
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { QuestionDifficultySelectorComponent } from './question-difficulty-selector.component';

/**
 * @fileoverview Unit tests for QuestionDifficultySelectorComponent
 */

describe('QuestionDifficultySelectorComponent', () => {
  let component: QuestionDifficultySelectorComponent;
  let fixture: ComponentFixture<QuestionDifficultySelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [QuestionDifficultySelectorComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionDifficultySelectorComponent);
    component = fixture.componentInstance;
  });

  it('should set available difficulty values on initialization', () => {
    expect(component.availableDifficultyValues).toEqual([]);

    component.ngOnInit();

    expect(component.availableDifficultyValues).toEqual([0.3, 0.6, 0.9]);
  });

  it('should update skill\'s difficulty', () => {
    component.skillWithDifficulty = new SkillDifficulty('id', '', 0.6);
    spyOn(component.skillWithDifficultyChange, 'emit');
    let mockMatRadioChange: MatRadioChange = {
      source: {} as _MatRadioButtonBase,
      value: 0.9
    };

    expect(component.skillWithDifficulty.getDifficulty()).toBe(0.6);

    component.updateSkillWithDifficulty(mockMatRadioChange);

    expect(component.skillWithDifficulty.getDifficulty()).toBe(0.9);
    expect(component.skillWithDifficultyChange.emit).toHaveBeenCalled();
  });
});
