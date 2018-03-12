var applySourceMap = require('vinyl-sourcemaps-apply');
var CleanCSS = require('clean-css');
var objectAssign = require('object-assign');
var path = require('path');
var PluginError = require('gulp-util').PluginError;
var Transform = require('readable-stream/transform');
var VinylBufferStream = require('vinyl-bufferstream');

module.exports = function gulpCleanCSS(options, callback) {

    if (arguments.length === 1) {
        if (Object.prototype.toString.call(arguments[0]) == '[object Function]') {
            callback = arguments[0];
        } else {
            options = options || {};
        }
    } else {
        options = options || {};
    }

    return new Transform({
        objectMode: true,
        transform: function modifyContents(file, enc, cb) {

            var self = this;

            var run = new VinylBufferStream(function (buf, done) {
                var fileOptions = objectAssign({target: file.path}, options);

                if (fileOptions.relativeTo === undefined && (fileOptions.root || file.path)) {
                    fileOptions.relativeTo = path.dirname(path.resolve(options.root || file.path));
                }

                if ((options.sourceMap === true || options.sourceMap === undefined) && file.sourceMap) {
                    fileOptions.sourceMap = JSON.stringify(file.sourceMap);
                }

                var cssFile;

                if (file.path) {
                    cssFile = {};
                    cssFile[file.path] = {styles: buf.toString()};
                } else {
                    cssFile = buf.toString();
                }

                new CleanCSS(fileOptions).minify(cssFile, function (errors, css) {

                    if (errors) {
                        done(errors.join(' '));
                        return;
                    }

                    if (css.sourceMap) {
                        var map = JSON.parse(css.sourceMap);
                        map.file = path.relative(file.base, file.path);
                        map.sources = map.sources.map(function (src) {
                            if (/^(https?:)?\/\//.test(src)) {
                                return src;
                            }

                            return path.relative(file.base, src);
                        });

                        applySourceMap(file, map);
                    }

                    if (typeof callback === 'function') {
                        var details = {
                            'stats': css.stats,
                            'errors': css.errors,
                            'warnings': css.warnings
                        }

                        if (css.sourceMap)
                            details['sourceMap'] = css.sourceMap;

                        callback(details);
                    }

                    done(null, new Buffer(css.styles));
                });
            });

            run(file, function (err, contents) {

                if (err) {
                    self.emit('error', new PluginError('gulp-clean-css', err, {fileName: file.path}));
                } else {
                    file.contents = contents;
                    self.push(file);
                }
                cb();
            });
        }
    });
};
