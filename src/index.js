'use strict';

const express = require('express');
const favicon = require('express-favicon');

const app = express();

const PORT = process.env.PORT || 3000;

const pug = require('pug');

const path = require('path');

const TEMPLATE = pug.compileFile(path.resolve(__dirname, './template.pug'));

app.use(favicon(path.resolve(__dirname, '../static/favicon.ico')));
app.use('/favicon.ico', express.static(path.resolve(__dirname, '../static/favicon.ico')));

app.use('/static', express.static(path.resolve(__dirname, '../static')));

app.get('/', function(req, res, next) {
	const html = TEMPLATE([]);
	res.header('Content-Type', 'text/html').send(html);
});

app.use(function (error, req, res, next) {
	console.error(error);
	res.status(500).json(Object.assign({ message: 'Error', error }));
});

app.listen(PORT, function (err) {
	if (err) {
		throw err;
	}
	console.log('Listening on port', PORT);
});
