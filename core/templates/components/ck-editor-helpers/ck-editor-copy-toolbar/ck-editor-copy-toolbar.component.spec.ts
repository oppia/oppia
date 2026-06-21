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
 * @fileoverview Unit tests for the CkEditor copy toolbar component.
 */

import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {
  CkEditorCopyToolbarComponent,
  // eslint-disable-next-line max-len
} from 'components/ck-editor-helpers/ck-editor-copy-toolbar/ck-editor-copy-toolbar.component';
import {CkEditorCopyContentService} from 'components/ck-editor-helpers/ck-editor-copy-content.service';

describe('CkEditor copy toolbar', () => {
  let component: CkEditorCopyToolbarComponent;
  let fixture: ComponentFixture<CkEditorCopyToolbarComponent>;
  let ckCopyService: CkEditorCopyContentService;
  let dummyRichTextEditor: HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CkEditorCopyToolbarComponent],
      providers: [
        {
          provide: CkEditorCopyContentService,
          useClass: MockCkEditorCopyContentService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CkEditorCopyToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    ckCopyService = fixture.debugElement.injector.get(
      CkEditorCopyContentService
    );
  });

  beforeEach(() => {
    dummyRichTextEditor = document.createElement('div');
    dummyRichTextEditor.className = 'oppia-rte-editor';
    document.body.append(dummyRichTextEditor);
  });

  it('should toggle copy mode correctly', () => {
    const toggleCopyModeSpy = spyOn(
      ckCopyService,
      'toggleCopyMode'
    ).and.callThrough();

    expect(ckCopyService.copyModeActive).toBe(false);

    component.toggleToolActive();
    fixture.detectChanges();

    expect(ckCopyService.copyModeActive).toBe(true);
    expect(toggleCopyModeSpy).toHaveBeenCalled();
    expect(document.body.style.cursor).toBe('copy');
  });

  it('should set focus and unfocus the rich text editor', () => {
    const focusSpy = spyOn(dummyRichTextEditor, 'focus');
    component.toggleToolActive();
    fixture.detectChanges();
    expect(focusSpy).toHaveBeenCalled();

    const blurSpy = spyOn(dummyRichTextEditor, 'blur');
    component.toggleToolActive();
    fixture.detectChanges();
    expect(blurSpy).toHaveBeenCalled();
  });

  it('should revert cursor to normal when modal is closed', () => {
    component.toggleToolActive();
    fixture.detectChanges();

    expect(document.body.style.cursor).toBe('copy');

    component.ngOnDestroy();
    fixture.detectChanges();

    expect(document.body.style.cursor).toBe('');
  });

  afterEach(() => {
    document.body.removeChild(dummyRichTextEditor);
  });
});

class MockCkEditorCopyContentService {
  copyModeActive = false;

  toggleCopyMode() {
    this.copyModeActive = !this.copyModeActive;
  }
}
