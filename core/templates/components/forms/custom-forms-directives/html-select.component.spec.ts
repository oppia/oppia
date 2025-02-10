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
 * @fileoverview Unit tests for HTML Select Component.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HtmlSelectComponent} from './html-select.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('HTML Select Component', () => {
  let fixture: ComponentFixture<HtmlSelectComponent>;
  let component: HtmlSelectComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HtmlSelectComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HtmlSelectComponent);
    component = fixture.componentInstance;

    component.options = [
      {id: '12', val: 'string'},
      {id: '21', val: 'string'},
    ];
  });

  it('should initialize Selection with selectionId', () => {
    component.selectionId = '21';
    component.ngOnInit();
    expect(component.selection).toEqual({id: '21', val: 'string'});
  });

  it(
    'should initialize Selection with the first option when selectionId' +
      ' not in options',
    () => {
      component.selectionId = '13';
      component.ngOnInit();
      expect(component.selection).toEqual({id: '12', val: 'string'});
    }
  );

  it('should update Selection', () => {
    component.ngOnInit();
    component.selection = {id: '1', val: 'string'};
    spyOn(component.onSelectionChange, 'emit');

    component.updatedSelection();

    expect(component.onSelectionChange.emit).toHaveBeenCalledWith('1');
  });
});
