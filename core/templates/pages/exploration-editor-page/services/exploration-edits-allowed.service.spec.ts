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
 * @fileoverview Unit tests for ExplorationEditsAllowedService.
 */

 import { TestBed } from '@angular/core/testing';
 import { ExplorationEditsAllowedService } from './exploration-edits-allowed.service';
 import { ExplorationPropertyService } from './exploration-property.service';
 import { HttpClientTestingModule, HttpTestingController } from
   '@angular/common/http/testing';
 import { ExplorationDataService } from './exploration-data.service';
 
 describe('Exploration Edits Allowed Service', () => {
   let eeas: ExplorationEditsAllowedService;
   let httpTestingController: HttpTestingController;
 
   beforeEach(() => {
     TestBed.configureTestingModule({
       imports: [HttpClientTestingModule],
       providers: [
         ExplorationPropertyService,
         {
           provide: ExplorationDataService,
           useValue: {
             explorationId: 0,
             autosaveChangeListAsync() {
               return;
             }
           }
         }
       ]
     });
     httpTestingController = TestBed.inject(HttpTestingController);
     eeas = TestBed.inject(ExplorationEditsAllowedService);
   });
 
   afterEach(() => {
     httpTestingController.verify();
   });
 
   it('should toggle edits allowed property', () => {
     // Function isEnabled() returns undefined in the first time.
     expect(eeas.isEnabled()).toBeFalsy();
 
     eeas.setEditsAllowed(true);
     expect(eeas.isEnabled()).toBeTrue();
 
     eeas.setEditsAllowed(false);
     expect(eeas.isEnabled()).toBeFalse();
   });
 });
 