var tarFileInputWidgetWithHints = angular.module('tarFileInputWidgetWithHints', ['ngSanitize']);

// Sets the AngularJS interpolators as <[ and ]>, to not conflict with Django.
tarFileInputWidgetWithHints.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('<[');
  $interpolateProvider.endSymbol(']>');
});

function TarFileReadInputWithHints($scope) {
  $scope.hintPlaceholder = GLOBALS.hintPlaceholder;
  $scope.lowHint = GLOBALS.lowHint;
  $scope.mediumHint = GLOBALS.mediumHint;
  $scope.highHint = GLOBALS.highHint;
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
        if (parent.location.pathname.indexOf('/learn') === 0) {
          window.parent.postMessage(
            JSON.stringify({'submit': answer}),
            window.location.protocol + '//' + window.location.host
          );
        }
      }
    });
  };
}
