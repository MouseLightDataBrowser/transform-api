import gulp from 'gulp';
import del from 'del';
import * as ts from 'gulp-typescript';

const tsProject = ts.createProject("tsconfig.json");

gulp.task("default", () => {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("dist"));
});
