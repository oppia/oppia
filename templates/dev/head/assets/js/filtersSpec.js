describe('Testing filters', function() {
  var filterNames = [
    'spacesToUnderscores',
    'truncate',
    'round1',
    'bracesToText',
    'bracesToInput',
    'parameterizeRule'
  ];

  beforeEach(angular.mock.module('oppia'));

  it('should have the relevant filters', inject(function($filter) {
    angular.forEach(filterNames, function(filterName) {
      expect($filter(filterName)).not.toEqual(null);
    });
  }));

  it('should convert spaces to underscores properly', inject(function($filter) {
    var filter = $filter('spacesToUnderscores');
    expect(filter('Test')).toEqual('Test');
    expect(filter('Test App')).toEqual('Test_App');
    expect(filter('Test App Two')).toEqual('Test_App_Two');
    expect(filter('Test  App')).toEqual('Test__App');
    expect(filter('  Test  App ')).toEqual('Test__App');
  }));

  it('should round numbers to 1 decimal place', inject(function($filter) {
    var filter = $filter('round1');
    expect(filter(1)).toEqual(1.0);
    expect(filter(1.5)).toEqual(1.5);
    expect(filter(1.53)).toEqual(1.5);
    expect(filter(1.55)).toEqual(1.6);
  }));

  it('should convert {{...}} tags to INPUT indicators', inject(function($filter) {
    var filter = $filter('bracesToText');

    expect(filter('')).toEqual('');
    expect(filter(null)).toEqual('');
    expect(filter(undefined)).toEqual('');

    expect(filter('hello')).toEqual('hello');
    expect(filter('{{hello}}')).toEqual('<code>INPUT</code>');
    expect(filter('{{hello}} and {{goodbye}}')).toEqual(
      '<code>INPUT</code> and <code>INPUT</code>');
    expect(filter('{{}}{{hello}}')).toEqual(
      '{{}}<code>INPUT</code>');
  }));
});
