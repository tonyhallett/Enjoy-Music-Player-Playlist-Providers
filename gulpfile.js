var gulp = require('gulp'),
    cheerio = require('gulp-cheerio');
    exec = require('child_process').exec;
    path = require('path');
    log = require('fancy-log');
    fs = require('fs-extra')

var chromeExtensionsPath='C:\\Users\\tonyh\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\';

var enjoyMusicPlayerId='hncfgilfeieogcpghjnnhddghgdjbekl';
var enjoyMusicPlayerFolderVersion='\\5.0.9_0\\'
var enjoyMusicPlayerRelativePath=enjoyMusicPlayerId + enjoyMusicPlayerFolderVersion;

var enjoyMusicPlayerExtensionPath=chromeExtensionsPath + enjoyMusicPlayerRelativePath;

var copyEnjoyMusicPlayerPath=path.join(__dirname, 'Enjoy Music Player\\' + enjoyMusicPlayerId);
var destinationEnjoyMusicPlayerPath=chromeExtensionsPath + enjoyMusicPlayerId;
var localEnjoyMusicPlayerPath=path.join(__dirname, 'Enjoy Music Player\\' + enjoyMusicPlayerRelativePath);

var enjoyMusicPlayerPath;

function buildNewFunctionality(cb){
    exec('npx webpack', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
      });
}
function moveJs(){
    return gulp.src('dist/**.**').pipe(gulp.dest(enjoyMusicPlayerPath+"js"));
}
function ensureScriptTag(){
    var index=enjoyMusicPlayerPath+"index.html";
    var playlistManagerScriptId="playlistManagerScript";
    var scriptTag='<script id="' + playlistManagerScriptId + '" src="/js/playlistManager.js"></script>';

    return gulp.src(index).pipe(cheerio(function($,file){
        var existingScript=$('#' + playlistManagerScriptId);
        if(existingScript.length==0){
            $('body').append(scriptTag);
        }
    })).pipe(gulp.dest(enjoyMusicPlayerPath));
}
function copyImages(){
    return gulp.src("images/**.*").pipe(gulp.dest(enjoyMusicPlayerPath + "img"));
}



function buildCommon(){
    var buildAndMove=gulp.series(buildNewFunctionality,moveJs);
    return gulp.parallel(copyImages,buildAndMove,ensureScriptTag);
}
function buildToExisting(){
    enjoyMusicPlayerPath=enjoyMusicPlayerExtensionPath;
    return buildCommon();
}
function installLocal(done){
    return fs.copy(copyEnjoyMusicPlayerPath,destinationEnjoyMusicPlayerPath);
}
function buildAndInstall(done){
    enjoyMusicPlayerPath=localEnjoyMusicPlayerPath;
    return gulp.series(buildCommon(),installLocal);
}
gulp.task('buildToExisting',buildToExisting);
gulp.task('buildAndInstall',buildAndInstall());
