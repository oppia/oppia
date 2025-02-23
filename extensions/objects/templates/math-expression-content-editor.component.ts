// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for math expression content editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

import {AlertsService} from 'services/alerts.service';
import {ExternalRteSaveService} from 'services/external-rte-save.service';
import {ImageUploadHelperService} from 'services/image-upload-helper.service';
import {SvgSanitizerService} from 'services/svg-sanitizer.service';

// Relative path used as an work around to get the angular compiler and webpack
// build to not complain.
// TODO(#16309): Fix relative imports.
import '../../../core/templates/mathjaxConfig';
import {
  InsertScriptService,
  KNOWN_SCRIPTS,
} from 'services/insert-script.service';

interface MathExpression {
  svg_filename: string;
  raw_latex: string;
  mathExpressionSvgIsBeingProcessed: boolean;
  svgFile: string;
}

@Component({
  selector: 'math-expression-content-editor',
  templateUrl: './math-expression-content-editor.component.html',
  styleUrls: [],
})
export class MathExpressionContentEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() modalId!: symbol;
  @Input() alwaysEditable: boolean = false;
  @Input() value!: MathExpression;
  @Output() valueChanged = new EventEmitter();
  debouncedUpdate$: Subject<string> = new Subject();
  numberOfElementsInQueue!: number;
  svgString!: string;
  placeholderText = '\\frac{x}{y}';
  active: boolean = false;
  localValue: {label: string} = {label: ''};

  constructor(
    private alertsService: AlertsService,
    private externalRteSaveService: ExternalRteSaveService,
    private imageUploadHelperService: ImageUploadHelperService,
    private svgSanitizerService: SvgSanitizerService,
    private insertScriptService: InsertScriptService
  ) {}

  ngOnInit(): void {
    this.insertScriptService.loadScript(KNOWN_SCRIPTS.MATHJAX, () => {
      this.init();
    });
  }

  private init(): void {
    // Reset the component each time the value changes (e.g. if this is
    // part of an editable list).
    this.svgString = '';
    this.numberOfElementsInQueue = 0;
    // If svg_filename and raw_latex values are already initialised, it means
    // that an existing math expression is being edited. In this case, the
    // editor template can be initialised with the actual values instead of
    // default ones.
    if (!this.value) {
      this.value = {
        raw_latex: '',
        svg_filename: '',
        svgFile: '',
        mathExpressionSvgIsBeingProcessed: false,
      };
    }
    if (this.value.svg_filename && this.value.raw_latex) {
      this.localValue.label = this.value.raw_latex;
      this.value.mathExpressionSvgIsBeingProcessed = false;
      this.convertLatexStringToSvg(this.localValue.label);
    } else {
      this.value.mathExpressionSvgIsBeingProcessed = true;
    }
    this.valueChanged.emit(this.value);
    if (this.value.raw_latex) {
      this.localValue.label = this.value.raw_latex;
    }
    this.directiveSubscriptions.add(
      this.externalRteSaveService.onExternalRteSave.subscribe(() => {
        this.processAndSaveSvg();
        if (this.active) {
          this.replaceValue(this.localValue.label);
        }
      })
    );
    this.directiveSubscriptions.add(
      this.debouncedUpdate$.pipe(debounceTime(300)).subscribe(newValue => {
        this.updateLocalValue(newValue);
      })
    );
    if (!this.alwaysEditable) {
      this.closeEditor();
    }
  }

  directiveSubscriptions = new Subscription();
  // TODO(#10197): Upgrade to MathJax 3, after proper investigation
  // and testing. MathJax 3 provides a faster and more cleaner way to
  // convert a LaTeX string to an SVG.
  private convertLatexStringToSvg(inputLatexString: string) {
    const outputElement = document.createElement('div');
    // We need to append the element with a script tag so that Mathjax
    // can typeset and convert this element. The typesetting is not
    // possible if we don't add a script tag. The code below is similar
    // to how the math equations are rendered in the mathjaxBind
    // directive (see mathjax-bind.directive.ts).
    const s = document.createElement('script');
    s.type = 'math/tex';
    s.text = inputLatexString === undefined ? '' : inputLatexString;
    outputElement.innerHTML = s.outerHTML;
    // Naturally MathJax works asynchronously, but we can add processes
    // which we want to happen synchronously into the MathJax Hub Queue.
    MathJax.Hub.Queue(['Typeset', MathJax.Hub, outputElement]);
    this.numberOfElementsInQueue++;
    MathJax.Hub.Queue(() => {
      if (outputElement.getElementsByTagName('svg')[0] !== undefined) {
        let svgElement = outputElement.getElementsByTagName('svg')[0];
        // This is required so that DOMParser can correctly set the namespaceURI
        // for the document when parsing the SVG string in SVGSanitizerService.
        // Without this change, getting the 'outerHTML' property on the parsed
        // document will result in xmlns being removed in Firefox browsers and
        // the image rendered will appear broken. Note that Chrome's
        // implementation of outerHTML does not remove xmlns.
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        this.svgString = svgElement.outerHTML;
      }
      this.numberOfElementsInQueue--;
      // We need to ensure that all the typepsetting requests in the
      // MathJax queue is finished before we save the final SVG.
      if (this.numberOfElementsInQueue === 0) {
        this.value.mathExpressionSvgIsBeingProcessed = false;
        this.valueChanged.emit(this.value);
      }
    });
  }

  // This method cleans the SVG string and generates a filename before
  // the SVG can be saved to the backend in the RteHelperModalController.
  // The method doesn't save the SVG to the backend, it just updates
  // svgFile field in the this.value passed to it and the
  // RteHelperModalController will handle the saving of the file to the
  // backend.
  private processAndSaveSvg() {
    const cleanedSvgString =
      this.svgSanitizerService.cleanMathExpressionSvgString(this.svgString);
    const dimensions =
      this.svgSanitizerService.extractDimensionsFromMathExpressionSvgString(
        cleanedSvgString
      );
    const fileName =
      this.imageUploadHelperService.generateMathExpressionImageFilename(
        dimensions.height,
        dimensions.width,
        dimensions.verticalPadding
      );
    // We need use unescape and encodeURIComponent in order to
    // handle the case when SVGs have non-ascii unicode characters.
    const dataURI =
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(cleanedSvgString)));
    const invalidTagsAndAttributes =
      this.svgSanitizerService.getInvalidSvgTagsAndAttrsFromDataUri(dataURI);
    const tags = invalidTagsAndAttributes.tags;
    const attrs = invalidTagsAndAttributes.attrs;
    if (tags.length === 0 && attrs.length === 0) {
      this.value.svgFile = dataURI;
      this.value.svg_filename = fileName;
    } else {
      this.value.raw_latex = '';
      this.value.svg_filename = '';
      this.alertsService.addWarning('SVG failed validation.');
    }
    this.valueChanged.emit(this.value);
  }

  updateLocalValue(newValue: string): void {
    this.localValue.label = newValue;
    this.value.mathExpressionSvgIsBeingProcessed = true;
    this.value.raw_latex = newValue;
    this.valueChanged.emit(this.value);
    this.convertLatexStringToSvg(this.localValue.label);
  }

  openEditor(): void {
    if (!this.alwaysEditable) {
      return;
    }
    this.active = true;
  }

  closeEditor(): void {
    if (!this.alwaysEditable) {
      return;
    }
    this.active = false;
  }

  replaceValue(newValue: string): void {
    if (!this.alwaysEditable) {
      return;
    }
    this.localValue = {
      label: newValue,
    };
    this.value.raw_latex = newValue;
    this.valueChanged.emit(this.value);
    this.closeEditor();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.insertScriptService.hasScriptLoaded(KNOWN_SCRIPTS.MATHJAX) &&
      changes.value &&
      changes.value.currentValue.raw_latex !==
        changes.value.previousValue?.raw_latex
    ) {
      this.localValue = {
        label: this.value.raw_latex || '',
      };
      this.convertLatexStringToSvg(this.localValue.label);
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
