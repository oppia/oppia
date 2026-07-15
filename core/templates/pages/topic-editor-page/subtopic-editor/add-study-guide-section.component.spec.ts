// Copyright 2025 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for AddStudyGuideSectionModalComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ChangeDetectorRef, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AddStudyGuideSectionModalComponent} from './add-study-guide-section.component';
import {HtmlLengthService} from 'services/html-length.service';
import {PlatformFeatureService} from 'services/platform-feature.service';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockHtmlLengthService {
  computeHtmlLength(html: string, calculationType: string): number {
    return html.length;
  }
}

class MockPlatformFeatureService {
  status = {
    EnableWorkedExamplesRteComponent: {
      isEnabled: false,
    },
  };
}

describe('Add Study Guide Section Modal Component', () => {
  let component: AddStudyGuideSectionModalComponent;
  let fixture: ComponentFixture<AddStudyGuideSectionModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let htmlLengthService: HtmlLengthService;
  let platformFeatureService: PlatformFeatureService;

  beforeEach(waitForAsync(() => {
    htmlLengthService = new MockHtmlLengthService();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [AddStudyGuideSectionModalComponent],
      providers: [
        ChangeDetectorRef,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        {
          provide: HtmlLengthService,
          useValue: htmlLengthService,
        },
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStudyGuideSectionModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    platformFeatureService = TestBed.inject(PlatformFeatureService);

    fixture.detectChanges();
  });

  it('should initialize properties after component is initialized', () => {
    expect(component.tempSectionHeadingPlaintext).toEqual('');
    expect(component.tempSectionContentHtml).toBe('');
  });

  it('should close modal when saving section', () => {
    spyOn(ngbActiveModal, 'close');
    component.updateLocalHeading('heading');
    component.updateLocalContent('content');

    component.saveSection();

    expect(ngbActiveModal.close).toHaveBeenCalledWith({
      sectionHeadingPlaintext: 'heading',
      sectionContentHtml: 'content',
    });
  });

  it('should get schema', () => {
    expect(component.getContentSchema()).toEqual(
      component.SECTION_FORM_CONTENT_SCHEMA
    );
    expect(component.getHeadingSchema()).toEqual(
      component.SECTION_FORM_HEADING_SCHEMA
    );
  });

  it('should get content schema when worked examples feature is disabled', () => {
    spyOn(
      component,
      'isEnableWorkedexamplesRteComponentFeatureEnabled'
    ).and.returnValue(false);

    const schema = component.getContentSchema();

    expect(schema).toEqual({
      type: 'html',
      ui_config: {
        rte_component_config_id: 'ALL_COMPONENTS',
        rows: 100,
      },
    });
  });

  it('should update tempSectionHeadingPlaintext', () => {
    component.tempSectionHeadingPlaintext = 'heading';

    let heading = 'new heading';
    component.updateLocalHeading(heading);

    expect(component.tempSectionHeadingPlaintext).toEqual(heading);
  });

  it('should not update tempSectionHeadingPlaintext when value is same', () => {
    component.tempSectionHeadingPlaintext = 'heading';
    component.updateLocalHeading('heading');
    expect(component.tempSectionHeadingPlaintext).toEqual('heading');
  });

  it('should update tempSectionContentHtml', () => {
    component.tempSectionContentHtml = 'con';

    let con = 'new con';
    component.updateLocalContent(con);

    expect(component.tempSectionContentHtml).toEqual(con);
  });

  it('should not update tempSectionContentHtml when value is same', () => {
    component.tempSectionContentHtml = 'content';
    component.updateLocalContent('content');
    expect(component.tempSectionContentHtml).toEqual('content');
  });

  it('should check worked examples feature flag', () => {
    platformFeatureService.status.EnableWorkedExamplesRteComponent.isEnabled =
      true;
    expect(component.isEnableWorkedexamplesRteComponentFeatureEnabled()).toBe(
      true
    );

    platformFeatureService.status.EnableWorkedExamplesRteComponent.isEnabled =
      false;
    expect(component.isEnableWorkedexamplesRteComponentFeatureEnabled()).toBe(
      false
    );
  });

  it('should check if section content length is exceeded', () => {
    component.tempSectionContentHtml = 'short content';
    let computeHtmlLengthSpy = spyOn(htmlLengthService, 'computeHtmlLength');
    computeHtmlLengthSpy.and.returnValue(500);
    let isExceeded = component.isSectionContentLengthExceeded();
    expect(isExceeded).toBe(false);

    computeHtmlLengthSpy.and.returnValue(6500);
    isExceeded = component.isSectionContentLengthExceeded();
    expect(isExceeded).toBe(true);
  });
});
