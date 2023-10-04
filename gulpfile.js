const {series} = require('gulp');
const publish = require('./index');

exports.default = series(publish);