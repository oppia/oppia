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
