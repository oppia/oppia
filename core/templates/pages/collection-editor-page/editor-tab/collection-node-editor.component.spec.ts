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
 * @fileoverview Unit tests for for Collection node editor component.
 */

import { async, ComponentFixture, fakeAsync, TestBed, tick } from
  '@angular/core/testing';
import { CollectionNodeEditorComponent } from './collection-node-editor.component';
import { CollectionLinearizerService } from '../services/collection-linearizer.service';
import { AlertsService } from 'services/alerts.service';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';

describe('Collection node editor component ', () => {
  let component: CollectionNodeEditorComponent;
  let fixture: ComponentFixture<CollectionNodeEditorComponent>;
  let collectionLinearizerService: CollectionLinearizerService;
  let alertsService: AlertsService;
  let collectionEditorStateService: CollectionEditorStateService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CollectionNodeEditorComponent],
      providers: []
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionNodeEditorComponent);
    component = fixture.componentInstance;
    collectionLinearizerService = TestBed.inject(CollectionLinearizerService);
    alertsService = TestBed.inject(AlertsService);
    collectionEditorStateService = TestBed.inject(CollectionEditorStateService);
    fixture.detectChanges();
  });

  it('should intialize the component and set values', fakeAsync(() => {

    component.ngOnInit();
  }));
});