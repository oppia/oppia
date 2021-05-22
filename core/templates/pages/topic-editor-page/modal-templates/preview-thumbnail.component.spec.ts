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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ContextService } from 'services/context.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { PreviewThumbnailComponent } from './preview-thumbnail.component';

describe('Preview Thumbnail Component', function() {
  let componentInstance: PreviewThumbnailComponent;
  let fixture: ComponentFixture<PreviewThumbnailComponent>;
  let imageUploadHelperService: ImageUploadHelperService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PreviewThumbnailComponent],
      providers: [
        ImageUploadHelperService,
        ContextService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewThumbnailComponent);
    componentInstance = fixture.componentInstance;
    fixture.detectChanges();
    imageUploadHelperService = (TestBed.inject(ImageUploadHelperService) as
    unknown) as jasmine.SpyObj<ImageUploadHelperService>;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    let testUrl = 'test_url';
    spyOn(
      imageUploadHelperService, 'getTrustedResourceUrlForThumbnailFilename')
      .and.returnValue(testUrl);
    componentInstance.ngOnInit();
    expect(componentInstance.editableThumbnailDataUrl).toEqual(testUrl);
  });
});
