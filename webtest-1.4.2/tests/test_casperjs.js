
var system = require('system');
var url = system.env['APPLICATION_URL'];

var casper = require('casper').create();
casper.start(url, function() {
    this.test.assertTitle('It Works!');
});

casper.run(function() {
    this.test.renderResults(true);
});
