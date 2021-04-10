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
 * @fileoverview Unit tests for CollectionLocalNavComponent.
 */

import { EventEmitter } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionLocalNavComponent } from './collection-local-nav.component';
import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service';
import { UrlService } from 'services/contextual/url.service';

describe('CollectionLocalNavComponent', () => {
  let component: CollectionLocalNavComponent;
  let fixture: ComponentFixture<CollectionLocalNavComponent>;
  let rocbs: ReadOnlyCollectionBackendApiService;
  let urlService: UrlService;

  let mockCollectionDetails = {
    canEdit: false,
    title: 'Title of Collection'
  };

  var mockCollectionLoadEventEmitter = new EventEmitter();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CollectionLocalNavComponent],
      imports: [HttpClientTestingModule]
    }).compileComponents();

    rocbs = TestBed.get(ReadOnlyCollectionBackendApiService);
    urlService = TestBed.get(UrlService);

    spyOnProperty(rocbs, 'onCollectionLoad').and.returnValue(
      mockCollectionLoadEventEmitter);
    spyOn(rocbs, 'getCollectionDetails').and.returnValue(mockCollectionDetails);
    spyOn(urlService, 'getCollectionIdFromUrl').and.returnValue('1');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionLocalNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize collectionTitle', () => {
    expect(component.collectionId).toBe('1');
    mockCollectionLoadEventEmitter.emit();
    expect(component.canEdit).toBe(false);
  });
});
