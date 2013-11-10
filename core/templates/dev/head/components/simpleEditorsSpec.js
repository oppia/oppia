describe('List directive', function() {
  var elm, scope;

  LIST_COMPONENT_HTML_PATH = 'core/templates/dev/head/components/list.html';

  beforeEach(module('oppia', LIST_COMPONENT_HTML_PATH));

  beforeEach(inject(function($templateCache) {
    template = $templateCache.get(LIST_COMPONENT_HTML_PATH);
    $templateCache.put('/templates/list', template);
  }));

  // TODO(sll): Add E2E tests.

  it('should check largeInput works correctly', inject(function($rootScope, $compile) {
    scope = $rootScope;
    scope.val = ['first list value'];

    elm = $compile('<list items="val" large-input="true"></list>')($rootScope);
    scope.$apply();

    var listControllerScope = elm.scope();
    expect(listControllerScope.largeInput).toEqual('true');

    elm = $compile('<list items="val"></list>')($rootScope);
    scope.$apply();

    listControllerScope = elm.scope();
    // TODO(sll): Doesn't this get changed to false in the interior scope?
    expect(listControllerScope.largeInput).toBeUndefined();
  }));

  it('should have a new item by default', inject(function($rootScope, $compile) {
    scope = $rootScope;
    scope.val = [];

    elm = $compile('<list items="val"></list>')($rootScope);
    scope.$apply();

    var listControllerScope = elm.scope();
    expect(listControllerScope.items).toEqual(['']);
  }));

  it('should add a new item when asked', inject(function($rootScope, $compile) {
    scope = $rootScope;
    scope.val = ['abc', 'def'];

    elm = $compile('<list items="val"></list>')($rootScope);
    scope.$apply();

    var listControllerScope = elm.scope();
    listControllerScope.addItem();
    expect(listControllerScope.items).toEqual(['abc', 'def', '']);
  }));

  it('should replace a list item', inject(function($rootScope, $compile) {
    scope = $rootScope;
    scope.val = ['first item'];

    elm = $compile('<list items="val"></list>')($rootScope);
    scope.$apply();

    var listControllerScope = elm.scope();
    expect(listControllerScope.items).toEqual(['first item']);
    listControllerScope.replaceItem(0, 'replacement item');
    expect(listControllerScope.items).toEqual(['replacement item']);
  }));
});


describe('RTE directive', function() {
  var elm, scope, $httpBackend;

  beforeEach(module('oppia'));
  beforeEach(inject(function($rootScope, $compile, _$httpBackend_) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/widgetrepository/data/noninteractive').respond({
      data: {
        widgets: {
          'Basic Input': [{
            frontend_name: 'image',
            name: 'Image',
            tooltip: 'Insert image',
            icon_data_url: 'data:123'
          }]
        }
      }
    });

    elm = $compile('<rich-text-editor></rich-text-editor>')($rootScope);
    scope = $rootScope;
    scope.$digest();
  }));

  it('should convert correctly between HTML and RTE', inject(function($rootScope, $compile) {
    var testData = [
      ['<div></div>', '<div></div>'],
      ['<div>abc</div>', '<div>abc</div>'],
      ['<div>abc</div><br>', '<div>abc</div><br>'],
      ['<div>abc<span>def</span></div><b>ghi</b>', '<div>abc<span>def</span></div><b>ghi</b>'],
      ['<oppia-noninteractive-image></oppia-noninteractive-image>',
       '<img class="oppia-noninteractive-image" src="data:123">'],
      ['<oppia-noninteractive-image image_id-with-value="&amp;quot;T&amp;quot;"></oppia-noninteractive-image>',
       '<img image_id-with-value="&amp;quot;T&amp;quot;" class="oppia-noninteractive-image" src="data:123">']
    ];

    var rteControllerScope = elm.scope();

    // TODO(sll): Why isn't this being auto-populated?
    rteControllerScope._NONINTERACTIVE_WIDGETS = [{
        name: 'image',
        backendName: 'Image',
        tooltip: 'Insert image',
        iconDataUrl: 'data:123'
    }];

    for (var i = 0; i < testData.length; i++) {
      expect(rteControllerScope._convertHtmlToRte(testData[i][0]))
          .toEqual(testData[i][1]);
      expect(rteControllerScope._convertRteToHtml(testData[i][1]))
          .toEqual(testData[i][0]);
    }
  }));
});
