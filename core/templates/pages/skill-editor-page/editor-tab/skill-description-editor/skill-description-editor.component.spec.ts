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

import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { SkillUpdateService } from "domain/skill/skill-update.service";
import { SkillObjectFactory } from "domain/skill/SkillObjectFactory";
import { SkillEditorStateService } from "pages/skill-editor-page/services/skill-editor-state.service";
import { SkillDescriptionEditorComponent } from "./skill-description-editor.component";

/**
 * @fileoverview Unit tests for SkillDescriptionEditorComponent.
 */

fdescribe('Skill Description Editor Component', () => {
    let component: SkillDescriptionEditorComponent;
    let fixture: ComponentFixture<SkillDescriptionEditorComponent>;

    let skillUpdateService: SkillUpdateService;
    let skillEditorStateService: SkillEditorStateService;
    let skillObjectFactory: SkillObjectFactory;

    beforeEach(() => {
        TestBed.configureTestingModule({
          imports: [HttpClientTestingModule],
          declarations: [SkillDescriptionEditorComponent],
          providers: [
            SkillUpdateService,
            SkillEditorStateService,
            SkillEditorStateService
          ],
          schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
      });

      beforeEach(() => {
        fixture = TestBed.createComponent(SkillDescriptionEditorComponent);
        component = fixture.componentInstance;

        skillUpdateService = TestBed.inject(SkillUpdateService);
        skillEditorStateService = TestBed.inject(SkillEditorStateService);
        skillObjectFactory = TestBed.inject(SkillObjectFactory);
      });

      afterEach(() => {
        component.ngOnDestroy();
      });

      it('should init component', () => {
        expect(component).toBeDefined();
      });
});