"use strict";

var Eyeglass = require("../lib");
var VERSION = Eyeglass.VERSION;
var assert = require("assert");
var testutils = require("./testutils");
var path = require("path");
var semver = require("semver");

describe("options", function() {
  beforeEach(function(done) {
    process.env.SASS_PATH = "";
    done();
  });

  it("should not contain a circular reference to itself", function(done) {
    var rootDir = testutils.fixtureDirectory("app_with_malformed_module");
    var options = {root: rootDir};
    var eyeglass = new Eyeglass(options);
    var sassopts = eyeglass.options;
    assert(sassopts.eyeglass);
    assert.notEqual(eyeglass, sassopts.eyeglass);
    done();
  });

  it("uses the SASS_PATH environment variable as a default for includePaths", function(done) {
    process.env.SASS_PATH = "foo:bar:baz";

    var rootDir = testutils.fixtureDirectory("basic_modules");
    var options = {root: rootDir};
    var eyeglass = new Eyeglass(options);
    var sassopts = eyeglass.options;
    assert.equal(sassopts.includePaths[0], path.resolve(process.cwd(), "foo"));
    assert.equal(sassopts.includePaths[1], path.resolve(process.cwd(), "bar"));
    assert.equal(sassopts.includePaths[2], path.resolve(process.cwd(), "baz"));
    done();
  });

  it("defaults includePaths to empty array", function(done) {
    assert.equal(process.env.SASS_PATH, "");
    var rootDir = testutils.fixtureDirectory("basic_modules");
    var options = {root: rootDir};
    var eyeglass = new Eyeglass(options);
    var sassopts = eyeglass.options;
    assert.equal(sassopts.includePaths.length, 0);
    done();
  });

  it("works with the indented syntax", function(done) {
    var rootDir = testutils.fixtureDirectory("basic_modules");
    var data = ".foo\n  bar: baz";
    var options = {root: rootDir, indentedSyntax: true, data: data};
    var eyeglass = new Eyeglass(options);
    var expectedOutput = ".foo {\n  bar: baz; }\n";

    testutils.assertCompiles(eyeglass.options, expectedOutput, done);
  });

  it("should normalize includePaths", function () {
    var includePaths = ["path/one", "path/two", "path/three"];
    var rootDir = testutils.fixtureDirectory("app_assets");
    var eyeglass = new Eyeglass({
      root: rootDir,
      includePaths: includePaths.join(":")
    });
    var sassopts = eyeglass.options;
    assert(sassopts);
    assert.deepEqual(sassopts.includePaths, includePaths.map(function(p){
      return path.resolve(rootDir, p);
    }));
  });

  it("should disable deprecation warnings via an option", function(done) {
    testutils.assertStderr(function(checkStderr) {
      var rootDir = testutils.fixtureDirectory("basic_modules");
      var options = {
        root: rootDir,
        eyeglass: {
          ignoreDeprecations: semver.inc(VERSION, "minor")
        }
      };
      var eyeglass = new Eyeglass.Eyeglass(options);
      /* eslint no-unused-vars:0 */
      var sassopts = eyeglass.sassOptions();
      checkStderr("");
      done();
    });
  });

  it("should enable deprecation warnings via an option", function(done) {
    testutils.assertStderr(function(checkStderr) {
      var rootDir = testutils.fixtureDirectory("basic_modules");
      var options = {
        root: rootDir,
        eyeglass: {
          ignoreDeprecations: "0.7.1"
        }
      };
      var eyeglass = new Eyeglass.Eyeglass(options);
      /* eslint no-unused-vars:0 */
      var sassopts = eyeglass.sassOptions();
      checkStderr([
        "[eyeglass:deprecation] (deprecated in 0.8.0, will be removed in 0.9.0) `root` " +
        "should be passed into the eyeglass options rather than the sass options:",
        "  var options = eyeglass({",
        "    /* sassOptions */",
        "    ...",
        "    eyeglass: {",
        "      root: ...",
        "    }",
        "  });",
        "[eyeglass:deprecation] (deprecated in 0.8.0, will be removed in 0.9.0) " +
        "`require('eyeglass').Eyeglass` is deprecated. Instead, use `require('eyeglass')`",
        "[eyeglass:deprecation] (deprecated in 0.8.0, will be removed in 0.9.0) " +
        "#sassOptions() is deprecated. Instead, you should access the sass options on #options\n"
      ].join("\n"));
      done();
    });
  });

  describe("deprecated interface", function() {
    it("should support `new Eyeglass.Eyeglass` with warning", function(done) {
      testutils.assertStderr(function(checkStderr) {
        var eyeglass = new Eyeglass.Eyeglass();
        checkStderr(
          "[eyeglass:deprecation] (deprecated in 0.8.0, will be removed in 0.9.0) " +
          "`require('eyeglass').Eyeglass` is deprecated. Instead, use `require('eyeglass')`\n"
        );
        done();
      });
    });

    it("should support `Eyeglass.decorate` with warning", function(done) {
      testutils.assertStderr(function(checkStderr) {
        var eyeglass = Eyeglass.decorate();
        checkStderr(
          "[eyeglass:deprecation] (deprecated in 0.8.0, will be removed in 0.9.0) " +
          "`require('eyeglass').decorate` is deprecated. Instead, use `require('eyeglass')`\n"
        );
        done();
      });
    });

    it("should support `#sassOptions` method with warning", function(done) {
      testutils.assertStderr(function(checkStderr) {
        var eyeglass = new Eyeglass();
        /* eslint no-unused-vars:0 */
        var options = eyeglass.sassOptions();
        checkStderr(
          "[eyeglass:deprecation] (deprecated in 0.8.0, will be removed in 0.9.0) " +
          "#sassOptions() is deprecated. Instead, you should access the sass options on #options\n"
        );
        done();
      });
    });

    it("should warn on eyeglass options not in namespace", function(done) {
      function expectedOptionsWarning(option) {
        return [
          "[eyeglass:deprecation] (deprecated in 0.8.0, will be removed in 0.9.0) `" +
          option + "` should be passed into the eyeglass options rather than the sass options:",
          "var options = eyeglass({",
          "  /* sassOptions */",
          "  ...",
          "  eyeglass: {",
          "    " + option + ": ...",
          "  }",
          "});"
        ].join("\n  ");
      }

      testutils.assertStderr(function(checkStderr) {
        var eyeglass = new Eyeglass({
          root: __dirname,
          cacheDir: ".cache",
          buildDir: "dist",
          httpRoot: "root",
          assetsHttpPrefix: "prefix",
          assetsRelativeTo: "relative",
          strictModuleVersions: true
        });
        checkStderr([
          expectedOptionsWarning("root"),
          expectedOptionsWarning("cacheDir"),
          expectedOptionsWarning("buildDir"),
          expectedOptionsWarning("httpRoot"),
          expectedOptionsWarning("assetsHttpPrefix"),
          expectedOptionsWarning("assetsRelativeTo"),
          expectedOptionsWarning("strictModuleVersions")
        ].join("\n") + "\n");
        done();
      });
    });

    it("should warn when setting properties directly on eyeglass instance", function(done) {
      function expectedOptionsWarning(option) {
        return [
          "[eyeglass:deprecation] (deprecated in 0.8.0, will be removed in 0.9.0) `" +
          option + "` should be passed into the eyeglass options rather than the sass options:",
          "var options = eyeglass({",
          "  /* sassOptions */",
          "  ...",
          "  eyeglass: {",
          "    " + option + ": ...",
          "  }",
          "});"
        ].join("\n  ");
      }

      testutils.assertStderr(function(checkStderr) {
        var eyeglass = new Eyeglass();
        eyeglass.enableImportOnce = false;
        checkStderr([
          "[eyeglass:deprecation] (deprecated in 0.8.0, will be removed in 0.9.0) " +
          "The property `enableImportOnce` should no longer be set directly on eyeglass. " +
          "Instead, you should pass this as an option to eyeglass:",
          "  var options = eyeglass({",
          "    /* sassOptions */",
          "    ...",
          "    eyeglass: {",
          "      enableImportOnce: ...",
          "    }",
          "  });"
        ].join("\n") + "\n");
        done();
      });
    });
  });
});
