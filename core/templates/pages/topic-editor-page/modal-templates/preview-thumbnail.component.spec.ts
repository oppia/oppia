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

import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { ContextService } from 'services/context.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';
import { PreviewThumbnailComponent } from './preview-thumbnail.component';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value): string {
    return value;
  }
}

describe('Preview Thumbnail Component', () => {
  let contextService: ContextService;
  let component: PreviewThumbnailComponent;
  let fixture: ComponentFixture<PreviewThumbnailComponent>;

  class MockImageUploadHelperService {
    getTrustedResourceUrlForThumbnailFilename(
        filename: string, entityType: string, entityId: string) {
      return (entityType + '/' + entityId + '/' + filename);
    }
  }
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PreviewThumbnailComponent, MockTranslatePipe],
      providers: [
        {
          provide: ImageUploadHelperService,
          useClass: MockImageUploadHelperService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    contextService = TestBed.inject(ContextService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewThumbnailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should init the component', fakeAsync(() => {
    component.filename = 'img.svg';
    spyOn(contextService, 'getEntityId').and.returnValue('1');
    spyOn(contextService, 'getEntityType').and.returnValue('topic');
    component.ngOnInit();
    expect(component.editableThumbnailDataUrl).toEqual('topic/1/img.svg');
  }));
});
