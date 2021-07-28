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
 * @fileoverview Unit tests for Image with regions reset confirmation component.
 */

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BlogPostActionConfirmationModalComponent } from './blog-post-action-confirmation.component';
import { BlogDashboardPageService } from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';

class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

describe('Delete Misconception Modal Component', () => {
  let component: BlogPostActionConfirmationModalComponent;
  let blogDashboardPageService: BlogDashboardPageService;
  let fixture: ComponentFixture<
  BlogPostActionConfirmationModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [BlogPostActionConfirmationModalComponent],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(
      BlogPostActionConfirmationModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    blogDashboardPageService = TestBed.inject(BlogDashboardPageService);
  }));

  it('should close the modal when confirmed', () => {
    const closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    component.confirm(1);

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should close the modal when dismissed', () => {
    const dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    component.cancel(1);

    expect(dismissSpy).toHaveBeenCalled();
  });

  it('should initialize with correct action', () => {
    blogDashboardPageService.blogPostAction = 'delete';
    component.ngOnInit;

    expect(component.blogPostAction).toBe('delete');
  });

  it('should return correct boolean value if action is delete', () => {
    component.blogPostAction = 'delete';
    component.isActionDelete;

    expect(component.isActionDelete).toBe(true);

    component.blogPostAction = 'publish';
    component.isActionDelete;

    expect(component.isActionDelete).toBe(false);

    component.blogPostAction = 'unpublish';
    component.isActionDelete;

    expect(component.isActionDelete).toBe(true);
  });

  it('should return correct boolean value if action is publish', () => {
    component.blogPostAction = 'publish';
    component.isActionPublish;

    expect(component.isActionPublish).toBe(true);

    component.blogPostAction = 'delete';
    component.isActionPublish;

    expect(component.isActionPublish).toBe(false);

    component.blogPostAction = 'unpublish';
    component.isActionPublish;

    expect(component.isActionPublish).toBe(true);
  });

  it('should return correct boolean value if action is unpublish', () => {
    component.blogPostAction = 'unpublish';
    component.isActionUnpublish;

    expect(component.isActionUnpublish).toBe(true);

    component.blogPostAction = 'delete';
    component.isActionUnpublish;

    expect(component.isActionUnpublish).toBe(false);

    component.blogPostAction = 'unpublish';
    component.isActionUnpublish;

    expect(component.isActionUnpublish).toBe(true);
  });
});
