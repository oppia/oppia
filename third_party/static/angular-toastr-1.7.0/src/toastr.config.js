(function() {
  'use strict';

  angular.module('toastr')
    .constant('toastrConfig', {
      allowHtml: false,
      autoDismiss: false,
      closeButton: false,
      closeHtml: '<button>&times;</button>',
      containerId: 'toast-container',
      extendedTimeOut: 1000,
      iconClasses: {
        error: 'toast-error',
        info: 'toast-info',
        success: 'toast-success',
        warning: 'toast-warning'
      },
      maxOpened: 0,
      messageClass: 'toast-message',
      newestOnTop: true,
      onHidden: null,
      onShown: null,
      onTap: null,
      positionClass: 'toast-top-right',
      preventDuplicates: false,
      preventOpenDuplicates: false,
      progressBar: false,
      tapToDismiss: true,
      target: 'body',
      templates: {
        toast: 'directives/toast/toast.html',
        progressbar: 'directives/progressbar/progressbar.html'
      },
      timeOut: 5000,
      titleClass: 'toast-title',
      toastClass: 'toast'
    });
}());
