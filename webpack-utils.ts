function PageMeta(name: string, description: string) {
  this.name = name;
  this.description = description;
  this.referrer = 'no-referrer';
  this.viewport = 'width=device-width, initial-scale=1.0, user-scalable=yes';

  this['application-name'] = '<[ siteName ]>';
  this['msapplication-square310x310logo'] = (
    '<[ getAssetUrl(\'/assets/images/logo/msapplication-large.png\') ]>');
  this['msapplication-wide310x150logo'] = (
    '<[ getAssetUrl(\'/assets/images/logo/msapplication-wide.png\') ]>');
  this['msapplication-square150x150logo'] = (
    '<[ getAssetUrl(\'/assets/images/logo/msapplication-square.png\') ]>');
  this['msapplication-square70x70logo'] = (
    '<[ getAssetUrl(\'/assets/images/logo/msapplication-tiny.png\') ]>');
  
  this['og:type'] = {
    property: 'og:type',
    content: 'article'
  };
  this['og:site_name'] = {
    property: 'og:site_name',
    content: 'Oppia'
  };
  this['og:url'] = {
    property: 'og:url',
    content: '<[pageUrl]>'
  };
  this['og:title'] = {
    property: 'og:title',
    content: name
  };
  this['og:description'] = {
    property: 'og:description',
    content: description
  };
  this['og:image'] = {
    property: 'og:image',
    content: '<[ getAssetUrl(\'/assets/images/logo/288x288_logo_mint.png\') ]>'
  }; 
}

var utilities = {
  getMetas: function(page) {
    var get_started = new PageMeta(
      'Personalized Online Learning from Oppia',
      'Learn how to get started using Oppia.');
    return {
      get_started
    };
  },
};

module.exports = utilities;
