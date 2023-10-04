const {series} = require('gulp');
const publish = require('./index');

exports.publish = series(publish);