// Service for assembling extension tags (for interactions).
oppia.factory('ExtensionTagAssemblerService', [
  '$filter', 'HtmlEscaperService', function($filter, HtmlEscaperService) {
    return {
      formatCustomizationArgAttrs: function(element, customizationArgSpecs) {
        for (var caSpecName in customizationArgSpecs) {
          var caSpecValue = customizationArgSpecs[caSpecName].value;
          element.attr(
            $filter('camelCaseToHyphens')(caSpecName) + '-with-value',
            HtmlEscaperService.objToEscapedJson(caSpecValue));
        }
        return element;
      }
    };
  }
]);
