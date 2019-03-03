var oppia = angular.module(
'oppia', [
  'angularAudioRecorder', 'dndLists', 'headroom', 'infinite-scroll',
  'ngAnimate', 'ngAudio', 'ngCookies', 'ngImgCrop', 'ngJoyRide', 'ngMaterial',
  'ngResource', 'ngSanitize', 'ngTouch', 'pascalprecht.translate', 'toastr',
  'ui.bootstrap', 'ui.sortable', 'ui.tree', 'ui.validate'
].concat(
  window.GLOBALS ? (window.GLOBALS.ADDITIONAL_ANGULAR_MODULES || []) : []));
