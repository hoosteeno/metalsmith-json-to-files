/* eslint-env mocha */

'use strict';

// Remove when 0.12 is no longer needed to be supported
require('harmonize')();

var expect        = require('chai').expect;
var equal         = require('assert-dir-equal');
var Metalsmith    = require('metalsmith');
var templates     = require('metalsmith-templates');
var json_to_files = require('../lib');


describe('metalsmith-json-to-files basic', function () {

    var test_path = 'test/fixtures/basic';

    it('should fail without source_path', function (done) {

        new Metalsmith(test_path)
        .use(json_to_files())
        .build(function (err) {

            expect(err).to.be.an('error');
            done();
        });
    });

    ['yaml', 'json'].forEach(function (filetype) {
        it('should do standard file copying from ' + filetype + 'files', function (done) {

            new Metalsmith(test_path)
            .source(filetype + '_src')
            .use(json_to_files({
                source_path: '../' + filetype + '/'
            }))
            .build(function (err) {
                if (err) { return done(err); }

                equal(test_path + '/expected', test_path + '/build');
                done();
            });
        });
    });


});


describe('metalsmith-json-to-files file generation', function () {

    var test_path = 'test/fixtures/file_generation';

    ['yaml', 'json'].forEach(function (filetype) {
        it('should do basic file generation from ' + filetype + 'files', function (done) {

            new Metalsmith(test_path)
            .source(filetype + '_src')
            .use(json_to_files({
                source_path: '../' + filetype + '/'
            }))
            .build(function (err) {
                if (err) { return done(err); }

                equal(test_path + '/expected', test_path + '/build');
                done();
            });
        });
    });
});


describe('metalsmith-json-to-files file generation with permalinks', function () {

    var test_path = 'test/fixtures/file_generation_permalinks';

    ['yaml', 'json'].forEach(function (filetype) {
        it('should do basic file generation from ' + filetype + 'files', function (done) {

            new Metalsmith(test_path)
            .source(filetype + '_src')
            .use(json_to_files({
                source_path: '../' + filetype + '/'
            }))
            .build(function (err) {
                if (err) { return done(err); }

                equal(test_path + '/expected', test_path + '/build');
                done();
            });
        });
    });
});


describe('metalsmith-json-to-files file generation with templates', function () {

    var test_path = 'test/fixtures/hbs_templates';

    ['yaml', 'json'].forEach(function (filetype) {
        it('should do basic file generation from ' + filetype + 'files', function (done) {

            new Metalsmith(test_path)
            .source(filetype + '_src')
            .use(json_to_files({
                source_path: '../' + filetype + '/'
            }))
            .use(templates({
                engine   : 'handlebars'
              , directory: 'templates'
            }))
            .build(function (err) {
                if (err) { return done(err); }

                equal(test_path + '/expected', test_path + '/build');
                done();
            });
        });
    });
});

describe('metalsmith-json-to-files Tests', function () {
    it('should handle missing json file');
    it('should handle filename not being able to be generated');
    it('should create permalinks');
    it('should work with (handlebars) templates');
});
