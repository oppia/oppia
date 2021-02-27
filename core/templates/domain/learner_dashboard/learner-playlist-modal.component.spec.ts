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

import { async, ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from
  '@angular/core/testing';
import { CsrfTokenService } from 'services/csrf-token.service';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LearnerPlaylistModalComponent } from './learner-playlist-modal.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

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

describe('Learner Playlist Modal Controller', function() {
  let component: LearnerPlaylistModalComponent;
  let csrfService: CsrfTokenService;
  let fixture: ComponentFixture<LearnerPlaylistModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let http: HttpTestingController;
  let urlInterpolationService : UrlInterpolationService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [LearnerPlaylistModalComponent],
      providers: [
        {
          provide: NgbActiveModal, useClass: MockActiveModal
        },
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerPlaylistModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    http = TestBed.inject(HttpTestingController);
    component.activityId = '0';
    component.activityTitle = 'Title';
    component.activityType = 'exploration';
    component.removeFromLearnerPlaylistUrl = (
      '/learnerplaylistactivityhandler/exploration/0');
    fixture.detectChanges();

    csrfService = TestBed.inject(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return new Promise((resolve) => {
        resolve('sample-csrf-token');
      });
    });
  });

  afterEach(() => {
    http.verify();
  });

  it('should call http for deleting from learner playlist when clicking on' +
    ' remove button', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.removeFromLearnerPlaylistUrl = (
      '/learnerplaylistactivityhandler/exploration/0');
    component.remove().then(successHandler, failHandler);
    let req = http.expectOne(
      '/learnerplaylistactivityhandler/exploration/0');
    expect(req.request.method).toEqual('DELETE');
    req.flush(200);
    flushMicrotasks();
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  }));

  it('should return error response when clicking on' +
    ' remove button using invalid Id', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.removeFromLearnerPlaylistUrl = (
      '/learnerplaylistactivityhandler/exploration/invalidId');
    console.log(component.removeFromLearnerPlaylistUrl);
    component.remove().then(successHandler, failHandler);
    let req = http.expectOne(
      '/learnerplaylistactivityhandler/exploration/invalidId')
    expect(req.request.method).toEqual('DELETE');
    req.flush({
      error: 'Invalid Exploration Id'
    }, {
      status: 404, statusText: 'Invalid Exploration Id'
    });
    flushMicrotasks();
    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();

  }));

  it('should not call http delete when clicking on cancel button', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel();
    expect(dismissSpy).toHaveBeenCalled();
  });
});
