const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const responsive = require('gulp-responsive');
const del = require('del');

gulp.task('compressImages', () => {
    gulp.src('img/*.jpg')
        .pipe(imagemin())
        .pipe(gulp.dest('img'));
});

gulp.task('responsiveImages', () => {
    return gulp.src('img/*.jpg')
        .pipe(responsive({
            // Resize all JPG images to three different sizes: 200, 500, and 630 pixels
            '*.jpg': [
                {
                    width: 200,
                    rename: { suffix: '-200px' },
                },
                {
                    width: 500,
                    rename: { suffix: '-500px' },
                },
            ],
        }, {
            // Global configuration for all images
            // The output quality for JPEG, WebP and TIFF output formats
            quality: 70,
            // Use progressive (interlace) scan for JPEG and PNG output
            progressive: true,
            // Strip all metadata
            withMetadata: false,
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', () => {
    return del('dist');
});

gulp.task('default', ['clean', 'compressImages', 'responsiveImages']);
