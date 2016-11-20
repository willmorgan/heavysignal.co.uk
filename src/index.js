'use strict';

const express = require('express');
const favicon = require('express-favicon');

const app = express();

const PORT = process.env.PORT || 3000;

const FB = require('fb');

const pug = require('pug');

const path = require('path');

const TEMPLATE = pug.compileFile(path.resolve(__dirname, './template.pug'));

const { FB_APP_ID, FB_APP_SECRET, PAGE_ID } = process.env;

function showEvents(events) {
	return TEMPLATE({
		events: events.slice(0,5)
	});
}

function processEvents(events) {
	return events;
}

function getEvents() {
	return new Promise((resolve, reject) => {
		FB.api(`/${PAGE_ID}/events`, function (response) {
			if (response.data) {
				return resolve(response.data);
			}
			return reject(response.error || new Error(Object.assign({ message: 'Unknown error', response })));
		});
	});
}

app.use(favicon(path.resolve(__dirname, '../static/favicon.ico')));
app.use('/favicon.ico', express.static(path.resolve(__dirname, '../static/favicon.ico')));

app.use('/static', express.static(path.resolve(__dirname, '../static')));

app.get('/', function(req, res, next) {
	getEvents()
		.then(events => {
			const html = showEvents(processEvents(events));
			res.header('Content-Type', 'text/html').send(html);
		})
		.catch(error => next(error));
});

app.use(function (error, req, res, next) {
	res.status(500).json(Object.assign({ message: 'Error', error }));
});

console.log('Booting app with settings', 'FB_APP_ID', FB_APP_ID, 'PAGE_ID', PAGE_ID);
FB.api('/oauth/access_token', 'post', {
	client_id: FB_APP_ID,
	client_secret: FB_APP_SECRET,
	grant_type: 'client_credentials',
}, function (response) {
	if (response.error) {
		throw response.error;
	}
	console.log('Got access_token');
	FB.options({
		appId: FB_APP_ID,
		appSecret: FB_APP_SECRET,
		accessToken: response.access_token,
	});
	app.listen(PORT, function (err) {
		if (err) {
			throw err;
		}
		console.log('Listening on port', PORT);
	});
});
