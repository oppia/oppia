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
 * @fileoverview Unit tests for the volunteer page root component.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';

import {AppConstants} from 'app.constants';
import {PageHeadService} from 'services/page-head.service';

import {MockTranslatePipe} from 'tests/unit-test-utils';
import {VolunteerPageRootComponent} from './volunteer-page-root.component';

describe('Volunteer Page Root', () => {
  let fixture: ComponentFixture<VolunteerPageRootComponent>;
  let component: VolunteerPageRootComponent;
  let pageHeadService: PageHeadService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [VolunteerPageRootComponent, MockTranslatePipe],
      providers: [PageHeadService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VolunteerPageRootComponent);
    component = fixture.componentInstance;
    pageHeadService = TestBed.inject(PageHeadService);
  });

  it('should successfully instantiate the component', () => {
    expect(component).toBeDefined();
  });

  it('should initialize', () => {
    spyOn(pageHeadService, 'updateTitleAndMetaTags');

    component.ngOnInit();

    expect(pageHeadService.updateTitleAndMetaTags).toHaveBeenCalledWith(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.VOLUNTEER.TITLE,
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.VOLUNTEER.META
    );
  });
});
