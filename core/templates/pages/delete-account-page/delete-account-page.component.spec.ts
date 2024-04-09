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
 * @fileoverview Unit tests for delete account page.
 */

import {ComponentFixture, fakeAsync, TestBed} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DeleteAccountPageComponent} from './delete-account-page.component';
import {DeleteAccountBackendApiService} from './services/delete-account-backend-api.service';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('Delete account page', () => {
  let component: DeleteAccountPageComponent;
  let fixture: ComponentFixture<DeleteAccountPageComponent>;
  let deleteAccountService: DeleteAccountBackendApiService;
  let ngbModal: NgbModal;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [DeleteAccountPageComponent, MockTranslatePipe],
      providers: [DeleteAccountBackendApiService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteAccountPageComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    deleteAccountService = TestBed.inject(DeleteAccountBackendApiService);
    spyOn(deleteAccountService, 'deleteAccount').and.callThrough();
  });

  it('should open a delete account modal', fakeAsync(() => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        result: Promise.resolve('success'),
      } as NgbModalRef;
    });
    component.deleteAccount();
    expect(modalSpy).toHaveBeenCalled();
  }));

  it('should do nothing when cancel button is clicked', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        result: Promise.reject('cancel'),
      } as NgbModalRef;
    });

    component.deleteAccount();

    expect(modalSpy).toHaveBeenCalled();
  });
});
