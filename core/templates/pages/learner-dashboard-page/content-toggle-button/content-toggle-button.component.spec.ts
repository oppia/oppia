// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for content toggle button
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {TranslateService} from '@ngx-translate/core';
import {ContentToggleButtonComponent} from './content-toggle-button.component';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {By} from '@angular/platform-browser';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string): string {
    return key;
  }
}

describe('ContentToggleButtonComponent', () => {
  let component: ContentToggleButtonComponent;
  let fixture: ComponentFixture<ContentToggleButtonComponent>;
  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      declarations: [ContentToggleButtonComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContentToggleButtonComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);

    component.isExpanded = false;
  });

  it('should translate display more when component is initialized', () => {
    spyOn(translateService, 'instant').and.callThrough();

    component.ngOnInit();

    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_LEARNER_DASHBOARD_CONTENT_TOGGLE_BUTTON_MORE'
    );
  });

  it('should invert isExpanded to true and emit true when toggle is called', () => {
    fixture.detectChanges();
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(component.contentToggleEmitter, 'emit');
    component.toggle();

    fixture.detectChanges();

    expect(component.isExpanded).toBeTrue();
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_LEARNER_DASHBOARD_CONTENT_TOGGLE_BUTTON_LESS'
    );
    expect(component.contentToggleEmitter.emit).toHaveBeenCalledWith(true);
  });

  it('should invert isExpanded to false and emit false when toggle is called', () => {
    component.isExpanded = true;
    fixture.detectChanges();
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(component.contentToggleEmitter, 'emit');
    component.toggle();

    fixture.detectChanges();

    expect(component.isExpanded).toBeFalse();
    expect(translateService.instant).toHaveBeenCalledWith(
      'I18N_LEARNER_DASHBOARD_CONTENT_TOGGLE_BUTTON_MORE'
    );
    expect(component.contentToggleEmitter.emit).toHaveBeenCalledWith(false);
  });

  it('should emit isExpanded when content-toggle-button is clicked', () => {
    fixture.detectChanges();
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(component.contentToggleEmitter, 'emit');

    const button = fixture.debugElement.query(By.css('.content-toggle-button'));
    button.triggerEventHandler('click', null);

    expect(component.isExpanded).toBeTrue();
    expect(component.contentToggleEmitter.emit).toHaveBeenCalledWith(true);
  });
});
