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
 * @fileoverview Unit tests for AddWorkedExampleModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ChangeDetectorRef, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AddWorkedExampleModalComponent} from './add-worked-example.component';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

describe('Add Worked Example Modal Component', () => {
  let component: AddWorkedExampleModalComponent;
  let fixture: ComponentFixture<AddWorkedExampleModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [AddWorkedExampleModalComponent],
      providers: [
        ChangeDetectorRef,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddWorkedExampleModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    fixture.detectChanges();
  });

  it('should initialize properties after component is initialized', () => {
    expect(component.tmpWorkedExampleQuestionHtml).toEqual('');
    expect(component.tmpWorkedExampleExplanationHtml).toBe('');
  });

  it('should close modal when saving worked example', () => {
    spyOn(ngbActiveModal, 'close');
    component.updateLocalQues('question');
    component.updateLocalExp('explanation');

    component.saveWorkedExample();

    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      workedExampleQuestionHtml: 'question',
      workedExampleExplanationHtml: 'explanation',
    });
  });

  it('should get schema', () => {
    expect(component.getSchema()).toEqual(component.WORKED_EXAMPLE_FORM_SCHEMA);
  });

  it('should update tmpWorkedExampleQuestionHtml', () => {
    component.tmpWorkedExampleQuestionHtml = 'ques';

    let ques = 'new ques';
    component.updateLocalQues(ques);

    expect(component.tmpWorkedExampleQuestionHtml).toEqual(ques);
  });

  it('should update tmpWorkedExampleExplanationHtml', () => {
    component.tmpWorkedExampleExplanationHtml = 'exp';

    let exp = 'new exp';
    component.updateLocalExp(exp);

    expect(component.tmpWorkedExampleExplanationHtml).toEqual(exp);
  });
});
