// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AddMisconceptionModalComponent.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { SkillEditorStateService } from '../services/skill-editor-state.service';
import { AddMisconceptionModalComponent } from './add-misconception-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Add Misconception Modal Component', function() {
  let component: AddMisconceptionModalComponent;
  let fixture: ComponentFixture<AddMisconceptionModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let skillEditorStateService: SkillEditorStateService;
  let skillObjectFactory: SkillObjectFactory;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AddMisconceptionModalComponent
      ],
      providers: [
        SkillEditorStateService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMisconceptionModalComponent);
    component = fixture.componentInstance;
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);
    skillEditorStateService = TestBed.inject(SkillEditorStateService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    fixture.detectChanges();
  });

});
