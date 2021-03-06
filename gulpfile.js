/**
 *  Welcome to your gulpfile!
 *  The gulp tasks are splitted in several files in the gulp directory
 *  because putting all here was really too long
 */

'use strict';

var gulp = require('gulp');
var fse = require('fs-extra');
var minimist = require('minimist');
var runSequence = require('run-sequence');
var bump = require('gulp-bump');
var fs = require('fs');
var gutil = require('gulp-util');
var git = require('gulp-git');
var conventionalChangelog = require('gulp-conventional-changelog');
var conventionalGithubReleaser = require('conventional-github-releaser');
var release = require('gulp-github-release');

/**
 *  This will load all js or coffee files in the gulp directory
 *  in order to load all gulp tasks
 */
fse.walkSync('./gulp').filter(function (file)
    {
        return (/\.(js|coffee)$/i).test(file);
    }
).map(function (file)
    {
        require('./' + file);
    }
);


/*wrench.readdirSyncRecursive('./gulp').filter(function(file) {
 return (/\.(js|coffee)$/i).test(file);
 }).map(function(file) {
 require('./gulp/' + file);
 });*/


/**
 *  Default task clean temporaries directories and launch the
 *  main optimization build task
 */
gulp.task('default', ['clean'], function ()
{
    gulp.start('build');
});


// var knownOptions = {
//     boolean: ['major', 'minor', 'patch','prerelease'],
//     default: 
//     {
//         major: false, 
//         minor: false, 
//         patch: false,
//         prerelease: true
//     }
// };

// var options = minimist(process.argv.slice(2), knownOptions);
// console.log(options);
// var options = {
//     major: 'major', 
//     minor: 'minor', 
//     patch: 'patch',
//     prerelease: 'prerelease'
// }

// gulp.task('version', function () {
//     var src = gulp.src(['./bower.json', './package.json']);
//     // Do patch by default
//     var stage = null;
    
//     if (options.major) {
//         stage = src.pipe(bump({type: 'major'}).on('error', gutil.log));
//     } else if (options.minor) {
//         stage = src.pipe(bump({type: 'minor'}).on('error', gutil.log));
//     } else {
//         stage = src.pipe(bump({type: 'patch'}).on('error', gutil.log));
//     }
        
//     return stage.pipe(gulp.dest('./'));
// });

gulp.task('patch-version', function () {
    // We hardcode the version change type to 'patch' but it may be a good idea to
    // use minimist (https://www.npmjs.com/package/minimist) to determine with a
    // command argument whether you are doing a 'major', 'minor' or a 'patch' change.
      return gulp.src(['./bower.json','./package.json'])
        .pipe(bump({type: "patch"}).on('error', gutil.log))
        .pipe(gulp.dest('./'));
});
gulp.task('prerelease-version', function () {
    // We hardcode the version change type to 'patch' but it may be a good idea to
    // use minimist (https://www.npmjs.com/package/minimist) to determine with a
    // command argument whether you are doing a 'major', 'minor' or a 'patch' change.
      return gulp.src(['./bower.json','./package.json'])
        .pipe(bump({type: "prerelease"}).on('error', gutil.log))
        .pipe(gulp.dest('./'));
});

gulp.task('patch-commit-changes', function () {
    var kind = 'patch';
    
    
    // if (options.major) {
    //     kind = 'major';
    // } else if (options.minor) {
    //     kind = 'minor';
    // }
    
    var version = JSON.parse(fs.readFileSync('package.json')).version;
    var msg = 'chore(release): Release ' + kind + ' version (' + version + ')';

    return gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit(msg));
});

gulp.task('prerelease-commit-changes', function () {
    var kind = 'prerelease';
    
    
    // if (options.major) {
    //     kind = 'major';
    // } else if (options.minor) {
    //     kind = 'minor';
    // }
    
    var version = JSON.parse(fs.readFileSync('package.json')).version;
    var msg = 'chore(release): Release ' + kind + ' version (' + version + ')';

    return gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit(msg));
});

gulp.task('changelog', function () {
    return gulp.src('CHANGELOG.md', {
        buffer: false
    })
    .pipe(conventionalChangelog({
        preset: 'cniguard',
        outputUnreleased: true,
        releaseCount: 0
    }, {    // CHANGE: Put your github repository info
        host: 'https://github.com',
        owner: 'narendhar11',
        repository: 'gulp-release'
    }))
    .pipe(gulp.dest('./'));
});

gulp.task("commit-changelog", ["changelog"], function() {
    return gulp.src("CHANGELOG.md")
        .pipe(git.add())
        .pipe(git.commit("doc(changelog): Changelog up to date"));
});

gulp.task('push-changes', function (cb) {
    git.push('origin', 'master', cb);
});

gulp.task('create-new-tag', function (cb) {
    var version = getPackageJsonVersion();
    git.tag(version, 'Created Tag for version: ' + version, function (error) {
        if (error) {
            return cb(error);
        }
        
        git.push('origin', 'master', {args: '--tags'}, cb);
    });
    
    function getPackageJsonVersion () {
        // We parse the json file instead of using require because require caches
        // multiple calls so the version number won't be updated
        return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
    }
});


gulp.task('release', function() {
    runSequence(             // build + bundle + tests + docs
        'version',             // bump version
        'prerelease',
        'commit-changes',       // add all and commit under "relase MAJOR|MINOR|PATCH version (vVERSION)" message
        'commit-changelog',     // generate and commit changelog
        'push-changes',        // push all commits to github        
        //'create-new-tag',       // generate tag and push it
        //'release:github',       // generate github release
        //'publish:coveralls',    // generate and publish coveralls
    function(error) {
        if (error) {
            console.log(error);
        }
        
        //cb(error);
    });
});



gulp.task('prerelease', function(){
    var version = JSON.parse(fs.readFileSync('package.json')).version;
    gulp.src('./dist/some-file.exe')
      .pipe(release({
        token: 'd15001c047fb21d218a8aac3c0f254c5045ac4ae',                     // or you can set an env var called GITHUB_TOKEN instead
        owner: 'narendhar11',               // if missing, it will be extracted from manifest (the repository.url field)
        repo: 'gulp-release',               // if missing, it will be extracted from manifest (the repository.url field)
        tag: version,                       // if missing, the version will be extracted from manifest and prepended by a 'v'
        name: 'gulp-release '+version,      // if missing, it will be the same as the tag
        notes: 'very good!',                // if missing it will be left undefined
        draft: false,                       // if missing it's false
        prerelease: true,                   // if missing it's false
        reuseRelease: false,
        reuseDraftOnly: true,
        editRelease: true,
        manifest: require('./package.json') // package.json from which default values will be extracted if they're missing
    }));
});


gulp.task('test-release', function() {
    runSequence(             // build + bundle + tests + docs
        //'default',
        'patch-version',             // bump version
        'prerelease',
        'patch-commit-changes',       // add all and commit under "relase MAJOR|MINOR|PATCH version (vVERSION)" message
        'commit-changelog',     // generate and commit changelog
        'push-changes',        // push all commits to github        
        //'create-new-tag',       // generate tag and push it
        //'release:github',       // generate github release
        //'publish:coveralls',    // generate and publish coveralls
    function(error) {
        if (error) {
            console.log(error);
        }
        
        //cb(error);
    });
});


gulp.task('latestrelease', function(){
    var version = JSON.parse(fs.readFileSync('package.json')).version;
    gulp.src('./dist/some-file.exe')
      .pipe(release({
        token: '8165ffdb4742d38028dbc5e739f82580d01caf59',                     // or you can set an env var called GITHUB_TOKEN instead
        owner: 'narendhar11',                    // if missing, it will be extracted from manifest (the repository.url field)
        repo: 'gulp-release',            // if missing, it will be extracted from manifest (the repository.url field)
        tag: version,                      // if missing, the version will be extracted from manifest and prepended by a 'v'
        //name: 'gulp-release '+version,     // if missing, it will be the same as the tag
        //notes: 'very good!',                // if missing it will be left undefined
        draft: false,                       // if missing it's false
        prerelease: false,                  // if missing it's false
        reuseRelease: true,
        reuseDraftOnly: true,
        editRelease: true,
        //manifest: require('./package.json') // package.json from which default values will be extracted if they're missing
    }));
    
});

gulp.task('prod-release', function() {
    runSequence(             // build + bundle + tests + docs
        //'default',
        //'patch-version',             // bump version
        'latestrelease',
        'patch-commit-changes',       // add all and commit under "relase MAJOR|MINOR|PATCH version (vVERSION)" message
        'commit-changelog',     // generate and commit changelog
        'push-changes',        // push all commits to github        
        //'create-new-tag',       // generate tag and push it
        //'release:github',       // generate github release
        //'publish:coveralls',    // generate and publish coveralls
    function(error) {
        if (error) {
            console.log(error);
        }
        
        //cb(error);
    });
});