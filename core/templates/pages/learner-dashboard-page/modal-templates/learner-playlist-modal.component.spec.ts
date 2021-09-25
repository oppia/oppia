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
 * @fileoverview Unit tests for for learnerPlaylistModal.
 */

import { async, ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LearnerPlaylistModalComponent } from './learner-playlist-modal.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockUrlInterpolationService {
  interpolateUrl(): void {
    return;
  }
}

describe('Learner Playlist Modal Component', function() {
  let component: LearnerPlaylistModalComponent;
  let fixture: ComponentFixture<LearnerPlaylistModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LearnerPlaylistModalComponent, MockTranslatePipe],
      providers: [
        {
          provide: NgbActiveModal, useClass: MockActiveModal
        },
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService
        },
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerPlaylistModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    component.activityId = '0';
    component.activityTitle = 'Title';
    component.activityType = 'exploration';
    component.removeFromLearnerPlaylistUrl = (
      '/learnerplaylistactivityhandler/exploration/0');
    fixture.detectChanges();
  });


  it('should remove exploration in learner playlist when clicking on' +
    'remove button', fakeAsync(() => {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.removeFromLearnerPlaylistUrl = (
      '/learnerplaylistactivityhandler/exploration/0');
    component.remove();
    flushMicrotasks();
    expect(closeSpy).toHaveBeenCalledWith(
      component.removeFromLearnerPlaylistUrl);
  }));

  it('should not remove exploration in learner playlist' +
    'when clicking on cancel button', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel();
    expect(dismissSpy).toHaveBeenCalled();
  });
});
