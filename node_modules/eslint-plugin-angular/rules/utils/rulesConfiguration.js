'use strict';

function Rule(name, config) {
    this.name = name;
    this.config = config;
    this._requireRule = require('../' + this.name);
}

Rule.prototype = {
    requireRule: function() {
        return this._requireRule;
    },
    requireLegacyRule: function() {
        var self = this;
        function legacyRule(context) {
            self.logWarningOnce(context);
            return self._requireRule(context);
        }
        legacyRule.schema = self._requireRule.schema;
        return legacyRule;
    },
    getLegacyName: function() {
        return 'ng_' + this.name.replace(/-/g, '_');
    },
    logWarningOnce: function(context) {
        /* eslint-disable no-console */
        console.log('WARNING: Deprecated rule name ' + context.id + ' use angular/' + this.name + ' instead (will be removed in v1.0).');
        /* eslint-enable no-console */
        this.logWarningOnce = function() {};
    }
};

module.exports = {
    rules: [],
    addRule: function(name, config) {
        this.rules.push(new Rule(name, config));
    },
    moduleExports: function() {
        var exportObject = {
            rules: {},
            rulesConfig: {}
        };

        this.rules.forEach(function(rule) {
            var legacyName = rule.getLegacyName();

            exportObject.rules[rule.name] = rule.requireRule();
            exportObject.rulesConfig[rule.name] = rule.config;

            exportObject.rules[legacyName] = rule.requireLegacyRule();
            exportObject.rulesConfig[legacyName] = 0;
        });
        return exportObject;
    }
};
