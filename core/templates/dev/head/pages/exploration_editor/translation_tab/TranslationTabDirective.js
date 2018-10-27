// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the translation tab.
 */

oppia.directive('translationTab', [
  'UrlInterpolationService', '$timeout', function(UrlInterpolationService, $timeout) {
    return {
      restrict: 'E',
      scope: {},
      link: function(scope) {
        scope.$broadcast('refreshTranslationTab');
        $timeout( function(){
          scope.$broadcast('openTranslationTutorial')
        }, 5000);
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'translation_tab_directive.html'),
      controller: ['$scope', '$rootScope', '$templateCache', '$timeout',
       'EditabilityService', function($scope, $rootScope, 
        $templateCache, $timeout, EditabilityService) {
        var _ID_TUTORIAL_TRANSLATE_LANGUAGE = '#tutorialTranslateLanguage';
        var _ID_TUTORIAL_TRANSLATE_STATE = '#tutorialTranslateState';
        var _ID_TUTORIAL_TRANSLATE_GRAPH = '#tutorialTranslateStateGraph';
        var _ID_TUTORIAL_TRANSLATE_AUDIOBAR = '#tutorialTranslateAudioBar';
        $scope.TRANSLATE_TUTORIAL_OPTIONS = [{
          type: 'title',
          heading: 'Translations in Oppia',
          text: (
            'Hello, welcome to translation tab ' +
            'this tour will walk you through the translation page. ' +
            'Hit the next button to begin.')
        },{
          type: 'function',
          fn: function(isGoingForward) {
            $('html, body').animate({
              scrollTop: (isGoingForward ? 0 : 20)
            }, 1000);
        }
        },{
          type: 'element',
          selector:_ID_TUTORIAL_TRANSLATE_LANGUAGE,
          heading: 'Choose Language',
          text: ('Start your translation by choosing the language that you '+
           'desire to translate to.'
           ),
          placement: 'bottom'
        },{
          type: 'function',
          fn: function(isGoingForward) {
            var idToScrollTo = (
              isGoingForward ? _ID_TUTORIAL_TRANSLATE_AUDIOBAR :
              _ID_TUTORIAL_TRANSLATE_LANGUAGE);
            $('html, body').animate({
              scrollTop: angular.element(idToScrollTo).offset().top - 200
            }, 1000);
          }
        },{
          type: 'element',
          selector: _ID_TUTORIAL_TRANSLATE_AUDIOBAR,
          heading: 'Audio Recording Bar',
          text: (
            '<p>This audio translation bar is where the translation magic happens. '+
            'Upload, Create or Play your translations here.</p>'
          ),
          placement: 'top',
        },{
          type: 'function',
          fn: function(isGoingForward) {
            $('html, body').animate({
              scrollTop: (isGoingForward ? 0 : 20)
            }, 1000);
          }
        },{
          type: 'title',
          heading: 'Uploading Audio Translations',
          text: ('<p>You can upload your own translations with the '+
          '<i class="material-icons" style="color:#009688" >&#xE2C6;</i> '+
          'or <b>"reupload files"</b> button, a window '+
          'will show asking to <b>upload</b> the audio.'+
          '</p>'
          )
        },{
          type: 'function',
          fn: function(isGoingForward) {
            $('html, body').animate({
              scrollTop: (isGoingForward ? 0 : 20)
            }, 1000);
          }
        },{
          type: 'title',
          heading: 'Recording Audio Translations',
          text: ('<p>To create audio translations in Oppia '+
          'simply follow these 3 steps.</p>'+
          '<ol>'+
          '  <li>'+
          '    Start your <b>recording</b> with the '+
          '    <i class="material-icons" style="color:#009688">mic</i> button. '+
          '    Allow the browser to record in order to begin. '+
          '  </li>'+
          '  <li>'+
          '    Once you are ready to end the recording, use the '+
          '    <i class="material-icons" style="color:#009688">&#xE047;</i> to <b>stop</b>. '+
          '  </li>'+
          '  <li>'+
          '    Hit the <b>save</b> <i class="material-icons" style="color:#009688" >&#xE161;</i> button '+
          '    once you are done.'+
          '  </li>'+
          '</ol>'
          )
        },{
          type: 'function',
          fn: function(isGoingForward) {
            $('html, body').animate({
              scrollTop: (isGoingForward ? 0 : 20)
            }, 1000);
          }
        },{
          type: 'title',
          heading: 'Recording Audio Translation - Continued',
          text: ('<p>The audio recording also has options related '+
          'to updating and deleting translations.</p>'+
          '<ul>'+
          '  <li>'+
          '    To do retakes use the '+
          '    <i class="material-icons" style="color:#009688">&#xE028;</i> button. '+
          '  </li>'+
          '  <li>'+
          '    To delete a recording, use the '+
          '    <i class="material-icons" style="color:#009688">&#xE872;</i> button. '+
          '  </li>'+
          '  <li>'+
          '    <i class="material-icons" style="color:#009688">&#xE5C9;</i> '+
          '    to cancel a change.'+
          '  </li>'+
          '  <li>'+
          '    Play the audio with the '+
          '    <i class="material-icons" style="color:#009688" >&#xE161;</i> and '+
          '    pause with the <i class="material-icons" style="color:#009688" >&#xE035;</i>.'+
          '  </li>'+
          '  <li>'+
          '    Mark the interaction needing updates or changes with the  '+
          '    <b>"mark need updates"</b> button'+
          '  </li>'+
          '</ul>'
          )
        },{
          type: 'function',
          fn: function(isGoingForward) {
            $('html, body').animate({
              scrollTop: (isGoingForward ? 0 : 20)
            }, 1000);
          }
        },{
          type: 'element',
          selector: _ID_TUTORIAL_TRANSLATE_STATE,
          heading: 'Translation State',
          text: (
            '<p>The translation state menu, shows the state of translation ' +
            '<b>for each and every component</b> of the interaction. ' +
            'Each tab can have different and varying audio translations. '+ 
            '</p>'
          ),
          placement: 'bottom'
        },{
        type: 'function',
        fn: function(isGoingForward) {
          var idToScrollTo = (
            isGoingForward ? _ID_TUTORIAL_TRANSLATE_GRAPH :
            _ID_TUTORIAL_TRANSLATE_STATE);
          $('html, body').animate({
            scrollTop: 0
          }, 1000);
        }
        },{
          type: 'element',
          selector: _ID_TUTORIAL_TRANSLATE_GRAPH,
          heading: 'Exploration Overview Graph',
          text: (
            '<p>This shows the different interactions available for translation. '+
            'A bold border marks that its the current interaction selected. '+
            'You will be able to switch between quickly between '+
            'clicking diffrent interaction here.'+
            '</p>'
          ),
          placement: 'left'
        },{
          type: 'function',
          fn: function(isGoingForward) {
            $('html, body').animate({
              scrollTop: (isGoingForward ? 0 : 20)
            }, 1000);
        }
        },{
          type: 'title',
          heading: 'Color and Warning States',
          text: (
            '<p>In both the Translation State tabs and Exploration Overview '+
            'components, you will notice there are colors and '+
            'symbols indicating the translation state.</p> '+
            '<ul>'+
            ' <li>'+
            '   <span style="color:green;">Green:</span> If <b>all</b> the '+
            '   interaction components have audio. '+
            ' </li>'+
            ' <li>'+
            '   <span style="color:yellow;">Yellow:</span> If <b>any</b> of '+
            '   the interaction components have audio. '+
            ' </li>'+
            ' <li>'+
            '   <span style="color:red;">Red:</span> If <b>none</b> of '+
            '   the interaction components have audio. '+
            ' </li>'+
            ' <li>'+
            '  The Warning sign <i class="material-icons">⚠</i> used to show '+
            '  if any part of the interaction component require a change '+
            ' </li>'+
            '</ul>'
          )
        },{
          type: 'function',
          fn: function(isGoingForward) {
            $('html, body').animate({
              scrollTop: (isGoingForward ? 0 : 20)
            }, 1000);
        }
        },{
          type: 'title',
          heading: 'Tutorial Complete',
          text: (
            '<p>'+
            'Now you ready to begin translating for your explorations. '+
            'This marks the end of this tour, '+
            'remember to save your progress using the save button like an '+
            'exploration with <button class="btn btn-success" disabled>'+
            '<i class="material-icons" >&#xE161;'+
            '</i></button>.'
          ) 
        }];
        // Replace the ng-joyride template with one that uses <[...]> interpolators
        // instead of/ {{...}} interpolators.
        var ngJoyrideTemplate = $templateCache.get('ng-joyride-title-tplv1.html');
        ngJoyrideTemplate = ngJoyrideTemplate.replace(
          /\{\{/g, '<[').replace(/\}\}/g, ']>');
        $templateCache.put('ng-joyride-title-tplv1.html', ngJoyrideTemplate);

        $scope.onFinishTutorial = function(){
          $scope.translationTutorial = false;
        };

        $scope.onSkipTutorial = function(){
          $scope.translationTutorial = false;
        };
        $scope.translationTutorial = false;
        $scope.onStartTutorial = function(){
          if (GLOBALS.can_translate)
          {
            $scope.translationTutorial = true;
          }
        };

        $rootScope.loadingMessage = 'Loading';
        $scope.isTranslationTabBusy = false;
        $scope.$on('refreshTranslationTab', function() {
          $scope.$broadcast('refreshStateTranslation');
        });
        $scope.$on('openTranslationTutorial', $scope.onStartTutorial);
      }]
    };
  }]);
