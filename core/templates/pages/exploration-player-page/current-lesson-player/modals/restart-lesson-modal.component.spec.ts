// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for RestartLessonModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {SharedPipesModule} from '../../../../filters/shared-pipes.module';
import {RestartLessonModalComponent} from './restart-lesson-modal.component';
import {MockTranslatePipe} from '../../../../tests/unit-test-utils';

describe('Restart Lesson Modal Component', () => {
  let component: RestartLessonModalComponent;
  let fixture: ComponentFixture<RestartLessonModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, SharedPipesModule],
      declarations: [RestartLessonModalComponent, MockTranslatePipe],
      providers: [NgbActiveModal],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RestartLessonModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should close the modal when the learner confirms the restart', () => {
    const closeSpy = spyOn(ngbActiveModal, 'close');

    component.confirm();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should dismiss the modal when the learner cancels the restart', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss');

    component.cancel();

    expect(dismissSpy).toHaveBeenCalled();
  });
});
