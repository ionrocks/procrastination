// Some regular expressions
var sortRegular = {
	front: /^(\/(hot|new|rising|controversial|top|gilded|ads))?\/?$/i
	, subreddit: /^\/r\/([a-z0-9\-_\+]+)(\/(hot|new|rising|controversial|top|gilded|ads))?\/?$/i
	, thread: /^\/r\/([a-z0-9\-_]+)\/comments\/([a-z0-9]{6})/i
	, user: /^\/(u|user)\/([a-z0-9\-_]+)(\/(overview|comments|submitted|gilded))?\/?$/i
	, subreddits: /^\/subreddits(\/(new|popular))?\/?$/i
	, search: /^(\/r\/([a-z0-9\-_\+]+))?\/search/i
};

// The available sort orders
var sortTypes = {
	subreddit: {
		hot: 'hot'
		, new: 'new'
		, rising: 'rising'
		, controversial: 'controversial'
		, top: 'top'
		, gilded: 'gilded'
	}
	, thread: {
		best: 'confidence'
		, top: 'top'
		, new: 'new'
		, hot: 'hot'
		, controversial: 'controversial'
		, old: 'old'
		, random: 'random'
	}
	, user: {
		overview: 'overview'
		, comments: 'comments'
		, submitted: 'submitted'
		, gilded: 'gilded'
	}
	, subreddits: {
		popular: 'popular'
		, new: 'new'
	}
	, search: {
		relevance: 'relevance'
		, new: 'new'
		, hot: 'hot'
		, top: 'top'
		, comments: 'comments'
	}
};

// Some handy functions
function changeSort(parsed, sort) {
	// Check if it's the front page
	if (sortRegular.front.test(parsed.path)) {
		parsed.path = '/' + sort;
	}
	// Check if it's a subreddit
	else if (sortRegular.subreddit.test(parsed.path)) {
		var match = parsed.path.match(sortRegular.subreddit);

		parsed.path = '/r/' + match[1] + '/' + sort;
	}
	// Check if it's a thread
	else if (sortRegular.thread.test(parsed.path)) {
		parsed.query.sort = sort;
	}
	// Check if it's a user
	else if (sortRegular.user.test(parsed.path)) {
		var match = parsed.path.match(sortRegular.user);

		parsed.path = '/user/' + match[2] + '/' + sort;
	}
	// Check if it's a subreddit list
	else if (sortRegular.subreddits.test(parsed.path)) {
		var match = parsed.path.match(sortRegular.subreddits);

		parsed.path = '/subreddits/' + sort;
	}
	// Check if it's a search
	else if (sortRegular.search.test(parsed.path)) {
		parsed.query.sort = sort;
	}

	return tiny.url.stringify(parsed).replace(/\?$/, '');
};

function updateSortMenu(url, orders) {
	var links = [];

	for (var text in orders) {
		links.push({
			text: text
			, url: changeSort(url, orders[text])
		});
	}

	document.getElementById('sort-menu').innerHTML = templates.menu({
		links: links
	});
};

var parsed = tiny.url.parse(current || '', true);

// Show the sort options for the front page or a subreddit
if (sortRegular.front.test(parsed.path) || sortRegular.subreddit.test(parsed.path)) {
	updateSortMenu(parsed, sortTypes.subreddit);
}
else if (sortRegular.thread.test(parsed.path)) {
	updateSortMenu(parsed, sortTypes.thread);
}
else if (sortRegular.user.test(parsed.path)) {
	updateSortMenu(parsed, sortTypes.user);
}
else if (sortRegular.subreddits.test(parsed.path)) {
	updateSortMenu(parsed, sortTypes.subreddits);
}
else if (sortRegular.search.test(parsed.path)) {
	updateSortMenu(parsed, sortTypes.search);
}
