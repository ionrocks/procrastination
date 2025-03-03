// The main div
var main = document.getElementById('main');

// Cache for the url of the current page
var current;

// If the page should be cleared on next render or not
var shouldClear = true;

// Some regular expressions
var redditRegExp = /^https?:\/\/(www\.)?reddit\.com/i;

// Some helpful functions
function selfText(text) {
	var x = (text || '')
		.replace(/&gt;/g, '>')
		.replace(/&lt;/g, '<')
		.replace(/&amp;/g, '&')
		.replace(/<a href=\"https?:\/\/(www\.)?reddit\.com/ig, '<a href="')
		.replace(/<a href=/ig, '<a target="_blank" href=')
		.replace(/\<!--(.*?)--\>/g, '')
		.trim();

	// Only wrap it if there is some content
	if (x) return '<div class="body">' + x + '</div>';

	return '';
}

// Handlebars helpers
Handlebars.registerHelper('title', function(text, options) {
	return (text || '')
		.replace(/&amp;/g, '&')
		.trim();
});

Handlebars.registerHelper('child', function(data, options) {
	switch (data.kind) {
		case 't1': return templates.comment(data);
		case 't3': return templates.post(data);
		case 't5': console.log(data); return templates.subreddit(data);
		case 'more': return templates.more(data);
		default:
			console.log('Unknown Post Type', data.kind, data);
			return '';
	}
});

Handlebars.registerHelper('afterurl', function(text, options) {
	var page = tiny.url.parse(current, true);

	page.query.after = text;
	page.query.count = parseInt(page.query.count || '0', 10) + parseInt(page.query.limit || '25', 10);

	return tiny.url.stringify(page);
});

Handlebars.registerHelper('embeddable', function(options) {
	if (
		!!isEmbed(this.data.url)
		|| this.data.is_self
		|| (this.data.gallery_data && this.data.gallery_data.items && this.data.media_metadata)
		|| (this.data.media && this.data.media.reddit_video)
	) {
		return options.fn(this);
	}
	else {
		return options.inverse(this);
	}
});

Handlebars.registerHelper('embed', function(options) {
	// Reddit Gallery
	if (this.data.gallery_data && this.data.gallery_data.items && this.data.media_metadata) {
		var media_metadata = this.data.media_metadata;

		return this.data.gallery_data.items.map(function (item) {
			var image = media_metadata[item.media_id];

			return '<img src="' + Handlebars.Utils.escapeExpression((image.s.u || image.s.gif).replace(/&amp;/g, '&')) + '" />';
		}).join('')
	}

	// Reddit Video
	if (this.data.media && this.data.media.reddit_video) {
		return templates.video({
			id: this.data.name
			, poster: this.data.preview.images[0].source.url.replace(/&amp;/g, '&')
			, dash_url: this.data.media.reddit_video.dash_url.replace(/&amp;/g, '&')
			, fallback_url: this.data.media.reddit_video.fallback_url.replace(/&amp;/g, '&')
		})
	}

	// Embeddable
	if (this.data.url) {
		var embed = isEmbed(this.data.url);

		if (embed) {
			if (typeof embed === 'string') {
				return '<img src="' + Handlebars.Utils.escapeExpression(embed) + '" />';
			}
			else if (typeof embed === 'function') {
				return embed();
			}
		}
	}

	// Self text
	return selfText(this.data.selftext_html || this.data.body_html || this.data.content_html);
});

Handlebars.registerHelper('link', function(url, options) {
	var local = false;

	if (redditRegExp.test(url)) {
		local = true;
		url = url.replace(redditRegExp, '');
	}

	return templates.link({
		url: Handlebars.Utils.escapeExpression(url)
		, local: local
	});
});

Handlebars.registerHelper('selftext', function(options) {
	return selfText(this.data.selftext_html || this.data.body_html || this.data.content_html);
});

Handlebars.registerHelper('ago', function(time, options) {
	var now = Math.floor(Date.now() / 1000);

	time = parseInt(time, 10);

	var seconds = (now - time);
	if (seconds < 15) return 'just now';
	if (seconds < 60) return seconds + ' seconds ago';
	var minutes = Math.floor(seconds / 60);
	if (minutes == 1) return 'a minute ago';
	if (minutes < 60) return minutes + ' minutes ago';
	var hours = Math.floor(minutes / 60);
	if (hours == 1) return 'an hour ago';
	if (hours < 24) return hours + ' hours ago';
	var days = Math.floor(hours / 24);
	if (days == 1) return 'yesterday';
	if (days < 7) return days + ' days ago';
	var weeks = Math.floor(days / 7);
	if (weeks == 1) return 'last week';
	if (weeks <= 4) return weeks + ' weeks ago';
	var months = Math.floor(days / 30.5);
	if (months == 1) return 'last month';
	if (months < 12) return months + ' months ago';
	var years = Math.floor(days / 365.25);
	if (years == 1) return 'last year';
	return years + ' years ago';
});

// Loading of data and infinite scrolling functions
function displayData(data, url) {
	// Clear it out, if required
	if (shouldClear) main.innerHTML = '';

	// Stop clearing
	shouldClear = false;

	// To make things easier, we're just going to make everything an array
	if (!Array.isArray(data)) data = [data];

	// Redirect random
	if (current == '/r/random') {
		// We're wrapping this in a try just in case
		try {
			var fp = data[0].data.children[0];
			window.location = '/r/' + fp.data.subreddit;

			return;
		} catch (e) {}
	}

	// Loop through it all and display it nicely
	for (var i = 0, d; i < data.length; i += 1) {
		d = data[i];

		switch(d.kind.toUpperCase()) {
			case 'LISTING':
				// Convert the HTML to elements
				var parser = new DOMParser();
				var html = templates.listing(d);
				var doc = parser.parseFromString(html, 'text/html');
				var els = doc.body.childNodes;

				// Loop through the nodes, find out which ones we want; if we don't do it in two steps, the indexes change
				var j, e;
				var copy = [];

				for (j = 0; j < els.length; j += 1) {
					e = els[j];

					if (e.nodeType == 1) copy.push(e);
				}

				// Loop through the nodes we want, add them
				for (j = 0; j < copy.length; j += 1) {
					e = copy[j];

					// Remove it from the fake document
					e.parentNode.removeChild(e);

					// Add it to the real document
					main.appendChild(e);
				}

				break;
			case 'WIKIPAGE':
				main.innerHTML = templates.wiki(d);
				break;
			default:
				console.log('Unknown Kind', d.kind);
				break;
		}
	}

	setTimeout(checkPosition, 250);
};

function loadMore(comment) {
	var page = current;

	page = tiny.url.parse(page);

	if (!page.path.match(/\/$/)) page.path += '/'
	page.path += comment;
	page.path += '.json';

	page = tiny.url.stringify(page);

	tiny.ajax.jsonp({
		url: 'https://www.reddit.com' + page
		, param: 'jsonp'
		, success: function(data) {
			var d = data.pop();

			var button = document.getElementById('t1_' + comment);
			var container = button.parentNode;

			container.removeChild(button);

			switch(d.kind.toUpperCase()) {
				case 'LISTING':
					container.insertAdjacentHTML('beforeend', templates.listing(d));
					break;
				default:
					console.log('Unknown Kind', d.kind);
					break;
			}
		}
	});

	return false;
};

function loadPage(page) {
	// No page passed in, so let's default to what's in the URL
	if (!page) page = (window.location.pathname || '') + (window.location.search || '');

	current = page;

	// Make sure to add the .json
	page = tiny.url.parse(page);
	page.path += '.json';
	page = tiny.url.stringify(page);

	// Replace some redirects
	page = page.replace(/^\/u\//i, '/user/');

	tiny.ajax.jsonp({
		url: 'https://www.reddit.com' + page
		, param: 'jsonp'
		, success: displayData
	});
};

function checkPosition() {
	var nextLink = document.getElementById('next');

	// Check if they've scrolled far enough to trigger anything
	if (nextLink && ((window.pageYOffset + window.innerHeight) >= nextLink.offsetTop)) {
		var url = nextLink.getAttribute('data-url');

		loadPage(url);

		// Make sure we don't try loading a billion times
		nextLink.parentNode.removeChild(nextLink);

		// Logging
		console.log('Loading Next Page', url);
	}
}

// Exports
window.loadMore = loadMore;

// Events
window.addEventListener('scroll', checkPosition, false);

// Everything is ready, so load the first page
loadPage();
