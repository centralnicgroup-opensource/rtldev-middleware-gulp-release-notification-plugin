const {series} = require('gulp');
const publishNotification = require('./index');
exports.publish = series(publishNotification);