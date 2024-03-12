// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AddOutcomeModalComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Outcome} from 'domain/exploration/OutcomeObjectFactory';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {AddOutcomeModalComponent} from './add-outcome-modal.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Add Outcome Modal Component', () => {
  let component: AddOutcomeModalComponent;
  let fixture: ComponentFixture<AddOutcomeModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AddOutcomeModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddOutcomeModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should save outcome when closing the modal', () => {
    component.outcome = new Outcome(
      'Dest',
      null,
      new SubtitledHtml('a'.repeat(100), 'contentId'),
      true,
      [],
      'OutcomeExpId',
      'SkillId'
    );
    spyOn(ngbActiveModal, 'close');

    component.save();

    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      outcome: component.outcome,
    });
  });

  it('should check if outcome length is valid', () => {
    component.outcome = new Outcome(
      'Dest',
      null,
      new SubtitledHtml('a'.repeat(100), 'contentId'),
      true,
      [],
      'OutcomeExpId',
      'SkillId'
    );

    expect(component.isFeedbackLengthExceeded()).toBe(false);
  });

  it('should check if hint length is not valid', () => {
    component.outcome = new Outcome(
      'Dest',
      null,
      new SubtitledHtml('a'.repeat(10001), 'contentId'),
      true,
      [],
      'OutcomeExpId',
      'SkillId'
    );

    expect(component.isFeedbackLengthExceeded()).toBe(true);
  });
});
