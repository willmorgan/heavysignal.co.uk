'use strict';

const express = require('express');
const favicon = require('express-favicon');

const app = express();

const PORT = process.env.PORT || 3000;

const FB = require('fb');

const pug = require('pug');
const moment = require('moment');

const path = require('path');

const TEMPLATE = pug.compileFile(path.resolve(__dirname, './template.pug'));

const { FB_APP_ID, FB_APP_SECRET, PAGE_ID } = process.env;

function showEvents(events) {
	return TEMPLATE(Object.assign({
		events: events.slice(0,5),
		startEnd: function startEnd(start, end) {
			const startDay = start ? moment.utc(start).format('DDD') : 0;
			const endDay = end ? moment.utc(end).format('DDD') : 0;
			if (!startDay) {
				return '';
			}
			const longFormat = 'dddd, MMMM Do YYYY HH:mm';
			const timeFormat = 'HH:mm';
			let string = moment.utc(start).format(longFormat);
			if (endDay) {
				let endFormat = (endDay - startDay === 1) ? timeFormat : longFormat;
				string = string + ' - ' + moment.utc(end).format(endFormat);
			}
			return string;
		}
	}));
}

function processEvents(events) {
	return events;
}

const eventCache = {
	lastFetched: null,
	lifetime: 3600,
	events: [],
};

function getEvents(eventCache, now) {
	if (eventCache.lastFetched && eventCache.lastFetched + eventCache.lifetime < now) {
		return Promise.resolve(eventCache.events);
	}
	return new Promise((resolve, reject) => {
		FB.api(`/${PAGE_ID}/events`, {
			fields: [
				'id',
				'cover',
				'ticket_uri',
				'name',
				'start_time',
				'end_time',
				'place',
			],
		}, function (response) {
			if (response.data) {
				eventCache.lastFetched = new Date().getTime();
				eventCache.events = response.data;
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
	getEvents(eventCache, new Date().getTime())
		.then(events => {
			const html = showEvents(processEvents(events));
			res.header('Content-Type', 'text/html').send(html);
		})
		.catch(error => next(error));
});

app.use(function (error, req, res, next) {
	console.error(error);
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
	console.log('Warming cache');
	return getEvents(eventCache, new Date().getTime()).then(events => {
		console.log('Cache warm, loaded', events.length, 'events');
	}).catch(error => {
		console.error('Error warming cache, terminating boot');
		throw error;
	}).then(() => {
		app.listen(PORT, function (err) {
			if (err) {
				throw err;
			}
			console.log('Listening on port', PORT);
		});
	});
});
