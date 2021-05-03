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
 * @fileoverview Unit tests for Edit Thumbnail Modal Component.
 */

import { ComponentFixture, flushMicrotasks, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { EditThumbnailModalComponent } from './edit-thumbnail-modal.component';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Edit Thumbnail Modal Component', () => {
  let svgSanitizerService: SvgSanitizerService;
  let ngbActiveModal: NgbActiveModal;
  let component: EditThumbnailModalComponent;
  let fixture: ComponentFixture<EditThumbnailModalComponent>;
  let allowedBgColors: string[];
  let aspectRatio: string = '';
  let dimensions;
  let previewDescription;
  let previewDescriptionBgColor;
  let previewFooter;
  let previewTitle;
  let openInUploadMode = true;
  let tempBgColor: string = '';
  let uploadedImage: File = new File([], 'uploaded.png');
  let uploadedImageMimeType: string = 'image/svg+xml';
  class MockSvgSanitizerService {
    getInvalidSvgTagsAndAttrsFromDataUri(str: string): Object {
      return str;
    }
  }

  class MockActiveModal {
    dismiss(): void {
      return;
    }

    close(): void {
      return;
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditThumbnailModalComponent, MockTranslatePipe],
      providers: [
        {
          provide: SvgSanitizerService,
          useClass: MockSvgSanitizerService
        },
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditThumbnailModalComponent);
    component = fixture.componentInstance;
    svgSanitizerService = TestBed.inject(SvgSanitizerService);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    fixture.detectChanges();
  });

  // It('should set background color when modal is rendered', () => {
  //   spyOn(component, 'updateBackgroundColor').and.callThrough();
  //   expect(component.updateBackgroundColor).toHaveBeenCalled();
  // });

  // it('should initialize component properties after component is initialized',
  //   () => {
  //     expect(component.uploadedImage).toBeUndefined();
  //     expect(component.invalidImageWarningIsShown).toBe(false);
  //     expect(component.allowedBgColors).toBe(allowedBgColors);
  //     expect(component.aspectRatio).toBe(aspectRatio);
  //     expect(component.previewDescription).toEqual(previewDescription);
  //     expect(component.previewDescriptionBgColor).toEqual(
  //       previewDescriptionBgColor);
  //     expect(component.previewFooter).toEqual(
  //       previewFooter);
  //     expect(component.previewTitle).toEqual(previewTitle);
  //   });

  it(
    'should load a image file in onchange event and save it if it\'s a' +
    ' svg file', (done) => {
    // This spy is to be sure that an image element will be returned from
    // document.querySelector method.
      // let Img = document.createElement('img');
      // spyOn(document, 'querySelector').and.returnValue(img);

      // This is just a mocked base 64 in order to test the FileReader event
      // and its result property.

      let dataBase64Mock = 'PHN2ZyB4bWxucz0iaHR0cDo';
      var len = dataBase64Mock.length;
      var arrayBuffer = new Uint8Array(len);
      for (var i = 1; i < len - 1; i++) {
        arrayBuffer[i] = dataBase64Mock.charCodeAt(i);
      }
      // var arrayBuffer = [80, 72, 78, 50, 90, 121, 66, 52,
      // 98, 87, 120, 117, 99, 122, 48, 105, 97, 72, 82, 48, 99, 68, 111]
      // arrayBuffer = Uint8Array.from(
      //   window.atob(dataBase64Mock), c => c.charCodeAt(0));
      let file = new File([arrayBuffer.buffer], 'thumbnail.png', {
        type: 'image/svg+xml'
      });

      // Mocking JQuery element method.
      let element = document.createElement('div');
      element.className = 'oppia-thumbnail-uploader';
      document.body.append(element);

      // Spy Image letructor to handle its events.
      let image = document.createElement('img');
      spyOn(window, 'Image').and.returnValue(image);

      expect(component.invalidImageWarningIsShown).toBe(false);
      component.onInvalidImageLoaded();

      expect(component.invalidImageWarningIsShown).toBe(true);
      component.onFileChanged(file);

      // // The setTimeout is being used here to not conflict with $timeout.flush
      // // for fadeIn Jquery method. This first setTimeout is to wait the default
      // // time for fadeOut Jquery method to complete, which is 400 miliseconds.
      // // 1000ms is being used instead of 400ms just to be sure that fadeOut
      // // callback is already executed.
      // // Ref: https://api.jquery.com/fadeout/
      // setTimeout(() => {
      //   flushMicrotasks();
      //   tick(150);
      //   done();
        // ---- Dispatch on load event ----
        image.dispatchEvent(new Event('load'));

        expect(component.invalidTagsAndAttributes).toEqual({
          tags: ['html', 'body', 'parsererror', 'h3', 'div', 'h3'],
          attrs: []
        });
        expect(component.uploadedImage).toBe(null);
        expect(component.invalidImageWarningIsShown).toBe(false);

        // ---- Save information ----
        component.confirm();
        expect(ngbActiveModal.close).toHaveBeenCalled();
      }, 1000);
    });

  // It('should perform fadeIn and fadeOut operations correctly' +
  //   'after uploading thumbnail image', () => {
  //   // This is just a mocked base 64 in order to test the FileReader event
  //   // and its result property.
  //   let dataBase64Mock = 'PHN2ZyB4bWxucz0iaHR0cDo';
  //   let arrayBuffer = Uint8Array.from(
  //     window.atob(dataBase64Mock), c => c.charCodeAt(0));
  //   let file = new File([arrayBuffer], 'thumbnail.png', {
  //     type: 'image/svg+xml'
  //   });

  //   // Mocking JQuery element method.
  //   let element = $(document.createElement('div'));
  //   spyOn(window, '$').withArgs('.oppia-thumbnail-uploader').and.returnValue(
  //     element);
  //   let fadeInElementSpy = spyOn(element, 'fadeIn').and.callThrough();

  //   component.onFileChanged(file);

  //   waitForAsync(() => {
  //     expect(fadeInElementSpy).toHaveBeenCalled();
  //   });
  // });

  // it('should not load file if it is not a svg type', () => {
  //   expect(component.invalidImageWarningIsShown).toBeFalse();

  //   // This is just a mocked base 64 in order to test the FileReader event
  //   // and its result property.
  //   let dataBase64Mock = 'PHN2ZyB4bWxucz0iaHR0cDo';
  //   let arrayBuffer = Uint8Array.from(
  //     window.atob(dataBase64Mock), c => c.charCodeAt(0));
  //   let file = new File([arrayBuffer], 'thumbnail.png');

  //   component.onFileChanged(file);

  //   expect(component.uploadedImage).toBeNull();
  //   expect(component.invalidImageWarningIsShown).toBeTrue();
  // });
});

