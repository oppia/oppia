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
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { EditThumbnailModalComponent } from './edit-thumbnail-modal.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { SvgSanitizerService } from 'services/svg-sanitizer.service';

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

describe('Edit Thumbnail Modal Component', () => {
  let component: EditThumbnailModalComponent;
  let fixture: ComponentFixture<EditThumbnailModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let svgSanitizerService: SvgSanitizerService;
  let closeSpy: jasmine.Spy;
  let dismissSpy: jasmine.Spy;

  class MockReaderObject {
    result = null;
    onload: () => string;
    constructor() {
      this.onload = () => {
        return 'Fake onload executed';
      };
    }

    readAsDataURL(file: File) {
      this.onload();
      return 'The file is loaded';
    }
  }

  class MockImageObject {
    source = null;
    onload: () => string;
    constructor() {
      this.onload = () => {
        return 'Fake onload executed';
      };
    }

    set src(url: string) {
      this.onload();
    }
  }

  const fileContent = (
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjA' +
    'wMC9zdmciICB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PGNpcmNsZSBjeD0iNTAiIGN5' +
    'PSI1MCIgcj0iNDAiIHN0cm9rZT0iZ3JlZW4iIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ie' +
    'WVsbG93IiAvPjwvc3ZnPg==');

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        EditThumbnailModalComponent,
        MockTranslatePipe
      ],
      providers: [
        SvgSanitizerService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(EditThumbnailModalComponent);
    component = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    svgSanitizerService = TestBed.inject(SvgSanitizerService);
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();
    dismissSpy = spyOn(ngbActiveModal, 'dismiss').and.callThrough();
    // This throws "Argument of type 'mockImageObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". We need to suppress this
    // error because 'HTMLImageElement' has around 250 more properties.
    // We have only defined the properties we need in 'mockImageObject'.
    // @ts-expect-error
    spyOn(window, 'Image').and.returnValue(new MockImageObject());
    // This throws "Argument of type 'mockReaderObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". We need to suppress this
    // error because 'HTMLImageElement' has around 250 more properties.
    // We have only defined the properties we need in 'mockReaderObject'.
    // @ts-expect-error
    spyOn(window, 'FileReader').and.returnValue(new MockReaderObject());
    spyOn(component, 'updateBackgroundColor').and.callThrough();
    spyOn(component, 'setImageDimensions').and.callThrough();
  }));

  it('should load a image file in onchange event and save it if it\'s a' +
    ' svg file', () => {
    spyOn(component, 'isUploadedImageSvg').and.returnValue(true);
    spyOn(component, 'isValidFilename').and.returnValue(true);
    spyOn(svgSanitizerService, 'getInvalidSvgTagsAndAttrsFromDataUri')
      .and.returnValue({ tags: [], attrs: [] });
    spyOn(svgSanitizerService, 'removeAllInvalidTagsAndAttributes')
      .and.returnValue(fileContent);
    let file = new File([fileContent], 'circle.svg', {type: 'image/svg'});
    component.invalidImageWarningIsShown = false;
    component.invalidFilenameWarningIsShown = false;
    component.uploadedImageMimeType = 'image/svg+xml';
    component.imgSrc = 'source';

    component.onFileChanged(file);
    expect(component.invalidImageWarningIsShown).toBe(false);
    expect(component.invalidFilenameWarningIsShown).toBe(false);
  });

  it('should not load file if it is not a svg type', () => {
    spyOn(component, 'isUploadedImageSvg').and.returnValue(false);
    spyOn(component, 'isValidFilename').and.returnValue(false);
    expect(component.invalidImageWarningIsShown).toBe(false);
    expect(component.invalidFilenameWarningIsShown).toBe(false);
    // This is just a mocked base 64 in order to test the FileReader event
    // and its result property.
    const dataBase64Mock = 'PHN2ZyB4bWxucz0iaHR0cDo';
    const arrayBuffer = Uint8Array.from(
      window.atob(dataBase64Mock), c => c.charCodeAt(0));
    const file = new File([arrayBuffer], 'thumbnail.png');

    component.onFileChanged(file);

    expect(component.uploadedImage).toBeNull();
    expect(component.invalidFilenameWarningIsShown).toBeFalse();
    expect(component.invalidImageWarningIsShown).toBeTrue();
  });

  it('should not load file if it does not have a proper filename', () => {
    spyOn(component, 'isUploadedImageSvg').and.returnValue(true);
    spyOn(component, 'isValidFilename').and.returnValue(false);
    expect(component.invalidImageWarningIsShown).toBe(false);
    expect(component.invalidFilenameWarningIsShown).toBe(false);
    // This is just a mocked base 64 in order to test the FileReader event
    // and its result property.
    const dataBase64Mock = 'PHN2ZyB4bWxucz0iaHR0cDo';
    const arrayBuffer = Uint8Array.from(
      window.atob(dataBase64Mock), c => c.charCodeAt(0));
    var file = new File([arrayBuffer], 'thumb..nail.svg');
    component.onFileChanged(file);
    expect(component.uploadedImage).toBeNull();
    expect(component.invalidFilenameWarningIsShown).toBeTrue();
    expect(component.invalidImageWarningIsShown).toBeFalse();

    file = new File([arrayBuffer], 'thumb/nail.svg');
    component.onFileChanged(file);
    expect(component.uploadedImage).toBeNull();
    expect(component.invalidFilenameWarningIsShown).toBeTrue();
    expect(component.invalidImageWarningIsShown).toBeFalse();

    file = new File([arrayBuffer], '.thumbnail.svg');
    component.onFileChanged(file);
    expect(component.uploadedImage).toBeNull();
    expect(component.invalidFilenameWarningIsShown).toBeTrue();
    expect(component.invalidImageWarningIsShown).toBeFalse();
  });

  it('should update bgColor on changing background color', () => {
    component.bgColor = '#FFFFFF';
    component.thumbnailHasChanged = false;

    component.updateBackgroundColor('#B3D8F1');

    expect(component.bgColor).toBe('#B3D8F1');
    expect(component.thumbnailHasChanged).toBeTrue();
  });

  it('should check for uploaded image to be svg', () => {
    component.uploadedImageMimeType = 'image/svg+xml';
    let result = component.isUploadedImageSvg();
    expect(result).toBeTrue();
  });

  it('should check for uploaded image to have correct filename', () => {
    const dataBase64Mock = 'PHN2ZyB4bWxucz0iaHR0cDo';
    const arrayBuffer = Uint8Array.from(
      window.atob(dataBase64Mock), c => c.charCodeAt(0));
    const file = new File([arrayBuffer], 'thumbnail.svg');
    let result = component.isValidFilename(file);
    expect(result).toBeTrue();
  });

  it('should set image dimensions', () => {
    component.dimensions = {
      height: 0,
      width: 0
    };
    component.setImageDimensions(180, 180);
    expect(component.dimensions).toEqual({ height: 180, width: 180 });
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
    component.thumbnailHasChanged = true;
    component.uploadedImage = 'uploaded_img.svg';
    component.bgColor = '#fff';
    component.openInUploadMode = false;
    component.dimensions = {
      height: 180,
      width: 180
    };
    component.confirm();
    expect(component.thumbnailHasChanged).toBeFalse();
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

  it('should disable \'Add Thumbnail\' button unless a new image is' +
    ' uploaded', () => {
    spyOn(component, 'isUploadedImageSvg').and.returnValue(true);
    spyOn(component, 'isValidFilename').and.returnValue(true);
    spyOn(svgSanitizerService, 'getInvalidSvgTagsAndAttrsFromDataUri')
      .and.returnValue({ tags: [], attrs: [] });
    spyOn(svgSanitizerService, 'removeAllInvalidTagsAndAttributes')
      .and.returnValue(fileContent);
    let file = new File([fileContent], 'triangle.svg', {type: 'image/svg'});
    component.uploadedImageMimeType = 'image/svg+xml';
    expect(component.thumbnailHasChanged).toBeFalse();
    component.onFileChanged(file);
    expect(component.thumbnailHasChanged).toBeTrue();
  });
});
