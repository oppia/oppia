// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for blog author details component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal, NgbModalModule} from '@ng-bootstrap/ng-bootstrap';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {BlogAuthorDetailsEditorComponent} from './author-detail-editor-modal.component';

describe('Upload Blog Post Thumbnail Modal Component', () => {
  let fixture: ComponentFixture<BlogAuthorDetailsEditorComponent>;
  let component: BlogAuthorDetailsEditorComponent;
  let ngbActiveModal: NgbActiveModal;
  let confirmSpy: jasmine.Spy;
  let dismissSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModalModule],
      declarations: [MockTranslatePipe, BlogAuthorDetailsEditorComponent],
      providers: [NgbActiveModal],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogAuthorDetailsEditorComponent);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    component = fixture.componentInstance;
    dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    confirmSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
  });

  it('should dismiss the modal on calling cancel function', () => {
    component.prevAuthorBio = 'author Bio';
    component.cancel();

    expect(dismissSpy).toHaveBeenCalled();
  });

  it(
    'should not dismiss the modal on calling cancel function if author bio' +
      'is empty',
    () => {
      component.prevAuthorBio = '';
      component.cancel();

      expect(dismissSpy).not.toHaveBeenCalled();
    }
  );

  it(
    'should close the modal on calling save function with valid author' +
      'details',
    () => {
      component.authorName = 'test username';
      component.authorBio = 'general bio';
      let expectedAuthorDetails = {
        authorName: 'test username',
        authorBio: 'general bio',
      };
      component.save();

      expect(confirmSpy).toHaveBeenCalledWith(expectedAuthorDetails);
    }
  );

  it(
    'should not close the modal on calling save function with invalid author' +
      'details',
    () => {
      component.authorName = '';
      component.authorBio = '';

      component.save();

      expect(confirmSpy).not.toHaveBeenCalledWith();
    }
  );

  it('should validate author details', () => {
    component.authorName = 'test username';
    component.authorBio = 'general bio';
    expect(component.validateAuthorDetails().length).toBe(0);

    component.authorName = '';
    component.authorBio = 'general bio';
    expect(component.validateAuthorDetails().length).toBe(1);
    expect(component.validateAuthorDetails()).toEqual([
      'Author Name should not be empty.',
    ]);

    component.authorName = 'test_username';
    component.authorBio = 'general bio';
    expect(component.validateAuthorDetails().length).toBe(1);
    expect(component.validateAuthorDetails()).toEqual([
      'Author Name can only have alphanumeric characters and spaces.',
    ]);

    component.authorName = '';
    component.authorBio = '';
    expect(component.validateAuthorDetails().length).toBe(2);
    expect(component.validateAuthorDetails()).toEqual([
      'Author Name should not be empty.',
      'Author Bio should not be empty.',
    ]);

    component.authorName = 'A';
    component.authorBio = 'general bio';
    expect(component.validateAuthorDetails().length).toBe(1);
    expect(component.validateAuthorDetails()).toEqual([
      'Author Name should not be less than 2 characters.',
    ]);

    component.authorName = 'test username';
    component.authorBio = 'A';
    expect(component.validateAuthorDetails().length).toBe(1);
    expect(component.validateAuthorDetails()).toEqual([
      'Author Bio should not be less than 5 characters.',
    ]);

    component.authorName =
      'Author name exceeding character limit of 35' +
      ' characters should raise error.';
    component.authorBio = 'Author bio exceeding char limit of 35'.repeat(550);
    expect(component.validateAuthorDetails().length).toBe(2);
    expect(component.validateAuthorDetails()).toEqual([
      'Author Name should not be more than 35 characters.',
      'Author Bio should not be more than 250 characters.',
    ]);
  });
});
