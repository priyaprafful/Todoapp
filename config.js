var express = require('express'),
	logger = require('morgan'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	errorHandler = require('errorhandler'),
	cookieParser = require('cookie-parser');
path = require('path');

module.exports = function() {
	var app = express();
	// all environments
	app.set('port', process.env.PORT || 3000);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'pug');
	app.use(logger('dev'));
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(bodyParser.json());
	app.use(methodOverride());
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(cookieParser());
	app.use(errorHandler());
	return app;
}();