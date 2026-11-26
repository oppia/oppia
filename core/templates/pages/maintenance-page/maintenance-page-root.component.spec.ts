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
 * @fileoverview Unit tests for Maintenance Page Root component.
 */

import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {PageHeadService} from 'services/page-head.service';

import {
  MAINTENANCE_PAGE_META,
  MAINTENANCE_PAGE_TITLE,
  MaintenancePageRootComponent,
} from './maintenance-page-root.component';

describe('MaintenancePageRootComponent', () => {
  let fixture: ComponentFixture<MaintenancePageRootComponent>;
  let component: MaintenancePageRootComponent;
  let pageHeadService: PageHeadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MaintenancePageRootComponent],
      providers: [PageHeadService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MaintenancePageRootComponent);
    component = fixture.componentInstance;
    pageHeadService = TestBed.inject(PageHeadService);
  });

  it('should have the title and meta tags set', () => {
    expect(MAINTENANCE_PAGE_TITLE).toEqual('Oppia Maintenance Page');
    expect(MAINTENANCE_PAGE_META.length).toEqual(2);
  });

  afterEach(() => {
    document.documentElement.classList.remove('oppia-angular-ready');
  });

  it('should set the static title and meta tags', () => {
    spyOn(pageHeadService, 'updateTitleAndMetaTags');

    component.ngOnInit();

    expect(pageHeadService.updateTitleAndMetaTags).toHaveBeenCalledWith(
      MAINTENANCE_PAGE_TITLE,
      MAINTENANCE_PAGE_META
    );
  });

  it('should reveal the live page after the view is initialized', () => {
    component.ngAfterViewInit();

    expect(
      document.documentElement.classList.contains('oppia-angular-ready')
    ).toBeTrue();
  });
});
