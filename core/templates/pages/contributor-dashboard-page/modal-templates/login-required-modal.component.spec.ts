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
 * @fileoverview Unit tests for LoginRequiredModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {LoginRequiredModalContent} from 'pages/contributor-dashboard-page/modal-templates/login-required-modal.component';
import {LoginRequiredMessageComponent} from '../login-required-message/login-required-message.component';

describe('Login Required Modal Content', () => {
  let component: LoginRequiredModalContent;
  let fixture: ComponentFixture<LoginRequiredModalContent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [LoginRequiredModalContent, LoginRequiredMessageComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginRequiredModalContent);
    component = fixture.componentInstance;
  }));

  it('should have a publicly accessible activeModal', () => {
    expect(component.activeModal).toBeInstanceOf(NgbActiveModal);
  });
});
