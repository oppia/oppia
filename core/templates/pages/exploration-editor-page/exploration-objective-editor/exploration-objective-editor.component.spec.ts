// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for explorationObjectiveEditor component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ExplorationObjectiveEditorComponent} from './exploration-objective-editor.component';
import {ExplorationObjectiveService} from '../services/exploration-objective.service';

describe('Exploration Objective Editor Component', () => {
  let component: ExplorationObjectiveEditorComponent;
  let fixture: ComponentFixture<ExplorationObjectiveEditorComponent>;
  let explorationObjectiveService: ExplorationObjectiveService;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      declarations: [ExplorationObjectiveEditorComponent],
      providers: [ExplorationObjectiveService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExplorationObjectiveEditorComponent);
    component = fixture.componentInstance;

    explorationObjectiveService = TestBed.inject(ExplorationObjectiveService);
    explorationObjectiveService.displayed = '';
    fixture.detectChanges();
  });

  it('should initialize controller properties after its initialization', fakeAsync(() => {
    spyOn(component.onInputFieldBlur, 'emit').and.stub();

    component.inputFieldBlur();
    tick();

    expect(component.onInputFieldBlur.emit).toHaveBeenCalled();
    expect(component).toBeDefined();
  }));
});
