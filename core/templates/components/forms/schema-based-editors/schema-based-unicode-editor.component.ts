// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for a schema-based editor for unicode strings.
 */

// Relative path used as an work around to get the angular compiler and webpack
// build to not complain.
// TODO(#16309): Fix relative imports.
import '../../../third-party-imports/ui-codemirror.import';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import CodeMirror from 'codemirror';
import 'components/code-mirror/codemirror.component';
import {StateCustomizationArgsService} from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import {Subscription} from 'rxjs';
import {DeviceInfoService} from 'services/contextual/device-info.service';
import {SchemaDefaultValue} from 'services/schema-default-value.service';
import {SchemaFormSubmittedService} from 'services/schema-form-submitted.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {validate} from 'components/forms/validators/schema-validators';
import {Validator as OppiaValidator} from 'interactions/TextInput/directives/text-input-validation.service';

@Component({
  selector: 'schema-based-unicode-editor',
  templateUrl: './schema-based-unicode-editor.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SchemaBasedUnicodeEditor),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SchemaBasedUnicodeEditor),
      multi: true,
    },
  ],
})
export class SchemaBasedUnicodeEditor
  implements ControlValueAccessor, OnInit, Validator
{
  @Output() inputBlur: EventEmitter<void> = new EventEmitter();
  @Output() inputFocus: EventEmitter<void> = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() disabled!: boolean;
  @Input() uiConfig!:
    | {
        rows: string[];
        placeholder: string;
        coding_mode: string;
      }
    | undefined;

  @Input() validators!: OppiaValidator[];
  @Input() labelForFocusTarget!: string;
  localValue!: string;
  onChange: (value: string) => void = () => {};
  directiveSubscriptions = new Subscription();
  codemirrorStatus: boolean = false;
  codemirrorOptions: {
    extraKeys: {Tab: (cm: CodeMirror.Editor) => void};
    indentWithTabs: boolean;
    lineNumbers: boolean;
    readOnly?: string;
    mode?: string;
  } = {
    // Convert tabs to spaces.
    extraKeys: {
      Tab: cm => {
        var spaces = Array(
          // This throws "Object is possibly undefined." The type undefined
          // comes here from code mirror dependency. We need to suppress this
          // error because of strict type checking.
          // @ts-ignore
          cm.getOption('indentUnit') + 1
        ).join(' ');
        cm.replaceSelection(spaces);
        // Move the cursor to the end of the selection.
        var endSelectionPos = cm.getDoc().getCursor('head');
        cm.getDoc().setCursor(endSelectionPos);
      },
    },
    indentWithTabs: false,
    lineNumbers: true,
  };

  constructor(
    private deviceInfoService: DeviceInfoService,
    private focusManagerService: FocusManagerService,
    private schemaFormSubmittedService: SchemaFormSubmittedService,
    private stateCustomizationArgsService: StateCustomizationArgsService,
    private translateService: TranslateService
  ) {}

  updateLocalValue(): void {
    setTimeout(() => {
      this.onChange(this.localValue);
    });
  }

  writeValue(value: string): void {
    this.localValue = value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: SchemaDefaultValue): void {}

  validate(control: AbstractControl): ValidationErrors | null {
    return validate(control, this.validators);
  }

  ngOnInit(): void {
    if (this.uiConfig && this.uiConfig.coding_mode) {
      // Flag that is flipped each time the codemirror view is
      // shown. (The codemirror instance needs to be refreshed
      // every time it is unhidden.)
      this.codemirrorStatus = false;
      var CODING_MODE_NONE = 'none';

      if (this.disabled) {
        this.codemirrorOptions.readOnly = 'nocursor';
      }
      // Note that only 'coffeescript', 'javascript', 'lua', 'python',
      // 'ruby' and 'scheme' have CodeMirror-supported syntax
      // highlighting. For other languages, syntax highlighting will not
      // happen.
      if (this.uiConfig.coding_mode !== CODING_MODE_NONE) {
        this.codemirrorOptions.mode = this.uiConfig.coding_mode;
      }

      setTimeout(() => {
        this.codemirrorStatus = !this.codemirrorStatus;
      }, 200);

      // When the form view is opened, flip the status flag. The
      // timeout seems to be needed for the line numbers etc. to display
      // properly.
      this.directiveSubscriptions.add(
        this.stateCustomizationArgsService.onSchemaBasedFormsShown.subscribe(
          () => {
            setTimeout(() => {
              this.codemirrorStatus = !this.codemirrorStatus;
            }, 200);
          }
        )
      );
    }
  }

  onKeypress(evt: KeyboardEvent): void {
    if (evt.keyCode === 13) {
      this.schemaFormSubmittedService.onSubmittedSchemaBasedForm.emit();
    }
  }

  getPlaceholder(): string {
    if (!this.uiConfig) {
      return '';
    } else {
      if (
        !this.uiConfig.placeholder &&
        this.deviceInfoService.hasTouchEvents()
      ) {
        return this.translateService.instant(
          'I18N_PLAYER_DEFAULT_MOBILE_PLACEHOLDER'
        );
      }
      return this.uiConfig.placeholder;
    }
  }

  getRows(): string[] | null {
    if (!this.uiConfig) {
      return null;
    } else {
      return this.uiConfig.rows;
    }
  }

  getCodingMode(): string | null {
    if (!this.uiConfig) {
      return null;
    } else {
      return this.uiConfig.coding_mode;
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
