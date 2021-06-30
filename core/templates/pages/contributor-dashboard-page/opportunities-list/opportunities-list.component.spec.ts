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
 * @fileoverview Unit tests for the Opportunities List Component.
 */

import { HttpClientTestingModule } from "@angular/common/http/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslationLanguageService } from "pages/exploration-editor-page/translation-tab/services/translation-language.service";
import { ContributionOpportunitiesService } from "../services/contribution-opportunities.service";
import { OpportunitiesListComponent } from "./opportunities-list.component";

describe('Story editor navbar component', () => {
    let component: OpportunitiesListComponent;
    let fixture: ComponentFixture<OpportunitiesListComponent>;


  
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        declarations: [OpportunitiesListComponent],
        providers: [
            ContributionOpportunitiesService,
            TranslationLanguageService
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();
    });

    beforeEach(() => {

    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should init component', () => {
        expect(component).toBeDefined();
    });
});