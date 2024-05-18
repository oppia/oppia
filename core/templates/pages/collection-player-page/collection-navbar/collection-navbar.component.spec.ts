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
 * @fileoverview Unit tests for collection navbar component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  TestBed,
  ComponentFixture,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {CollectionNavbarComponent} from './collection-navbar.component';
import {ReadOnlyCollectionBackendApiService} from 'domain/collection/read-only-collection-backend-api.service';
import {UrlService} from 'services/contextual/url.service';

describe('Collection navbar component', () => {
  let us: UrlService;
  let rocbas: ReadOnlyCollectionBackendApiService;
  let component: CollectionNavbarComponent;
  let fixture: ComponentFixture<CollectionNavbarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CollectionNavbarComponent],
      providers: [UrlService, ReadOnlyCollectionBackendApiService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionNavbarComponent);
    component = fixture.componentInstance;
    us = TestBed.inject(UrlService);
    rocbas = TestBed.inject(ReadOnlyCollectionBackendApiService);
  });

  it('should load the component properly on playing a collection', () => {
    const expectedCollectionDetail = {
      canEdit: true,
      title: 'Test title',
    };
    spyOn(us, 'getCollectionIdFromUrl').and.returnValue('abcdef');
    spyOn(rocbas, 'getCollectionDetails').and.returnValue(
      expectedCollectionDetail
    );

    component.ngOnInit();
    rocbas.onCollectionLoad.emit();
    expect(us.getCollectionIdFromUrl).toHaveBeenCalled();
    expect(rocbas.getCollectionDetails).toHaveBeenCalledWith('abcdef');
    expect(component.collectionTitle).toBe('Test title');
    component.ngOnDestroy();
  });

  it('should throw error if collection title is null', fakeAsync(() => {
    const expectedCollectionDetail = {
      canEdit: true,
      title: null,
    };
    spyOn(us, 'getCollectionIdFromUrl').and.returnValue('abcdef');
    spyOn(rocbas, 'getCollectionDetails').and.returnValue(
      expectedCollectionDetail
    );

    component.ngOnInit();
    expect(() => {
      rocbas.onCollectionLoad.emit();
      tick();
    }).toThrowError('Collection title is null');
  }));
});
