var gulp = require('gulp');
var browserSync = require('browser-sync');
var browserify = require('gulp-browserify');
var reload = browserSync.reload;
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var cp = require('child_process');
var runSequence = require('run-sequence');
var minifyCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var util = require('gulp-util');
var notifier = require('node-notifier');
var neat = require('node-neat').includePaths;
var debowerify = require("debowerify");
var fs = require("fs");
var awspublish = require('gulp-awspublish');
var ftp = require('vinyl-ftp');


var paths = {
  styles: ['src/styles/**/*.scss'],
  scripts: ['src/scripts/**/*.js'],
  images: ['src/images/**/*'],
  fonts: ['src/fonts/**/*'],
  media: ['src/media/**/*'],
  docs: ['src/**/*.html', 'src/**/*.md', 'src/templates/*.jade']
};

// Standard error handler
function standardHandler(err) {
  // Notification
  notifier.notify({
    message: 'Error: ' + err.message
  });
  // Log to console
  util.log(util.colors.red('Error'), err.message);
}

function sassErrorHandler(err) {
  standardHandler({
    message: err
  });
}

gulp.task('styles', function() {
  browserSync.notify('<span style="color: grey">Running:</span> styles');
  var production = util.env.type === 'production';

  gulp.src('./src/styles/main.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      onError: sassErrorHandler,
      includePaths: ['styles'].concat(neat)
    }))
    .pipe(gulpif(production, minifyCss())) // only minify if production
    .pipe(gulpif(!production, sourcemaps.write()))
    .pipe(gulp.dest('./build/css'))
    .pipe(browserSync.reload({stream:true}));

  gulp.src('./src/styles/ie.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      onError: sassErrorHandler,
      includePaths: ['styles'].concat(neat)
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./build/css'))
    .pipe(browserSync.reload({stream:true}));
});

// Handler for browserify
function browserifyHandler(err) {
  standardHandler(err);
  this.end();
}

gulp.task('images', function() {
  gulp.src(['src/images/**/*.png', 'src/images/**/*.jpg', 'src/images/**/*.jpeg', 'src/images/**/*.gif', 'src/images/**/*.svg'])
    // .pipe(imagemin())
    .pipe(gulp.dest('build/images/'));
});

gulp.task('favicon', function() {
  gulp.src(['src/images/favicon*'])
    .pipe(gulp.dest('build/'));
});

gulp.task('fonts', function() {
  gulp.src(['src/fonts/**'])
    .pipe(gulp.dest('build/fonts/'));
});

gulp.task('media', function() {
  gulp.src(['src/media/**'])
    .pipe(gulp.dest('build/media/'));
});

gulp.task('scripts', function() {
  var production = util.env.type === 'production';

  return gulp.src(['./src/scripts/app.js'])
    .pipe(browserify({
      debug: !production,
      paths: ['./node_modules','./app'],
      transform: [debowerify]
    }))
    .on('error', browserifyHandler)
    .pipe(gulpif(production, uglify())) // only minify if production
    .pipe(gulp.dest('./build/scripts/'));
});

gulp.task('scripts-watch', ['scripts'], browserSync.reload);

gulp.task('deploy', function() {

  // create a new publisher using S3 options
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property
  credentials = JSON.parse(fs.readFileSync('./aws.json'));
  var publisher = awspublish.create(credentials);

  // define custom headers
  var headers = {
    'Cache-Control': 'max-age=315360000, no-transform, public'
  };

  return gulp.src('./build/**')
     // gzip, Set Content-Encoding headers and add .gz extension
    .pipe(awspublish.gzip({ ext: '' }))

    // publisher will add Content-Length, Content-Type and headers specified above
    // If not specified it will set x-amz-acl to public-read by default
    .pipe(publisher.publish(headers))

    // create a cache file to speed up consecutive uploads
    .pipe(publisher.cache())

     // print upload updates to console
    .pipe(awspublish.reporter());
});

// gulp.task( 'deploy', function() {
//
//   var conn = ftp.create( {
//     host:     'ftp.henderik.co',
//     user:     'FTPHenderik',
//     password: '1!FTPHend',
//     log: util.log
//   });
//
//   // var globs = [
//   //   'src/**',
//   //   'css/**',
//   //   'js/**',
//   //   'fonts/**',
//   //   'index.html'
//   // ];
//
//   // using base = '.' will transfer everything to /public_html correctly
//   // turn off buffering in gulp.src for best performance
//
//   return gulp.src([ './build/**' ], { base: './build/', buffer: false})
//       .pipe(conn.newer( '/capo_html')) // only upload newer files
//       .pipe(conn.dest( '/capo_html'));
//
// });

gulp.task('browser-sync', function(){
  browserSync({
    host: '*',
    port: 9001,
    open: false,
    server: {
      baseDir: './build'
    }
  });
});

gulp.task('browser-sync:reload', function(){
  browserSync.notify('<span style="color: grey">Running:</span> rebuild');
  browserSync.reload();
});

gulp.task('sync', function() {
  runSequence('build', 'styles', 'images', 'favicon', 'fonts', 'media', 'scripts', 'browser-sync');
});

gulp.task('watch', function() {
  gulp.watch(paths.docs, ['rebuild']);
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.images, ['images']);
  gulp.watch(paths.fonts, ['fonts']);
  gulp.watch(paths.media, ['media']);
  gulp.watch(paths.scripts, ['scripts-watch']);
});

gulp.task('serve', function() {
  gulp.start('sync', 'watch');
});

gulp.task('rebuild', function() {
  runSequence('build', 'styles', 'images', 'favicon', 'fonts', 'media', 'scripts', 'browser-sync:reload');
});

// Run with `gulp compile --type production`
gulp.task('compile', function() {
  runSequence('build', 'styles', 'images', 'favicon', 'fonts', 'media', 'scripts');
});

gulp.task('build', function(done){
  var args = [
    'run',
    'build'
  ];

  return cp.spawn('npm', args, {stdio: 'inherit'})
    .on('close', done);
});

gulp.task('default', ['serve']);
