# grunt-build-node-webkit-app

> Another task for creation of Node-Webkit apps, uncompressed.

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-build-node-webkit-app --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-build-node-webkit-app');
```

## The tasks

### Overview
In your project's Gruntfile, add a section named `build_node_webkit` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  build_node_webkit: {
    targetDir: "dist",
    nwVersion: "0.9.2",
    distFiles: ['./node_modules/**', "package.json", 'index.html'],
    name: "my-awesome-app"
  },
});
```

### Options

#### targetDir
Type: `String`
Default value: `'dist'`

The directory where the final files will be written.

#### nwVersion
Type: `String`
Default value: `'0.9.2'`

The version of Node Webkit that will be used.

#### distFiles
Type: `Files`
Default value: []

The files that will be included in the build.

#### name
Type: `String`
Default value: `''`

The name of the resulting app.

### Usage Examples

#### Building for all platforms

```js
  grunt.registerTask('dist', ['bundle-node-webkit-app-mac', 'bundle-node-webkit-app-win',
  'bundle-node-webkit-app-linux32', 'bundle-node-webkit-app-linux64']);
```

#### Building only for Windows

```js
  grunt.registerTask('dist', ['bundle-node-webkit-app-win']);
```

and so forth...


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Lint your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
