'use strict';

/* eslint no-cond-assign: 1 */

var debug = require('debug');
var log   = debug('metalsmith-json-to-files');
var error = debug('metalsmith-json-to-files:error');

var _    = require('lodash');
var joi  = require('joi');
var each = require('async').each;
var path = require('path');
var slug = require('slug-component');
var yaml = require('js-yaml');
var fs = require('fs');

var resolve = _.get;


/**
 * Builds a filename out of a pattern if provided.
 * e.g.
 *   :collection/:fields.slug
 *   might return: 'pages/about'
 *
 * @param {String} filename_pattern
 * @param  {Object} entry
 * @param {String} extension File extension
 *
 * @return {String}
 */
var build_filename = function build_filename (filename_pattern, entry, extension) {

    log('Building Filename from: %s', filename_pattern);

    extension = extension || '.html';
    // Default filename
    var filename = 'not_found' + extension;


    /**
     * Get the params from a `pattern` string.
     *
     * @param {String} pattern
     * @return {Array}
     */
    var get_params = function get_params (pattern) {
        /* eslint no-cond-assign: 0 */
        var matcher = /:([\w]+(\.[\w]+)*)/g;
        var ret = [];
        var m;
        while (m = matcher.exec(pattern)) {
            ret.push(m[1]);
        }
        return ret;
    };


    if (entry.filename_pattern) {
        var pattern = entry.filename_pattern;
        var params = get_params(pattern);

        params.forEach(function (element) {
            var replacement = resolve(entry, element);
            if (replacement) {
                pattern = pattern.replace(':' + element, slug(replacement.toString()));
            }
        });

        // Check all have been processed
        if (get_params(pattern).join('') === '') {
            filename = (entry.as_permalink) ? pattern + '/index' + extension : pattern + extension;
        }
        else {
            throw new TypeError("Couldn't build filename from: " + pattern);
        }
    }
    return filename;
};

var options_schema = {
    source_path         : joi.string().required()
  , properties_to_remove: joi.array()
};

var metadata_schema = {
    source_file     : joi.string().required()
  , filename_pattern: joi.string().required()
  , as_permalink    : joi.boolean()
};

var metadata_schema_options = {
    allowUnknown: true
};


/**
 * Metalsmith Plugin: Make files from a JSON/YAML source
 *
 * @param  {Object} options
 * @param  {String} options.source_path Path for source JSON/YAML files - Required
 *
 * @return {Function}         Gets used by Metalsmith with .use
 */
var plugin = function plugin (options) {
    options = options || {};
    log('Options: %o', options);

    var properties_to_remove = options.properties_to_remove || Object.keys(metadata_schema);

    return function (files, metalsmith, done) {
        var keys = Object.keys(files);

        joi.validate(options, options_schema, function (err) {
            if (err) {
                error(err);
                done(new Error(err));
            }
        });


        /**
         * Uses the config from the source file and retrieves JSON/YAML data to produce files
         *
         * @param  {String} file
         *
         * @return {Void} Appends to files var.
         */
        var process_file = function process_file (file) {

            var file_meta = files[file];
            var filetype = '';

            if (file_meta.json_files) {
                log('Making files from json');
                filetype = 'json';
            }
            else if (file_meta.yaml_files) {
                log('Making files from yaml');
                filetype = 'yaml';
            }
            else {
                // metadata config is not present so don't proceed.
                log('No json_files or yaml_files metadata for %s', file);
                return;
            }

            var metaparam = filetype + '_files';

            // Validate metadata params
            joi.validate(file_meta[metaparam], metadata_schema, metadata_schema_options, function (err) {
                if (err) {
                    error(err);
                    done(new Error(err));
                }
            });

            var source_filepath = path.resolve(metalsmith.directory(), options.source_path + file_meta[metaparam].source_file + '.' + filetype);
            var doc = [];

            try {
                if (filetype === 'yaml') {
                    doc = yaml.safeLoad(fs.readFileSync(source_filepath));
                }
                else {
                    fs.accessSync(source_filepath, fs.F_OK);
                    doc = require(source_filepath);
                }
            }
            catch (e) {
                log('Error processing ' + file + ': ' + e);
            }

            // log('File contents: %o', doc);
            doc.forEach(function (element) {
                var defaults = {contents: ''};
                var meta     = file_meta[metaparam];
                var data     = _.extend(defaults, meta, {data: element});

                // Take into account the parent in build filename
                var filename = build_filename(data.filename_pattern, data);

                // Remove properties that are no longer needed.
                properties_to_remove.forEach(function (property_to_remove) {
                    delete data[property_to_remove];
                });

                files[filename] = data;
            });
        };

        // Process through each of the files
        each(keys, process_file);
        done();
    };
};

module.exports = plugin;
