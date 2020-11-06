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
 * @fileoverview Unit tests for LearnerDashboardSuggestionModalController.
 */
import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, async } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { LearnerDashboardSuggestionModalComponent } from 'pages/learner-dashboard-page/suggestion-modal/learner-dashboard-suggestion-modal.component.ts';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value: string, params: Object | undefined):string {
    return value;
  }
}

class MockActiveModal {
  dismiss(): void {
    return;
  }
}

describe('Learner Dashboard Suggestion Modal Controller', () => {
  let component: LearnerDashboardSuggestionModalComponent;
  let fixture: ComponentFixture<LearnerDashboardSuggestionModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
        declarations: [LearnerDashboardSuggestionModalComponent, MockTranslatePipe],
        providers: [
          {
            provide:NgbActiveModal,
            useClass: MockActiveModal
          }
        ],
        schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();   
  }))    

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerDashboardSuggestionModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.get(NgbActiveModal);
  })

  it('should dismiss the modal on clicking cancel button', fakeAsync(() => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel();
    fixture.detectChanges();
    expect(dismissSpy).toHaveBeenCalled();
  }));
});
