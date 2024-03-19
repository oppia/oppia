// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the Collection player page root component.
 */

import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AppConstants} from 'app.constants';
import {PageHeadService} from 'services/page-head.service';
import {CollectionPlayerPageRootComponent} from './collection-player-page-root.component';
import {TranslateModule} from '@ngx-translate/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';

describe('CollectionPlayerPageRootComponent', () => {
  let component: CollectionPlayerPageRootComponent;
  let fixture: ComponentFixture<CollectionPlayerPageRootComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      declarations: [CollectionPlayerPageRootComponent],
      providers: [PageHeadService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(CollectionPlayerPageRootComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct title and meta tag', () => {
    expect(component.title).toEqual(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.COLLECTION_PLAYER.TITLE
    );
    expect(component.meta).toEqual(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.COLLECTION_PLAYER.META
    );
  });
});
