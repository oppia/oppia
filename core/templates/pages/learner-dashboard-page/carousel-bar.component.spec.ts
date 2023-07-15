// // Copyright 2023 The Oppia Authors. All Rights Reserved.
// //
// // Licensed under the Apache License, Version 2.0 (the "License");
// // you may not use this file except in compliance with the License.
// // You may obtain a copy of the License at
// //
// //      http://www.apache.org/licenses/LICENSE-2.0
// //
// // Unless required by applicable law or agreed to in writing, software
// // distributed under the License is distributed on an "AS-IS" BASIS,
// // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// // See the License for the specific language governing permissions and
// // limitations under the License.

// /**
//  * @fileoverview Unit tests for for CarouselBarComponent.
//  */

// import { ComponentFixture, TestBed, async } from '@angular/core/testing';
// import { AppConstants } from 'app.constants';
// import { MaterialModule } from 'modules/material.module';
// import { CarouselBarComponent } from './carousel-bar.component';
// import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
// import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
// import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
// import { FormsModule } from '@angular/forms';
// import { HttpClientTestingModule } from '@angular/common/http/testing';
// import { MockTranslatePipe } from 'tests/unit-test-utils';

// describe('CarouselBarComponent', () => {
//   let component: CarouselBarComponent;
//   let fixture: ComponentFixture<CarouselBarComponent>;
//   let windowDimensionsService: WindowDimensionsService;
//   let i18nLanguageCodeService: I18nLanguageCodeService;
//   let mockResizeEmitter: EventEmitter<void>;

//   beforeEach(async(() => {
//     mockResizeEmitter = new EventEmitter();
//     TestBed.configureTestingModule({
//       imports: [
//         MaterialModule,
//         FormsModule,
//         HttpClientTestingModule
//       ],
//       declarations: [
//         MockTranslatePipe,
//         CarouselBarComponent
//       ],
//       providers: [
//         {
//           provide: WindowDimensionsService,
//           useValue: {
//             isWindowNarrow: () => true,
//             getResizeEvent: () => mockResizeEmitter,
//           }
//         }
//       ],
//       schemas: [NO_ERRORS_SCHEMA]
//     }).compileComponents();
//   }));

//   beforeEach(() => {
//     fixture = TestBed.createComponent(CarouselBarComponent);
//     component = fixture.componentInstance;
//     windowDimensionsService = TestBed.inject(WindowDimensionsService);
//     i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

//     spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
//       true);
//     fixture.detectChanges();
//   });
//   afterEach(() => {
//     fixture.destroy();
//   });

//   it('should create the component', () => {
//     expect(component).toBeTruthy();
//   });

//   it('should subscribe to resize event and call initCarousel', () => {
//     spyOn(windowDimensionsService.getResizeEvent(), 'subscribe').and.
//       callThrough();
//     spyOn(component, 'initCarousel').and.returnValue(true);

//     mockResizeEmitter.emit();
//     component.ngOnInit();

//     expect(windowDimensionsService.getResizeEvent().subscribe).
//       toHaveBeenCalled();
//     expect(component.initCarousel).toHaveBeenCalled();
//     expect(component.isScrollable).toBe(true);
//   });

//   it('should initialize carousel on view init', () => {
//     spyOn(component, 'initCarousel').and.callThrough();
//     component.ngAfterViewInit();
//     expect(component.initCarousel).toHaveBeenCalled();
//     expect(component.isScrollable).toBe(true);
//   });
//   it('should scroll left when UntrackedTopics to scroll' +
//   'and carouselScrollPositionPx is 0', () => {
//     const scrollBySpy = spyOn(window.HTMLElement.prototype, 'scrollBy');
//     const carouselSelector = document.createElement('div');
//     spyOn(document, 'querySelector').and.returnValue(carouselSelector);

//     component.carouselClassname = '.carousel.tiles';
//     component.CarouselScrollWidthPx = 1000;
//     component.CarouselClientWidthPx = 500;
//     component.carouselScrollPositionPx = 0;
//     component.scrollUntrackedTopics = true;

//     component.scroll(true);

//     expect(scrollBySpy).toHaveBeenCalledWith({
//       top: 0,
//       left: -AppConstants.UNTRACKED_TILE_SWAP_WIDTH_PX,
//       behavior: 'smooth'
//     });
//     expect(component.carouselScrollPositionPx).
//       toBe(-AppConstants.UNTRACKED_TILE_SWAP_WIDTH_PX);
//     expect(component.disableLeftButton).toBe(true);
//     expect(component.disableRightButton).toBe(false);
//     expect(component.isScrollable).toBe(true);
//   });

//   it('should scroll left when UntrackedTopics to scroll' +
//   'and carouselScrollPositionPx is at the end', () => {
//     const scrollBySpy = spyOn(window.HTMLElement.prototype, 'scrollBy');
//     const carouselSelector = document.createElement('div');
//     spyOn(document, 'querySelector').and.returnValue(carouselSelector);

//     component.carouselClassname = '.carousel.tiles';
//     component.CarouselScrollWidthPx = 1000;
//     component.CarouselClientWidthPx = 500;
//     component.carouselScrollPositionPx = 800;
//     component.scrollUntrackedTopics = true;

//     component.scroll(true);

//     expect(scrollBySpy).toHaveBeenCalledWith({
//       top: 0,
//       left: -AppConstants.UNTRACKED_TILE_SWAP_WIDTH_PX,
//       behavior: 'smooth'
//     });
//     expect(component.carouselScrollPositionPx).
//       toBe(800 - AppConstants.UNTRACKED_TILE_SWAP_WIDTH_PX);
//     expect(component.disableLeftButton).toBe(false);
//     expect(component.disableRightButton).toBe(false);
//     expect(component.isScrollable).toBe(true);
//   });

//   it('should scroll left/right kya when not UntrackedTopics' +
//   'and carouselScrollPositionPx is 0', () => {
//     const carouselSelector = document.createElement('div');
//     spyOn(document, 'querySelector').and.returnValue(carouselSelector);

//     component.carouselClassname = '.carousel.tiles';
//     component.CarouselScrollWidthPx = 1000;
//     component.CarouselClientWidthPx = 500;
//     component.carouselScrollPositionPx = 0;
//     component.scrollUntrackedTopics = false;
//     component.disableLeftButton = true;
//     component.disableRightButton = false;
//     spyOn(carouselSelector, 'scrollBy');
//     component.scroll(false);

//     expect(carouselSelector.scrollBy).toHaveBeenCalledWith({
//       top: 0,
//       left: 230,
//       behavior: 'smooth'
//     });
//     expect(component.carouselScrollPositionPx).
//       toBe(230);
//     expect(component.disableLeftButton).toBe(false);
//     expect(component.disableRightButton).toBe(false);
//   });

//   it('should scroll left when not UntrackedTopics' +
//   'and carouselScrollPositionPx is at the end', () => {
//     const scrollBySpy = spyOn(window.HTMLElement.prototype, 'scrollBy');
//     const carouselSelector = document.createElement('div');
//     spyOn(document, 'querySelector').and.returnValue(carouselSelector);

//     component.carouselClassname = '.carousel.tiles';
//     component.CarouselScrollWidthPx = 1000;
//     component.CarouselClientWidthPx = 500;
//     component.carouselScrollPositionPx = 800;
//     component.scrollUntrackedTopics = false;

//     component.scroll(true);

//     expect(scrollBySpy).toHaveBeenCalledWith({
//       top: 0,
//       left: -AppConstants.LEARNER_DASHBOARD_TILE_WIDTH_PX,
//       behavior: 'smooth'
//     });
//     expect(component.carouselScrollPositionPx).
//       toBe(800 - AppConstants.LEARNER_DASHBOARD_TILE_WIDTH_PX);
//     expect(component.disableLeftButton).toBe(false);
//     expect(component.disableRightButton).toBe(false);
//     expect(component.isScrollable).toBe(true);
//   });

//   it('should scroll right when UntrackedTopics to scroll' +
//   'and carouselScrollPositionPx is not at the end', () => {
//     const scrollBySpy = spyOn(window.HTMLElement.prototype, 'scrollBy');
//     const carouselSelector = document.createElement('div');
//     spyOn(document, 'querySelector').and.returnValue(carouselSelector);

//     component.carouselClassname = '.carousel.tiles';
//     component.CarouselScrollWidthPx = 1000;
//     component.CarouselClientWidthPx = 500;
//     component.carouselScrollPositionPx = 100;
//     component.scrollUntrackedTopics = true;

//     component.scroll(false);

//     expect(scrollBySpy).toHaveBeenCalledWith({
//       top: 0,
//       left: AppConstants.UNTRACKED_TILE_SWAP_WIDTH_PX,
//       behavior: 'smooth'
//     });
//     expect(component.carouselScrollPositionPx).
//       toBe(100 + AppConstants.UNTRACKED_TILE_SWAP_WIDTH_PX);
//     expect(component.disableLeftButton).toBe(false);
//     expect(component.disableRightButton).toBe(false);
//     expect(component.isScrollable).toBe(true);
//   });

//   it('should scroll right when UntrackedTopics ' +
//   'and carouselScrollPositionPx is at the end', () => {
//     const scrollBySpy = spyOn(window.HTMLElement.prototype, 'scrollBy');
//     const carouselSelector = document.createElement('div');
//     spyOn(document, 'querySelector').and.returnValue(carouselSelector);

//     component.carouselClassname = '.carousel.tiles';
//     component.CarouselScrollWidthPx = 1000;
//     component.CarouselClientWidthPx = 500;
//     component.carouselScrollPositionPx = 800;
//     component.scrollUntrackedTopics = true;

//     component.scroll(false);

//     expect(scrollBySpy).toHaveBeenCalledWith({
//       top: 0,
//       left: AppConstants.UNTRACKED_TILE_SWAP_WIDTH_PX,
//       behavior: 'smooth'
//     });
//     expect(component.carouselScrollPositionPx).
//       toBe(800 + AppConstants.UNTRACKED_TILE_SWAP_WIDTH_PX);
//     expect(component.disableLeftButton).toBe(false);
//     expect(component.disableRightButton).toBe(true);
//     expect(component.isScrollable).toBe(true);
//   });

//   it('should scroll right when not UntrackedTopics' +
//   'and carouselScrollPositionPx is not at the end', () => {
//     const scrollBySpy = spyOn(window.HTMLElement.prototype, 'scrollBy');
//     const carouselSelector = document.createElement('div');
//     spyOn(document, 'querySelector').and.returnValue(carouselSelector);

//     component.carouselClassname = '.carousel.tiles';
//     component.CarouselScrollWidthPx = 1000;
//     component.CarouselClientWidthPx = 500;
//     component.carouselScrollPositionPx = 100;
//     component.scrollUntrackedTopics = false;

//     component.scroll(false);

//     expect(scrollBySpy).toHaveBeenCalledWith({
//       top: 0,
//       left: AppConstants.LEARNER_DASHBOARD_TILE_WIDTH_PX,
//       behavior: 'smooth'
//     });
//     expect(component.carouselScrollPositionPx).
//       toBe(100 + AppConstants.LEARNER_DASHBOARD_TILE_WIDTH_PX);
//     expect(component.disableLeftButton).toBe(false);
//     expect(component.disableRightButton).toBe(false);
//     expect(component.isScrollable).toBe(true);
//   });

//   it('should scroll right when not UntrackedTopics' +
//   'and carouselScrollPositionPx is at the end', () => {
//     const scrollBySpy = spyOn(window.HTMLElement.prototype, 'scrollBy');
//     const carouselSelector = document.createElement('div');
//     spyOn(document, 'querySelector').and.returnValue(carouselSelector);

//     component.carouselClassname = '.carousel.tiles';
//     component.CarouselScrollWidthPx = 1000;
//     component.CarouselClientWidthPx = 500;
//     component.carouselScrollPositionPx = 800;
//     component.scrollUntrackedTopics = false;

//     component.scroll(false);

//     expect(scrollBySpy).toHaveBeenCalledWith({
//       top: 0,
//       left: AppConstants.LEARNER_DASHBOARD_TILE_WIDTH_PX,
//       behavior: 'smooth'
//     });
//     expect(component.carouselScrollPositionPx).
//       toBe(800 + AppConstants.LEARNER_DASHBOARD_TILE_WIDTH_PX);
//     expect(component.disableLeftButton).toBe(false);
//     expect(component.disableRightButton).toBe(true);
//     expect(component.isScrollable).toBe(true);
//   });

//   it('should return false when carouselSelector is not found', () => {
//     spyOn(document, 'querySelector').and.returnValue(null);

//     const result = component.initCarousel();

//     expect(result).toBe(false);
//     expect(component.carouselScrollPositionPx).toBe(0);
//     expect(component.disableLeftButton).toBe(true);
//     expect(component.disableRightButton).toBe(false);
//   });

//   it('should check carouselScrollWidthPx is smaller than carouselClientWidthPx',
//     () => {
//       const carouselSelector = document.createElement('div');
//       spyOn(document, 'querySelector').and.returnValue(carouselSelector);

//       carouselSelector.scrollTo = jasmine.createSpy('scrollTo');
//       carouselSelector.scrollWidth;
//       carouselSelector.clientWidth;

//       const result = component.initCarousel();

//       expect(result).toBe(false);
//       expect(component.carouselScrollPositionPx).toBe(0);
//       expect(component.disableLeftButton).toBe(true);
//       expect(component.disableRightButton).toBe(false);
//       expect(carouselSelector.scrollTo).toHaveBeenCalledWith(0, 0);
//     });

//   it('should check carouselScrollWidthPx is greater than carouselClientWidthPx',
//     () => {
//       const carouselSelector = document.createElement('div');
//       spyOn(document, 'querySelector').and.returnValue(carouselSelector);

//       carouselSelector.scrollTo = jasmine.createSpy('scrollTo');
//       carouselSelector.scrollWidth;
//       carouselSelector.clientWidth;

//       const result = component.initCarousel();

//       expect(result).toBe(true);
//       expect(component.carouselScrollPositionPx).toBe(0);
//       expect(component.disableLeftButton).toBe(true);
//       expect(component.disableRightButton).toBe(false);
//       expect(carouselSelector.scrollTo).toHaveBeenCalledWith(0, 0);
//     });
// });
