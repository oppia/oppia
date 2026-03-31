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
 * @fileoverview Unit tests for upload blog post tumbnail modal.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal, NgbModalModule} from '@ng-bootstrap/ng-bootstrap';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {UploadBlogPostThumbnailModalComponent} from './upload-blog-post-thumbnail-modal.component';
import {UploadBlogPostThumbnailComponent} from './upload-blog-post-thumbnail.component';

describe('Upload Blog Post Thumbnail Modal Component', () => {
  let fixture: ComponentFixture<UploadBlogPostThumbnailModalComponent>;
  let component: UploadBlogPostThumbnailModalComponent;
  let ngbActiveModal: NgbActiveModal;
  let confirmSpy: jasmine.Spy;
  let dismissSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModalModule],
      declarations: [
        MockTranslatePipe,
        UploadBlogPostThumbnailComponent,
        UploadBlogPostThumbnailModalComponent,
      ],
      providers: [NgbActiveModal],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadBlogPostThumbnailModalComponent);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    component = fixture.componentInstance;
    dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    confirmSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
  });

  it('should dismiss the modal on calling cancel function', () => {
    component.cancel();

    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should close the modal on calling save function', () => {
    component.save('sample-url');

    expect(confirmSpy).toHaveBeenCalledWith('sample-url');
  });
});
