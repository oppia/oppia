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
 * @fileoverview Unit tests for
 * OppiaNoninteractiveSkillreviewConceptCardModalComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {OppiaNoninteractiveSkillreviewConceptCardModalComponent} from './oppia-noninteractive-skillreview-concept-card-modal.component';
class MockNgbActiveModal {
  dismiss(reason: string): Promise<string> {
    return Promise.reject(reason);
  }

  close(reason: string): Promise<string> {
    return Promise.resolve(reason);
  }
}

describe('Oppia Noninteractive Skillreview Concept Card Modal Component', () => {
  const skillId = 'skill1';

  let component: OppiaNoninteractiveSkillreviewConceptCardModalComponent;
  let fixture: ComponentFixture<OppiaNoninteractiveSkillreviewConceptCardModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [OppiaNoninteractiveSkillreviewConceptCardModalComponent],
      providers: [{provide: NgbActiveModal, useClass: MockNgbActiveModal}],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      OppiaNoninteractiveSkillreviewConceptCardModalComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.skillId = skillId;
  });

  it('should initialize component properties after component is initialized', () => {
    component.ngOnInit();
    component.retryTest();
    component.goToNextConceptCard();
    expect(component.isLastConceptCard()).toBe(true);
    expect(component.skillIds[0]).toEqual(skillId);
    expect(component.index).toBe(0);
    expect(component.modalHeader).toBe('Concept Card');
    expect(component.isInTestMode).toBe(false);
  });
});
