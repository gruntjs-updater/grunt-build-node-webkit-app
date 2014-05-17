/*
 * grunt-build-node-webkit-app
 * https://github.com/jhbruhn/grunt-build-node-webkit-app
 *
 * Copyright (c) 2014 Jan-Henrik Bruhn
 * Licensed under the MIT license.
 */

'use strict';

var wrench        = require('wrench'),
    http          = require('http'),
    url           = require('url'),
    fs            = require('fs'),
    ProgressBar   = require('progress'),
    DecompressZip = require('decompress-zip'),
    tar           = require('tar-fs'),
    zlib          = require('zlib'),
    archiver      = require('archiver');

var name = "build_node_webkit";

var nwFormats = {
  "osx": "zip",
  "win": "zip",
  "linux": "tar.gz"
};

var downloadFile = function(targetFile, remoteUrl, done) {
  var parsed = url.parse(remoteUrl);

  var req = http.request({
    host: parsed.hostname,
    port: 80,
    path: parsed.path
  });

  req.on('response', function(res){
    var len = parseInt(res.headers['content-length'], 10);
    res.pipe(fs.createWriteStream(targetFile));
    console.log();
    var bar = new ProgressBar('  downloading [:bar] :percent :etas', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: len
    });

    res.on('data', function (chunk) {
      bar.tick(chunk.length);
    });

    res.on('end', function () {
      done();
    });
  });

  req.end();
};

var zipFolder = function(folder, cwd, targetFile, cb) {
  var output = fs.createWriteStream(targetFile);
  var archive = archiver('zip');

  output.on('close', function() {
    cb();
  });

  archive.on('error', function(err) {
    cb(err);
  });

  archive.pipe(output);
  archive.bulk([
      {
        src: ["**/*", "!nwsnapshot*", "!credits.html"],
        cwd: __dirname + "/" + folder,
        expand: true
      }
    ]);

  archive.finalize();

};

function getNodeWebkitDownloadURL(osName, archName, version, format) {
  return "http://dl.node-webkit.org/v" + version + "/node-webkit-v" + version + "-" + osName + "-" + archName + "." + format;
}

function getLocalNodeWebkitDownloadPath(targetfolder, os, arch, format, version) {
  return targetfolder + '/cache' + "/node-webkit." + os + "." + arch + "." + version + "." + format;
}


module.exports = function(grunt) {
  grunt.registerTask('download-node-webkit', function(os, arch) {
    var done = this.async();
    var format = nwFormats[os];
    var targetFolder1 = grunt.config([name, 'targetDir']) || 'dist/';
    var nodeWebkitVersion = grunt.config([name, 'nwVersion']) || '0.9.2';
    var targetFolder = targetFolder1 + "/cache";
    var targetFile = getLocalNodeWebkitDownloadPath(targetFolder1, os, arch, format, nodeWebkitVersion);
    var remoteUrl = getNodeWebkitDownloadURL(os, arch, nodeWebkitVersion, format);

    wrench.mkdirSyncRecursive(targetFolder);

    if(fs.existsSync(targetFile)) {
      grunt.log.writeln('skip download: file exists: ' + targetFile);
      done();
      return;
    }

    grunt.log.writeln('Starting download.');
    downloadFile(targetFile, remoteUrl, done);
  });

  grunt.registerTask('download-node-webkit-mac', ['download-node-webkit:osx:ia32']);
  grunt.registerTask('download-node-webkit-win', ['download-node-webkit:win:ia32']);
  grunt.registerTask('download-node-webkit-linux32', ['download-node-webkit:linux:ia32']);
  grunt.registerTask('download-node-webkit-linux64', ['download-node-webkit:linux:x64']);

  grunt.registerTask('bundle-node-webkit-app', function(os, arch) {
    var done = this.async();

    var distFiles = grunt.config([name, "distFiles"]);
    var format = nwFormats[os];
    var nodeWebkitVersion = grunt.config([name, 'nwVersion']) || '0.9.2';

    var targetFolder = grunt.config([name, 'targetDir']) || 'dist/';

    var appName = grunt.config([name, "name"]) || "app";
    var osxName = grunt.config([name, "osxName"]) || "app";

    var targetPath = targetFolder + '/' + appName + "-" + os + "-" + arch;
    grunt.file.delete(targetPath); // Delete all da filez.
    var filename = getLocalNodeWebkitDownloadPath(targetFolder, os, arch, format, nodeWebkitVersion);

    if(format === "zip") {
      var unzipper = new DecompressZip(filename);

      unzipper.on('error', function(err) {
        done(err);
      });

      unzipper.on('extract', function(log) {
        if(os === "osx") {
          grunt.file.expand(distFiles).forEach(function(file) {
            if(grunt.file.isDir(file)) {
              grunt.file.mkdir(file);
            } else {
              grunt.file.copy(file, targetPath + "/node-webkit.app/Contents/Resources/app.nw/" + file);
            }
          });
          fs.renameSync(targetPath + "/node-webkit.app/", targetPath + "/" + osxName + ".app");

          wrench.chmodSyncRecursive(targetPath, '0755');
        } else if(os === "win") {
          grunt.file.expand(distFiles).forEach(function(file) {
            if(grunt.file.isDir(file)) {
              grunt.file.mkdir(file);
            } else {
              grunt.file.copy(file, targetPath + "/" + file);
            }
          });
        }
        zipFolder(targetPath, targetFolder + "/", targetFolder + "/"  + appName + "-" + os + "-" + arch + ".zip", done);

      });

      unzipper.extract({
        path: targetPath
      });
    } else if (format === 'tar.gz') {
      fs.createReadStream(filename)
        .pipe(zlib.createGunzip())
        .pipe(tar.extract(targetPath))
        .on('finish', function() {
          var decompressedDir = targetPath + '/node-webkit-v' + nodeWebkitVersion + "-" + os + "-" + arch + "/";

          fs.readdirSync(decompressedDir).forEach(function(file) {
            grunt.file.copy(decompressedDir + file, targetPath + '/' + (file));
          });

          wrench.rmdirSyncRecursive(decompressedDir);
          grunt.file.expand(distFiles).forEach(function(file) {
            if(grunt.file.isDir(file)) {
              grunt.file.mkdir(file);
            } else {
              grunt.file.copy(file, targetPath + "/" + file);
            }
          });
          wrench.chmodSyncRecursive(targetPath, '0755');
          zipFolder(targetPath, targetFolder + "dist/", targetFolder + "/" + appName + "-" + os + "-" + arch + ".zip", done);
        });
    }
  });

  grunt.registerTask('bundle-node-webkit-app-mac', ['download-node-webkit-mac', 'bundle-node-webkit-app:osx:ia32']);
  grunt.registerTask('bundle-node-webkit-app-win', ['download-node-webkit-win','bundle-node-webkit-app:win:ia32']);
  grunt.registerTask('bundle-node-webkit-app-linux32', ['download-node-webkit-linux32','bundle-node-webkit-app:linux:ia32']);
  grunt.registerTask('bundle-node-webkit-app-linux64', ['download-node-webkit-linux64','bundle-node-webkit-app:linux:x64']);
};
