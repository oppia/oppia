// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for delete user group confirmation modal.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {DeleteUserGroupConfirmModalComponent} from './delete-user-group-confirm-modal.component';

describe('DeleteUserGroupConfirmModalComponent', () => {
  let component: DeleteUserGroupConfirmModalComponent;
  let fixture: ComponentFixture<DeleteUserGroupConfirmModalComponent>;
  let closeSpy: jasmine.Spy;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeleteUserGroupConfirmModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteUserGroupConfirmModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should be able to close modal', () => {
    component.close();
    expect(closeSpy).toHaveBeenCalled();
  });
});
