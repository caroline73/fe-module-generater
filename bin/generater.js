#!/usr/bin/env node

var ejs = require('ejs');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var program = require('commander');
var readline = require('readline');
var util = require('util');

var MODE_0666 = parseInt('0666', 8)
var MODE_0755 = parseInt('0755', 8)

var _exit = process.exit;
var pkg = require('../package.json');
var version = pkg.version;

// Re-assign process.exit because of commander
// TODO: Switch to a different command framework
process.exit = exit;

//CLI

program
  .version(version, '  --version')
  .usage('[options] [dir]')
  .option('-d --demo', 'add demo dir support', renamedOption('--demo', '--view=demo'))
  .option('    --hbs', 'add handlebars engine support', renamedOption('--hbs', '--view=hbs'))
  .option('-v, --view <engine>', 'add view <engine> support (dust|ejs|hbs|hjs|jade|pug|twig|vash) (defaults to hbs)')
  .option('    --git', 'add .gitignore')
  .option('-f, --force', 'force on non-empty directory')
  .parse(process.argv)

if (!exit.exited) {
  main();
}

/**
*Main program
*/
function main() {
  // Path input path or .
  var destinationPath = program.args.shift() || '.';
  // App name
  var appName = createAppName(path.resolve(destinationPath)) || 'hello-world';

  //View
  if (program.view == undefined) {
    if (program.hbs) {
      program.view = 'hbs';
    }
  }
  // Default view engine
  if (program.view === undefined) {
    warning('the default view engine will not be hbs in future releases\n' +
      "use `--view=hbs' or `--help' for additional options")
    program.view = 'hbs'
  }
  // Generate application
  emptyDirectory(destinationPath, function(empty) {
    if (empty || program.force) {
      createApplication(appName, destinationPath);
    } else {
      confirm('destination is not empty, continue? [Y/N] ', function (ok) {
        if (ok) {
          process.stdin.destroy();
          createApplication(appName, destinationPath);
        } else {
          console.error('aborting');
          exit(1);
        }
      });
    }
  });
}

/**
 * Display a warning similar to how errors are displayed by commander.
 *
 * @param {String} message
 */
 function warning (message) {
  console.error();
  message.split('\n').forEach(function (line) {
    console.error('  warning: %s', line);
  });
  console.error();
 }

/**
 * Determine if launched from cmd.exe
 */

function launchedFromCmd () {
  return process.platform === 'win32' &&
    process.env._ === undefined
}

/**
 * Create application at the given directory `path`.
 *
 * @param {String} path
 */
 function createApplication(name, path) {
  var wait = 5;
  function complete() {
    if (--wait) {
      return;
    }
    console.log();
    var prompt = launchedFromCmd() ? '>' : '$';
    console.log('   install dependencies:');
    console.log('     %s cd %s && npm install', prompt, path);
    console.log();
    console.log('   run the app:');
    if (launchedFromCmd()) {
      console.log('     %s SET DEBUG=%s:* & npm start', prompt, name);
    } else {
      console.log('     %s DEBUG=%s:* npm start', prompt, name);
    }
    console.log();
  }
  // JavaScript
  // var app = loadTemplate('js/app.js');
  // var www = loadTemplate('js/www');

  //readme
  var readme = loadTemplate('md/README.md');

  // App name
  // www.locals.name = name

  // App modules
  // app.locals.modules = Object.create(null);
  // app.locals.uses = [];

  mkdir(path, function () {
    mkdir(path + '/src', function () {
      mkdir(path + '/src/img');
      mkdir(path + '/src/modules', function () {
        switch (program.css) {
          case 'less': 
          copyTemplate('css/style.less', path + '/src/index.less');
          break;
          default: 
          copyTemplate('css/style.css', path + '/src/index.css');
        }
      });

    });
  });
 }

/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 */
 function write (path, str, mode) {
  fs.writeFileSync(path, str, { mode: mode || MODE_0666 });
  console.log('   \x1b[36mcreate\x1b[0m : ' + path);
 } 

/**
 * Copy file from template directory.
 */
function copyTemplate (from, to) {
  from = path.join(__dirname, '..', 'templates', from);
  write(to, fs.readFileSync(from, 'utf-8'));
}

/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */
 function mkdir (path, fn) {
  mkdirp(path, MODE_0755, function (err) {
    if (err) {
      throw err;
    }
    console.log('   \x1b[36mcreate\x1b[0m : ' + path);
    fn && fn();
  });
 }

 /**
 * Load template file.
 */
function loadTemplate (name) {
  // var contents = fs.readFileSync(path.join(__dirname, '..', 'templates', (name + '.ejs')), 'utf-8');
  var contents = fs.readFileSync(path.join(__dirname, '..', 'templates', name), 'utf-8');
  var locals = Object.create(null)
  function render () {
    return ejs.render(contents, locals)
  }
  return {
    locals: locals,
    render: render
  }
}

/**
* 
*/
function confirm(msg, callback) {
  var r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  r1.question(msg, function (input) {
    r1.close();
    callback(/^y|yes|ok|true$/i.test(input));
  });
}

/**
*Check if the given directory 'path' is empty
×
*/
function emptyDirectory(path, fn) {
  fs.readdir(path, function(err, files) {
    if (err && err.code !== 'ENOENT') {
      throw err;
    }
    fn(!files || !files.length);
  })
}

/**
 * Graceful exit for async STDIO
 */
function exit(code) {
  // flush output for Node.js Windows pipe bug
  // https://github.com/joyent/node/issues/6247 is just one bug example
  // https://github.com/visionmedia/mocha/issues/333 has a good discussion
  function done() {
    if (!(draining--)) {
      _exit(code);
    }
  }

  var draining = 0;
  var stream = [process.stdout, process.stderr];

  exit.exited = true;

  streams.forEach(function (stream) {
    // submit empty write request and wait for completion
    draining += 1;
    stream.write('', done);
  });

  done();
}

function createAppName() {

}

/**
 * Generate a callback function for commander to warn about renamed option.
 *
 * @param {String} originalName
 * @param {String} newName
 */
function renamedOption(originName, newName) {
  return function (val) {
    warning(util.format("option `%s' has been renamed to `%s'",  originalName, newName));
    return val;
  }
}

/**
*Install an around function
*/
function around(obj, method, fn) {

}



