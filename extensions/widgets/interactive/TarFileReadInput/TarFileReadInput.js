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
 * Directive for the TarFileReadInput interactive widget.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveTarFileReadInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interactiveWidget/TarFileReadInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = '';
        $scope.filename = '';

        $scope.submitAnswer = function(el) {
          var theFile = el.files[0];

          if (theFile.size === 0) {
            alert('Please choose a non-empty file.');
            return;
          }
          if (theFile.size >= 1000) {
            alert('File too large. Please choose a file smaller than 1 kilobyte.');
            return;
          }

          var form = new FormData();
          form.append('file', theFile);

          $scope.filename = theFile.name;
          // The call to $scope.$apply() is needed because $scope.filename does not
          // update automatically in the HTML template.
          $scope.$apply();
          $('#processing-modal').modal('show');

          $.ajax({
            url: '/filereadhandler',
            data: form,
            processData: false,
            contentType: false,
            type: 'POST',
            datatype: 'json',
            success: function(data) {
              console.log(data);
              var answer = data['base64_file_content'];
              if (!answer) {
                alert('An error occurred while processing your input.');
                return;
              }
              $scope.$parent.$parent.submitAnswer(answer, 'submit');
            }
          });
        };
      }]
    };
  }
]);

