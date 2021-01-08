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
 * @fileoverview Unit tests for for learnerPlaylistModal.
 */
import { HttpTestingController } from '@angular/common/http/testing';
import { async, ComponentFixture, flushMicrotasks, TestBed } from
  '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CsrfTokenService } from 'services/csrf-token.service';
import { LearnerPlaylistModalComponent } from './learner-playlist-modal.component';


class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

describe('Learner Playlist Modal Component', function() {
  let component: LearnerPlaylistModalComponent;
  let fixture: ComponentFixture<LearnerPlaylistModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let csrfService: CsrfTokenService;
  let httpTestingController: HttpTestingController;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LearnerPlaylistModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        {
          csrfService: CsrfTokenService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerPlaylistModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.get(NgbActiveModal);
    csrfService = TestBed.get(CsrfTokenService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  spyOn(csrfService, 'getTokenAsync').and.callFake(
    (): Promise<string> => {
      var deferred = new Promise<string>((resolve) => {
        resolve('sample-csrf-token');
      });
      return deferred;
    });

  it('should call http for deleting from learner playlist when clicking on' +
  ' remove button', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    var req = httpTestingController.expectOne(
      '/learnerplaylistactivityhandler/exploration/0');
    expect(req.request.method).toEqual('DELETE');
    req.flush(200);
    flushMicrotasks();
    component.remove();
    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should not call http delete when clicking on cancel button', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel();
    httpTestingController.verify();
    expect(dismissSpy).toHaveBeenCalled();
  });
});
