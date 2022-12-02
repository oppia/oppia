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
 * @fileoverview Module for the diagnostic test player page.
 */


import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, DoBootstrap, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { downgradeComponent, downgradeModule } from '@angular/upgrade/static';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { SharedComponentsModule } from 'components/shared-component.module';
import { platformFeatureInitFactory, PlatformFeatureService } from 'services/platform-feature.service';
import { RequestInterceptor } from 'services/request-interceptor.service';
import { ToastrModule } from 'ngx-toastr';
import { MyHammerConfig, toastrConfig } from 'pages/oppia-root/app.module';
import { SmartRouterModule } from 'hybrid-router-module-provider';
import { AppErrorHandlerProvider } from 'pages/oppia-root/app-error-handler';
import { DiagnosticTestPlayerComponent } from './diagnostic-test-player.component';
import { InteractiveTextInputComponent } from 'interactions/TextInput/directives/oppia-interactive-text-input.component';
import { ResponseTextInputComponent } from 'interactions/TextInput/directives/oppia-response-text-input.component';
import { TopicSummaryTileComponent } from 'components/summary-tile/topic-summary-tile.component';
import { InteractiveDragAndDropSortInputComponent } from 'interactions/DragAndDropSortInput/directives/oppia-interactive-drag-and-drop-sort-input.component';
import { InteractiveMultipleChoiceInputComponent } from 'interactions/MultipleChoiceInput/directives/oppia-interactive-multiple-choice-input.component';
import { ResponseMultipleChoiceInputComponent } from 'interactions/MultipleChoiceInput/directives/oppia-response-multiple-choice-input.component';
import { ResponseAlgebraicExpressionInputComponent } from 'interactions/AlgebraicExpressionInput/directives/oppia-response-algebraic-expression-input.component';
import { ShortResponseAlgebraicExpressionInputComponent } from 'interactions/AlgebraicExpressionInput/directives/oppia-short-response-algebraic-expression-input.component';
import { AlgebraicExpressionInputInteractionComponent } from 'interactions/AlgebraicExpressionInput/directives/oppia-interactive-algebraic-expression-input.component';
import { OppiaInteractiveContinue } from 'interactions/Continue/directives/oppia-interactive-continue.component';
import { OppiaResponseContinueComponent } from 'interactions/Continue/directives/oppia-response-continue.component';
import { OppiaShortResponseContinueComponent } from 'interactions/Continue/directives/oppia-short-response-continue.component';
import { ResponseDragAndDropSortInputComponent } from 'interactions/DragAndDropSortInput/directives/oppia-response-drag-and-drop-sort-input.component';
import { ShortResponseDragAndDropSortInputComponent } from 'interactions/DragAndDropSortInput/directives/oppia-short-response-drag-and-drop-sort-input.component';
import { InteractiveFractionInputComponent } from 'interactions/FractionInput/directives/oppia-interactive-fraction-input.component';
import { ResponseFractionInput } from 'interactions/FractionInput/directives/oppia-response-fraction-input.component';
import { ShortResponseFractionInput } from 'interactions/FractionInput/directives/oppia-short-response-fraction-input.component';
import { InteractiveImageClickInput } from 'interactions/ImageClickInput/directives/oppia-interactive-image-click-input.component';
import { ResponseImageClickInput } from 'interactions/ImageClickInput/directives/oppia-response-image-click-input.component';
import { ShortResponseImageClickInput } from 'interactions/ImageClickInput/directives/oppia-short-response-image-click-input.component';
import { InteractiveItemSelectionInputComponent } from 'interactions/ItemSelectionInput/directives/oppia-interactive-item-selection-input.component';
import { ResponseItemSelectionInputComponent } from 'interactions/ItemSelectionInput/directives/oppia-response-item-selection-input.component';
import { ShortResponseItemSelectionInputComponent } from 'interactions/ItemSelectionInput/directives/oppia-short-response-item-selection-input.component';
import { InteractiveMathEquationInput } from 'interactions/MathEquationInput/directives/oppia-interactive-math-equation-input.component';
import { ResponseMathEquationInput } from 'interactions/MathEquationInput/directives/oppia-response-math-equation-input.component';
import { ShortResponseMathEquationInput } from 'interactions/MathEquationInput/directives/oppia-short-response-math-equation-input.component';
import { ShortResponseMultipleChoiceInputComponent } from 'interactions/MultipleChoiceInput/directives/oppia-short-response-multiple-choice-input.component';
import { MusicNotesInputComponent } from 'interactions/MusicNotesInput/directives/oppia-interactive-music-notes-input.component';
import { ResponseMusicNotesInput } from 'interactions/MusicNotesInput/directives/oppia-response-music-notes-input.component';
import { ShortResponseMusicNotesInput } from 'interactions/MusicNotesInput/directives/oppia-short-response-music-notes-input.component';
import { ShortResponseTextInputComponent } from 'interactions/TextInput/directives/oppia-short-response-text-input.component';
import { ShortResponseSetInputComponent } from 'interactions/SetInput/directives/oppia-short-response-set-input.component';
import { ResponseSetInputComponent } from 'interactions/SetInput/directives/oppia-response-set-input.component';
import { InteractiveSetInputComponent } from 'interactions/SetInput/directives/oppia-interactive-set-input.component';
import { ShortResponseRatioExpressionInputComponent } from 'interactions/RatioExpressionInput/directives/oppia-short-response-ratio-expression-input.component';
import { InteractiveRatioExpressionInputComponent } from 'interactions/RatioExpressionInput/directives/oppia-interactive-ratio-expression-input.component';
import { ShortResponePencilCodeEditor } from 'interactions/PencilCodeEditor/directives/oppia-short-response-pencil-code-editor.component';
import { ResponePencilCodeEditor } from 'interactions/PencilCodeEditor/directives/oppia-response-pencil-code-editor.component';
import { PencilCodeEditor } from 'interactions/PencilCodeEditor/directives/oppia-interactive-pencil-code-editor.component';
import { ShortResponseNumericInput } from 'interactions/NumericInput/directives/oppia-short-response-numeric-input.component';
import { ResponseNumericInput } from 'interactions/NumericInput/directives/oppia-response-numeric-input.component';
import { InteractiveNumericInput } from 'interactions/NumericInput/directives/oppia-interactive-numeric-input.component';
import { ShortResponseNumericExpressionInput } from 'interactions/NumericExpressionInput/directives/oppia-short-response-numeric-expression-input.component';
import { ResponseNumericExpressionInput } from 'interactions/NumericExpressionInput/directives/oppia-response-numeric-expression-input.component';
import { InteractiveNumericExpressionInput } from 'interactions/NumericExpressionInput/directives/oppia-interactive-numeric-expression-input.component';
import { InteractiveNumberWithUnitsComponent } from 'interactions/NumberWithUnits/directives/oppia-interactive-number-with-units.component';
import { ResponseNumberWithUnitsComponent } from 'interactions/NumberWithUnits/directives/oppia-response-number-with-units.component';
import { ShortResponseNumberWithUnitsComponent } from 'interactions/NumberWithUnits/directives/oppia-short-response-number-with-units.component';
import { ResponseRatioExpressionInputComponent } from 'interactions/RatioExpressionInput/directives/oppia-response-ratio-expression-input.component';


declare var angular: ng.IAngularStatic;

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    // TODO(#13443): Remove smart router module provider once all pages are
    // migrated to angular router.
    SmartRouterModule,
    RouterModule.forRoot([]),
    MatCardModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SharedComponentsModule,
    ToastrModule.forRoot(toastrConfig)
  ],
  declarations: [
    AlgebraicExpressionInputInteractionComponent,
    DiagnosticTestPlayerComponent,
    InteractiveDragAndDropSortInputComponent,
    InteractiveFractionInputComponent,
    InteractiveImageClickInput,
    InteractiveItemSelectionInputComponent,
    InteractiveMathEquationInput,
    InteractiveMultipleChoiceInputComponent,
    InteractiveNumberWithUnitsComponent,
    InteractiveNumericExpressionInput,
    InteractiveNumericInput,
    InteractiveRatioExpressionInputComponent,
    InteractiveSetInputComponent,
    InteractiveTextInputComponent,
    MusicNotesInputComponent,
    OppiaInteractiveContinue,
    OppiaResponseContinueComponent,
    OppiaShortResponseContinueComponent,
    PencilCodeEditor,
    ResponePencilCodeEditor,
    ResponseAlgebraicExpressionInputComponent,
    ResponseDragAndDropSortInputComponent,
    ResponseFractionInput,
    ResponseImageClickInput,
    ResponseItemSelectionInputComponent,
    ResponseMathEquationInput,
    ResponseMultipleChoiceInputComponent,
    ResponseMusicNotesInput,
    ResponseNumberWithUnitsComponent,
    ResponseNumericExpressionInput,
    ResponseNumericInput,
    ResponseRatioExpressionInputComponent,
    ResponseSetInputComponent,
    ResponseTextInputComponent,
    ShortResponePencilCodeEditor,
    ShortResponseAlgebraicExpressionInputComponent,
    ShortResponseDragAndDropSortInputComponent,
    ShortResponseFractionInput,
    ShortResponseImageClickInput,
    ShortResponseItemSelectionInputComponent,
    ShortResponseMathEquationInput,
    ShortResponseMultipleChoiceInputComponent,
    ShortResponseMusicNotesInput,
    ShortResponseNumberWithUnitsComponent,
    ShortResponseNumericExpressionInput,
    ShortResponseNumericInput,
    ShortResponseRatioExpressionInputComponent,
    ShortResponseSetInputComponent,
    ShortResponseTextInputComponent,
    TopicSummaryTileComponent
  ],
  entryComponents: [
    AlgebraicExpressionInputInteractionComponent,
    DiagnosticTestPlayerComponent,
    InteractiveDragAndDropSortInputComponent,
    InteractiveFractionInputComponent,
    InteractiveImageClickInput,
    InteractiveItemSelectionInputComponent,
    InteractiveMathEquationInput,
    InteractiveMultipleChoiceInputComponent,
    InteractiveNumberWithUnitsComponent,
    InteractiveNumericExpressionInput,
    InteractiveNumericInput,
    InteractiveRatioExpressionInputComponent,
    InteractiveSetInputComponent,
    InteractiveTextInputComponent,
    MusicNotesInputComponent,
    OppiaInteractiveContinue,
    OppiaResponseContinueComponent,
    OppiaShortResponseContinueComponent,
    PencilCodeEditor,
    ResponePencilCodeEditor,
    ResponseAlgebraicExpressionInputComponent,
    ResponseDragAndDropSortInputComponent,
    ResponseFractionInput,
    ResponseImageClickInput,
    ResponseItemSelectionInputComponent,
    ResponseMathEquationInput,
    ResponseMultipleChoiceInputComponent,
    ResponseMusicNotesInput,
    ResponseNumberWithUnitsComponent,
    ResponseNumericExpressionInput,
    ResponseNumericInput,
    ResponseRatioExpressionInputComponent,
    ResponseSetInputComponent,
    ResponseTextInputComponent,
    ShortResponePencilCodeEditor,
    ShortResponseAlgebraicExpressionInputComponent,
    ShortResponseDragAndDropSortInputComponent,
    ShortResponseFractionInput,
    ShortResponseImageClickInput,
    ShortResponseItemSelectionInputComponent,
    ShortResponseMathEquationInput,
    ShortResponseMultipleChoiceInputComponent,
    ShortResponseMusicNotesInput,
    ShortResponseNumberWithUnitsComponent,
    ShortResponseNumericExpressionInput,
    ShortResponseNumericInput,
    ShortResponseRatioExpressionInputComponent,
    ShortResponseSetInputComponent,
    ShortResponseTextInputComponent,
    TopicSummaryTileComponent
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: RequestInterceptor,
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: platformFeatureInitFactory,
      deps: [PlatformFeatureService],
      multi: true,
    },
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig
    },
    AppErrorHandlerProvider,
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    }
  ],
})
class DiagnosticTestPlayerPageModule implements DoBootstrap {
  ngDoBootstrap() {}
}

angular.module('oppia').requires.push(downgradeModule(extraProviders => {
  const platformRef = platformBrowserDynamic(extraProviders);
  return platformRef.bootstrapModule(DiagnosticTestPlayerPageModule);
}));

angular.module('oppia').directive('oppiaAngularRoot', downgradeComponent({
  component: OppiaAngularRootComponent,
}));
