#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var readline = require('readline');
var mkdirp = require('mkdirp');
var program = require('commander');
var util = require('util');

var MODE_0666 = parseInt('0666', 8)
var MODE_0755 = parseInt('0755', 8)

var pkg = require('../package.json');
var version = pkg.version;

program
  .version(version, '    --version')
  .usage('<dir> [options] ')
  .arguments('<dir>')
  .action(function (dir) {
     dirValue = dir;
  })
  .description('<dir> must be input')
  .option('    --git', 'add .gitignore')
  .option('-f, --force', 'force on non-empty directory')
  .parse(process.argv)

if (typeof dirValue == 'undefined') {
  console.error('must be input dir name!\n');
  console.error('example:\n');
  console.error('generater dir')
  process.exit(1);
}

main();

var rlp = readline.createInterface({
  input:process.stdin,
  output:process.stdout
});

function read(question, callback) {
  return function() {
    return new Promise((resolve,reject) => {
      rlp.question(question, function(answer){
          callback(/^y|yes|ok|true$/i.test(answer));
          resolve(answer);
      });
    });
  };
}

function close() {
  return rlp.close();
}

function compose(...args) {
  return args.reduce((a, b) => {
    return function() {
      return a().then(() => {
        return b();
      });
    };
  });
}

function delDir(path) {
  var files = [];
  files = fs.readdirSync(path);
  files.forEach(function (file, index) {
    var curPath = path + '/' + file;
    if (fs.statSync(curPath).isDirectory()) {
      delDir(curPath);
    } else {
      fs.unlinkSync(curPath);
    }
  });
  fs.rmdirSync(path);
}

function main() {
  var destinationPath = program.args.shift() || '.';
  var appName = createAppName(path.resolve(destinationPath));
  var step1 = read('do you need test, continue? [y/N] ', function (ok) {
    if (ok) {
      program.test = true;
    }
  });
  var step2 = read('do you need demo, continue? [y/N] ', function (ok) {
    if (ok) {
      program.demo = true;
    }
  });
  var a = compose(step1, step2);
  emptyDirectory(destinationPath, function(empty) {
    var step3 = read('destination is not empty, continue? [y/N] ', function(ok) {
      if (ok) {
        delDir(destinationPath);
        createApplication(appName, destinationPath);
      } else {
        console.error('aborting');
        process.exit(1);
      }
    });
    if (empty || program.force) {
      compose(a, close)().then(() => {
        createApplication(appName, destinationPath);
      });
    } else {
      compose(a, step3, close)();
    }
  });
}

function warning (message) {
  message.split('\n').forEach(function (line) {
    console.error('  warning: %s', line);
  });
}

function launchedFromCmd () {
  return process.platform === 'win32' &&
    process.env._ === undefined
}

function createApplication(name, path) {
  mkdir(path, function () {
    // test
    if (program.test) {
      mkdir(path + '/test');
    }
    // demo
    if (program.demo) {
      mkdir(path + '/demo', function () {
        copyTemplate('html/index.html', path + '/demo/index.html');
      });
    }
    if (program.git) {
      copyTemplate('js/gitignore', path + '/.gitignore')
    }
    // src
    mkdir(path + '/src', function () {
      mkdir(path + '/src/img');
      mkdir(path + '/src/modules', function () {
        // index.less/index.css
        switch (program.css) {
          case 'css': 
          copyTemplate('css/style.css', path + '/src/index.css');
          break;
          default: 
          copyTemplate('css/style.less', path + '/src/index.less');
          break;
        }
      });
    });
    // index.js
    copyTemplate('js/index.js', path + '/src/index.js');
    // README
    copyTemplate('md/README.md', path + '/README.md');
    //.eslintrc
    copyTemplate('eslint/eslintrc', path + '/.eslintrc');
    //.babelrc
    copyTemplate('babel/babelrc', path + '/.babelrc');
    // package.json
    var pkg = {
      "name": name,
      "version": "0.0.0",
      "main": 'dist/index.js',
      "scripts": {
        "test": ''
      },
      "dependencies": {
      },
      "devDependencies": {
        "babel-loader": "7.0.0",
        "babel-core": "6.25.0",
        "babel-preset-es2015": "6.24.1",
      }
    }
    // write files
    write(path + '/package.json', JSON.stringify(pkg, null, 2) + '\n');
  });
}

function write(path, str, mode) {
  fs.writeFileSync(path, str, { mode: mode || MODE_0666 });
  console.log('   \x1b[36mcreate\x1b[0m : ' + path);
} 

function copyTemplate(from, to) {
  from = path.join(__dirname, '..', 'templates', from);
  write(to, fs.readFileSync(from, 'utf-8'));
}

 function mkdir(path, fn) {
  mkdirp(path, MODE_0755, function (err) {
    if (err) {
      throw err;
    }
    console.log('   \x1b[36mcreate\x1b[0m : ' + path);
    fn && fn();
  });
 }

function loadTemplate(name) {
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

function emptyDirectory(path, fn) {
  fs.readdir(path, function(err, files) {
    if (err && err.code !== 'ENOENT') {
      throw err;
    }
    fn(!files || !files.length);
  })
}

function createAppName(pathName) {
  return path.basename(pathName)
    .replace(/[^A-Za-z0-9.()!~*'-]+/g, '-')
    .replace(/^[-_.]+|-+$/g, '')
    .toLowerCase()
}

