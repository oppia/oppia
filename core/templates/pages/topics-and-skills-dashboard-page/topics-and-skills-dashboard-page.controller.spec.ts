fdescribe('', () => {
  var $scope = null;
  var ctrl = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.inject(function($injector) {
    var $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    var directive = $injector.get('topicsAndSkillsDashboardPageDirective')[0];
    // console.log('directive', directive);
    ctrl = $injector.instantiate(directive.controller, {
    //   $rootScope: $scope
      $scope: $scope
    });
  }));

  it('fsdfds', () => {
    expect(1).toBe(1);
  });
})