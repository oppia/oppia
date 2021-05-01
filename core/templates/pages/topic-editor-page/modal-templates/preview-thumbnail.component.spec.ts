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
 * @fileoverview Unit tests for the preview thumbnail directive.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContextService } from 'services/context.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { PreviewThumbnailComponent } from './preview-thumbnail.component';

describe('Preview Thumbnail Component', () => {
  let imageUploadHelperService: ImageUploadHelperService;
  let contextService: ContextService;
  let component: PreviewThumbnailComponent;
  let fixture: ComponentFixture<PreviewThumbnailComponent>;
  class MockContextSerivce {
    getEntityType: () => 'topic';
    getEntityId: () => '1';
  }
  class MockImageUploadHelperService {
    getTrustedResourceUrlForThumbnailFilename(
        filename: string, entityType: string, entityId: string) {
      return (entityType + '/' + entityId + '/' + filename);
    }
  }
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PreviewThumbnailComponent],
      providers: [
        {
          provide: ContextService,
          useClass: MockContextSerivce
        },
        {
          provide: ImageUploadHelperService,
          useClass: MockImageUploadHelperService
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    contextService = TestBed.inject(ContextService);
    imageUploadHelperService = TestBed.inject(ImageUploadHelperService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewThumbnailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should init the controller', () => {
    spyOn(contextService, 'getEntityId').and.callThrough();
    spyOn(contextService, 'getEntityType').and.callThrough();
    component.filename = 'img.svg';
    spyOn(
      imageUploadHelperService, 'getTrustedResourceUrlForThumbnailFilename'
    ).and.callThrough();
    component.ngOnInit();
    expect(component.editableThumbnailDataUrl).toEqual('topic/1/img.svg');
  });
});
