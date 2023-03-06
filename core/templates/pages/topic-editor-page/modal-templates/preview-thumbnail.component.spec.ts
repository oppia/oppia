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
 * @fileoverview Unit tests for the preview thumbnail component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ThumbnailDisplayComponent } from 'components/forms/custom-forms-directives/thumbnail-display.component';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { PreviewThumbnailComponent } from './preview-thumbnail.component';
import { ContextService } from 'services/context.service';

describe('Preview Thumbnail Component', function() {
  let componentInstance: PreviewThumbnailComponent;
  let fixture: ComponentFixture<PreviewThumbnailComponent>;
  let imageUploadHelperService: ImageUploadHelperService;
  let testUrl = 'test_url';
  let contextService: ContextService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        PreviewThumbnailComponent,
        ThumbnailDisplayComponent
      ],
      providers: [
        ImageUploadHelperService,
        ContextService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewThumbnailComponent);
    componentInstance = fixture.componentInstance;
    imageUploadHelperService = (
       TestBed.inject(ImageUploadHelperService)) as
         jasmine.SpyObj<ImageUploadHelperService>;
    contextService = TestBed.inject(ContextService);
    spyOn(
      imageUploadHelperService, 'getTrustedResourceUrlForThumbnailFilename')
      .and.returnValue(testUrl);
  });

  it('should create', () => {
    spyOn(contextService, 'getEntityType').and.returnValue('topic');
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    spyOn(contextService, 'getEntityType').and.returnValue('topic');
    componentInstance.ngOnInit();
    expect(componentInstance.editableThumbnailDataUrl).toEqual(testUrl);
  });

  it('should throw error if no image is present for a preview', () => {
    spyOn(contextService, 'getEntityType').and.returnValue(undefined);
    expect(() => {
      componentInstance.ngOnInit();
    }).toThrowError('No image present for preview');
  });
});
