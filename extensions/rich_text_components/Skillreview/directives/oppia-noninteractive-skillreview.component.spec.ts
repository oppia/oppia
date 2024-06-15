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
 * @fileoverview Directive for the concept card rich-text component.
 */

import {
  async,
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from '@angular/core/testing';
import {CkEditorCopyContentService} from 'components/ck-editor-helpers/ck-editor-copy-content.service';
import {HtmlEscaperService} from 'services/html-escaper.service';
import {NoninteractiveSkillreview} from './oppia-noninteractive-skillreview.component';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ContextService} from 'services/context.service';
import {SimpleChanges} from '@angular/core';

describe('NoninteractiveSkillreview', () => {
  let component: NoninteractiveSkillreview;
  let fixture: ComponentFixture<NoninteractiveSkillreview>;
  let ckEditorCopyContentService: CkEditorCopyContentService;
  let ngbModal: NgbModal;
  let contextService: ContextService;

  class mockHtmlEscaperService {
    escapedJsonToObj(answer: string): string {
      return answer;
    }
  }

  class MockNgbModalRef {
    componentInstance = {
      skillId: null,
      explorationId: null,
    };
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NoninteractiveSkillreview],
      providers: [
        {
          provide: HtmlEscaperService,
          useClass: mockHtmlEscaperService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    contextService = TestBed.inject(ContextService);
    ngbModal = TestBed.inject(NgbModal);
    ckEditorCopyContentService = TestBed.inject(CkEditorCopyContentService);
    fixture = TestBed.createComponent(NoninteractiveSkillreview);
    component = fixture.componentInstance;

    component.skillIdWithValue = 'skillId';
    component.textWithValue = 'concept card';
  });

  it(
    'should initialise component when user inserts a concept card in the' +
      ' rich text editor',
    () => {
      component.ngOnInit();

      expect(component.skillId).toBe('skillId');
      expect(component.linkText).toBe('concept card');
    }
  );

  it("should not initialise when 'skillIdWithValue' is empty", () => {
    component.skillIdWithValue = '';

    component.ngOnInit();

    expect(component.skillId).toBeUndefined();
    expect(component.linkText).toBeUndefined();
  });

  it("should not initialise when 'textWithValue' is empty", () => {
    component.textWithValue = '';

    component.ngOnInit();

    expect(component.skillId).toBeUndefined();
    expect(component.linkText).toBeUndefined();
  });

  it('should open concept card when user clicks the link', () => {
    spyOn(contextService, 'removeCustomEntityContext');
    let e = {
      currentTarget: {
        offsetParent: {
          dataset: {
            ckeWidgetId: false,
          },
        },
      },
    } as unknown as MouseEvent;

    ckEditorCopyContentService.copyModeActive = false;
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockNgbModalRef,
        result: Promise.resolve(),
      } as NgbModalRef;
    });

    component.openConceptCard(e);

    expect(modalSpy).toHaveBeenCalled();
    expect(contextService.removeCustomEntityContext).not.toHaveBeenCalled();
  });

  it('should close concept card when user clicks the link', fakeAsync(() => {
    spyOn(contextService, 'setCustomEntityContext');
    spyOn(contextService, 'getEntityId').and.callFake(function () {
      return 'InitialEntityId';
    });
    spyOn(contextService, 'getEntityType').and.callFake(function () {
      return 'InitialEntityType';
    });
    spyOn(contextService, 'removeCustomEntityContext');
    let e = {
      currentTarget: {
        offsetParent: {
          dataset: {
            ckeWidgetId: false,
          },
        },
      },
    } as unknown as MouseEvent;

    ckEditorCopyContentService.copyModeActive = false;
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockNgbModalRef,
        result: Promise.reject('cancel'),
      } as NgbModalRef;
    });

    component.openConceptCard(e);
    tick();

    expect(modalSpy).toHaveBeenCalled();
    expect(contextService.removeCustomEntityContext).toHaveBeenCalled();
    expect(contextService.setCustomEntityContext).toHaveBeenCalledWith(
      'InitialEntityType',
      'InitialEntityId'
    );
  }));

  it(
    'should throw error when modal is closed in a method other than' +
      "'cancel', 'escape key press' or 'backdrop click'",
    fakeAsync(() => {
      let e = {
        currentTarget: {
          offsetParent: {
            dataset: {
              ckeWidgetId: false,
            },
          },
        },
      } as unknown as MouseEvent;

      ckEditorCopyContentService.copyModeActive = false;
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return {
          componentInstance: MockNgbModalRef,
          result: Promise.reject('close'),
        } as NgbModalRef;
      });

      let error;
      try {
        component.openConceptCard(e);
        flush();
        // We use unknown type because we are unsure of the type of error
        // that was thrown. Since the catch block cannot identify the
        // specific type of error, we are unable to further optimise the
        // code by introducing more types of errors.
      } catch (e: unknown) {
        error = e as Error;
        expect(error.message.indexOf('Error: close') !== -1).toBeTrue();
      }
      expect(error).not.toBeUndefined();
    })
  );

  it('should not open modal when ck Editor copy mode is active', fakeAsync(() => {
    // This throws "Type object is not assignable to type
    // 'MouseEvent'." We need to suppress this error
    // because of the need to test validations. This
    // throws an error only in the test environment.
    // @ts-ignore
    let e = {
      currentTarget: {
        offsetParent: {
          dataset: {
            ckeWidgetId: false,
          },
        },
      },
    } as MouseEvent;
    const modalSpy = spyOn(ngbModal, 'open');
    ckEditorCopyContentService.copyModeActive = true;

    component.openConceptCard(e);
    tick();

    expect(modalSpy).not.toHaveBeenCalled();
  }));

  it('should update view when user edits the concept card link', () => {
    let changes: SimpleChanges = {
      skillIdWithValue: {
        currentValue: 'new skillId',
        previousValue: 'skillId',
        firstChange: false,
        isFirstChange: () => false,
      },
    };
    component.skillIdWithValue = 'new skillId';

    component.ngOnChanges(changes);

    expect(component.skillId).toBe('new skillId');
  });

  it('should update view when user edits the concept card text', () => {
    let changes: SimpleChanges = {
      textWithValue: {
        currentValue: 'new text',
        previousValue: 'text',
        firstChange: false,
        isFirstChange: () => false,
      },
    };
    component.textWithValue = 'new text';

    component.ngOnChanges(changes);

    expect(component.linkText).toBe('new text');
  });
});
