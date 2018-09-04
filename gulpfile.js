/**
 *  Welcome to your gulpfile!
 *  The gulp tasks are splitted in several files in the gulp directory
 *  because putting all here was really too long
 */

'use strict';

var gulp = require('gulp');
var fse = require('fs-extra');
var runSequence = require('run-sequence');
var minimist = require('minimist');
var gutil = require('gulp-util');
var bump = require('gulp-bump');
var git = require('gulp-git');
var conventionalGithubReleaser = require('conventional-github-releaser');
var conventionalChangelog = require('gulp-conventional-changelog');

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





var knownOptions = {
    boolean: ['major', 'minor', 'patch'],
    alias: { major: 'M', minor: 'm', patch: 'p' },
    default: { major: false, minor: false, patch: false, M: false, m: false, p: false }
};

var options = minimist(process.argv.slice(2), knownOptions);

gulp.task('version', function () {
    var src = gulp.src(['./bower.json', './package.json']);
    // Do patch by default
    var stage = null;
    
    if (options.major) {
        stage = src.pipe(bump({type: 'major'}).on('error', gutil.log));
    } else if (options.minor) {
        stage = src.pipe(bump({type: 'minor'}).on('error', gutil.log));
    } else {
        stage = src.pipe(bump({type: 'patch'}).on('error', gutil.log));
    }
        
    return stage.pipe(gulp.dest('./'));
});

gulp.task('commit-changes', function () {
    var kind = 'patch';
    
    
    if (options.major) {
        kind = 'major';
    } else if (options.minor) {
        kind = 'minor';
    }
    
    var version = JSON.parse(fs.readFileSync('package.json')).version;
    var msg = 'chore(release): Release ' + kind + ' version (v' + version + ')';

    return gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit(msg));
});

gulp.task('changelog', function () {
    return gulp.src('CHANGELOG.md', {
        buffer: false
    })
    .pipe(conventionalChangelog({
        preset: 'angular',
        outputUnreleased: true,
        releaseCount: 0
    }, {    // CHANGE: Put your github repository info
        host: 'https://github.com',
        owner: 'narendhar11',
        repository: 'REPOSITORY'
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

gulp.task('release:github', function (done) {
    conventionalGithubReleaser({
        type: "oauth",
        token: '7490281773beee28e0640fd61b626346240c3b6c' // change this to your own GitHub token or use an environment variable
    }, {
        preset: 'cniguard' // Or to any other commit message convention you use.
    }, done);
});




gulp.task('release', function(callback) {
    runSequence(            // build + bundle + tests + docs
        'version',              // bump version
        'commit-changes',       // add all and commit under "relase MAJOR|MINOR|PATCH version (vVERSION)" message
        'commit-changelog',     // generate and commit changelog
        'push-changes',         // push all commits to github
        'create-new-tag',       // generate tag and push it
        'release:github',       // generate github release
        //'publish:coveralls',    // generate and publish coveralls
    function(error) {
        if (error) {
            console.log(error);
        }else {
            console.log('RELEASE FINISHED SUCCESSFULLY');
        }
        
        callback(error);
    });
});
