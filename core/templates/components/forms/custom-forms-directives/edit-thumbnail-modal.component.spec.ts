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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { EditThumbnailModalComponent } from './edit-thumbnail-modal.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NO_ERRORS_SCHEMA, Pipe, SimpleChanges } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value: string): string {
    return value;
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

class MockImageObject {
  source = null;
  onload = null;
  constructor() {
    this.onload = () => {
      return 'Fake onload executed';
    };
  }
  set src(url) {
    this.onload();
  }
}

class MockReaderObject {
  result = null;
  onload = null;
  constructor() {
    this.onload = () => {
      return 'Fake onload executed';
    };
  }
  readAsDataURL(file) {
    this.onload();
    return 'The file is loaded';
  }
}

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Edit Thumbnail Modal Component', () => {
  let component: EditThumbnailModalComponent;
  let fixture: ComponentFixture<EditThumbnailModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let closeSpy: jasmine.Spy;
  let dismissSpy: jasmine.Spy;
  importAllAngularServices();

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        EditThumbnailModalComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditThumbnailModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
  });

  it('should load a image file in onchange event and save it if it\'s a' +
    ' svg file', fakeAsync(() => {
    // This is just a mocked base 64 in order to test the FileReader event
    // and its result property.
    const dataBase64Mock = 'PHN2ZyB4bWxucz0iaHR0cDo';
    const arrayBuffer = Uint8Array.from(
      window.atob(dataBase64Mock), c => c.charCodeAt(0));
    const file = new File([arrayBuffer], 'thumbnail.png', {
      type: 'image/svg+xml'
    });
    component.uploadedImageMimeType = file.type;
    component.invalidImageWarningIsShown = false;
    component.invalidTagsAndAttributes = {
      tags: [],
      attrs: []
    };
    // This throws "Argument of type 'mockReaderObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". This is because
    // 'HTMLImageElement' has around 250 more properties. We have only defined
    // the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'FileReader').and.returnValue(new MockReaderObject());
    const image = document.createElement('img');
    // This throws "Argument of type 'mockImageObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". This is because
    // 'HTMLImageElement' has around 250 more properties. We have only defined
    // the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'Image').and.returnValue(new MockImageObject());

    // SpyOn(document, 'querySelector').withArgs(
    //   '.oppia-thumbnail-uploader').and.callFake(() => {
    //   return document.createElement('div');
    // });

    // ---- Dispatch on load event ----
    image.dispatchEvent(new Event('load'));

    expect(component.invalidImageWarningIsShown).toBe(false);
    component.onInvalidImageLoaded();

    expect(component.invalidImageWarningIsShown).toBe(true);
    component.onFileChanged(file);

    // ---- Dispatch on load event ----
    expect(component.invalidTagsAndAttributes).toEqual({
      tags: [],
      attrs: []
    });
    expect(component.uploadedImage).toBe(null);
    expect(component.invalidImageWarningIsShown).toBe(false);
  }));

  it('should not load file if it is not a svg type', () => {
    expect(component.invalidImageWarningIsShown).toBe(false);

    // This is just a mocked base 64 in order to test the FileReader event
    // and its result property.
    const dataBase64Mock = 'PHN2ZyB4bWxucz0iaHR0cDo';
    const arrayBuffer = Uint8Array.from(
      window.atob(dataBase64Mock), c => c.charCodeAt(0));
    const file = new File([arrayBuffer], 'thumbnail.png');

    component.onFileChanged(file);

    expect(component.uploadedImage).toBeNull();
    expect(component.invalidImageWarningIsShown).toBeTrue();
  });

  it('should check for uploaded Image if there is a filechange', () => {
    component.uploadedImage = 'uploaded_image1.svg';
    const changes: SimpleChanges = {
      uploadedImage: {
        previousValue: 'uploaded_image1.svg',
        currentValue: 'uploaded_image1.svg',
        firstChange: false,
        isFirstChange: () => false
      }
    };
    component.ngOnChanges(changes);
    expect(component.openInUploadMode).toBeFalse();
  });

  it('should reset the uploaded image on clicking reset button', () => {
    component.reset();
    expect(component.uploadedImage).toBeNull();
    expect(component.openInUploadMode).toBeTrue();
  });

  it('should reset the uploaded Image and show a warning', () => {
    component.onInvalidImageLoaded();
    expect(component.uploadedImage).toBeNull();
    expect(component.invalidImageWarningIsShown).toBeTrue();
  });

  it('should close the modal when clicking on Add Thumbnail Button', () => {
    component.uploadedImage = 'uploaded_img.svg';
    component.tempBgColor = '#fff';
    component.openInUploadMode = false;
    component.dimensions = {
      height: 180,
      width: 180
    };
    component.confirm();
    expect(closeSpy).toHaveBeenCalledWith({
      newThumbnailDataUrl: 'uploaded_img.svg',
      newBgColor: '#fff',
      openInUploadMode: false,
      dimensions: {
        height: 180,
        width: 180
      }
    });
  });

  it('should close the modal on clicking cancel button', () => {
    component.cancel();
    expect(dismissSpy).toHaveBeenCalled();
  });
});
