'use strict';

angular.module('ui.sortable.testHelper', [])
  .factory('sortableTestHelper', function () {
    var EXTRA_DY_PERCENTAGE = 0.25;

    function listContent (list) {
      if (list && list.length) {
        return list.children().map(function(){ return this.innerHTML; }).toArray();
      }
      return [];
    }

    function listInnerContent (list) {
      if (list && list.length) {
        return list.children().map(function(){ return $(this).find('.itemContent').html(); }).toArray();
      }
      return [];
    }

    return {
      EXTRA_DY_PERCENTAGE: EXTRA_DY_PERCENTAGE,
      listContent: listContent,
      listInnerContent: listInnerContent
    };
  });
