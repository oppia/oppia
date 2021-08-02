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
 * @fileoverview Unit tests for the login page root component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AppConstants } from 'app.constants';
import { PageMetadataService } from 'services/contextual/page-metadata.service';

import { MockTranslatePipe } from 'tests/unit-test-utils';
import { LoginPageRootComponent } from './login-page-root.component';

describe('Login Page Root', () => {
  let fixture: ComponentFixture<LoginPageRootComponent>;
  let component: LoginPageRootComponent;
  let pageMetadataService: PageMetadataService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        LoginPageRootComponent,
        MockTranslatePipe
      ],
      providers: [
        PageMetadataService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPageRootComponent);
    component = fixture.componentInstance;
    pageMetadataService = TestBed.inject(PageMetadataService);
  });

  it('should successfully instantiate the component',
    () => {
      expect(component).toBeDefined();
    });

  it('should initialize', () => {
    spyOn(pageMetadataService, 'updateMetadata');
    component.ngOnInit();
    expect(pageMetadataService.updateMetadata).toHaveBeenCalledWith(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LOGIN);
  });
});
