'use strict';

const express = require('express');

const app = express();

const PORT = process.env.PORT || 3000;

const FB = require('fb');

const { FB_APP_ID, FB_APP_SECRET, PAGE_ID } = process.env;

FB.api('/oauth/access_token', 'post', {
	client_id: FB_APP_ID,
	client_secret: FB_APP_SECRET,
	grant_type: 'client_credentials',
}, function (response) {
	if (response.error) {
		throw response.error;
	}
	FB.options({
		appId: FB_APP_ID,
		appSecret: FB_APP_SECRET,
		accessToken: response.access_token,
	});
	app.listen(PORT, function (err) {
		if (err) {
			throw err;
		}
		console.log('Listening on', PORT);
	});
});
function showEvents(events) {
	return events.slice(0,5);
}

function processEvents(events) {
	return events;
}

app.get('/', function(req, res, next) {
	FB.api(`/${PAGE_ID}/events`, function (response) {
		if (!response.error) {
			return res.json(showEvents(processEvents(response.data)));
		}
		return next(response.error || 'Unknown error');
	});
});

app.use(function (error, req, res, next) {
	res.status(500).json(Object.assign({ message: 'Error', error }));
});
