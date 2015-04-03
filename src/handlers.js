var handlers = [];

// YouTube

handlers.push({
	test: /\/\/(www\.|m\.)?youtu\.be\/([a-z0-9\-_]{4,12})/i
	, parse: function(match) {
		var id = match[2];

		return function() {
			return templates.youtube({
				id: id
			});
		};
	}
}
, {
	test: /\/\/(www\.|m\.)?youtube\.com\/(.*?)watch(\?|%3f)(.*?)v(=|%3d)([a-z0-9\-_]{4,12})/i
	, parse: function(match) {
		var id = match[6];

		return function() {
			return templates.youtube({
				id: id
			});
		};
	}
});

// Vine

handlers.push({
	test: /\/\/(www\.)?vine\.co\/v\/([a-z0-9]+)/i
	, parse: function(match) {
		var id = match[2];

		return function() {
			return templates.vine({
				id: id
			});
		};
	}
}
, {
	test: /\/\/([a-z\.]+)?vine\.co\/r\/videos\/([a-z0-9_\.]+)\.mp4/i
	, parse: function(match) {
		var id = tiny.util.id();
		var mp4 = match[0];

		return function() {
			setTimeout(function() {
				document.getElementById('gifv-' + id).play();
			}, 1000);

			return templates.gifv({
				id: id
				, mp4: mp4
			});
		};
	}
});

// Vimeo

handlers.push({
	test: /\/\/(www\.)?vimeo\.com\/([0-9]+)/i
	, parse: function(match) {
		var id = match[2];

		return function() {
			return templates.vimeo({
				id: id
			});
		};
	}
});

// Flickr

handlers.push({
	test: /\/\/(www\.)?flickr\.com\/photos\/([a-z0-9\-_@]+)\/([0-9]+)/i
	, parse: function(match) {
		var user = match[2];
		var photo = match[3];

		return function() {
			return templates.flickr({
				user: user
				, photo: photo
			});
		};
	}
});

// Twitter

handlers.push({
	test: /\/\/(www\.|mobile\.)?twitter\.com\/(#!\/)?([a-z0-9\-_]+)\/status(es)?\/([0-9]+)/i
	, parse: function(match) {
		var user = match[3];
		var tweet = match[5];
		var placeholder = 'twitter-tweet-' + tiny.util.id();

		return function() {
			setTimeout(function() {
				var div = document.getElementById(placeholder);

				twttr.widgets.createTweet(tweet, div, {
					align: 'center'
				});

				div.className = '';
			}, 500);

			return templates.placeholder({
				id: placeholder
			});
		};
	}
}
, {
	test: /\/\/(www\.|mobile\.)?twitter\.com\/(#!\/)?([a-z0-9\-_]+)\/?$/i
	, parse: function(match) {
		var user = match[3];
		var placeholder = 'twitter-timeline-' + tiny.util.id();

		return function() {
			setTimeout(function() {
				var div = document.getElementById(placeholder);

				twttr.widgets.createTimeline(settings.twitterWidget, div, {
					screenName: user
					, dnt: true
				});

				div.className = '';
			}, 500);

			return templates.placeholder({
				id: placeholder
			});
		};
	}
});

// Gfycat

handlers.push({
	test: /\/\/([a-z]{1,6}\.)?gfycat\.com\/([a-z0-9]+)/i
	, parse: function(match) {
		var id = match[2];
		var placeholder = 'gfycat-' + tiny.util.id();

		return function() {
			tiny.ajax({
				url: 'http://gfycat.com/cajax/get/' + id
				, success: function(data) {
					if ('gfyItem' in data) {
						setTimeout(function() {
							document.getElementById('gifv-' + id).play();
						}, 1000);

						fillPlaceholder(placeholder, templates.gifv({
							id: id
							, mp4: data.gfyItem.mp4Url
							, webm: data.gfyItem.webmUrl
						}));
					}
				}
			});

			return templates.placeholder({
				id: placeholder
			});
		};
	}
});

// Tumblr

handlers.push({
	test: /\/\/([a-z0-9\-_]+)\.tumblr\.com\/post\/([0-9]{8,16})/i
	, parse: function(match) {
		var site = match[1];
		var id = match[2];
		var placeholder = 'tumblr-post-' + tiny.util.id();

		return function() {
			tiny.ajax.jsonp({
				url: 'http://api.tumblr.com/v2/blog/' + site + '.tumblr.com/posts?id=' + id + '&api_key=' + settings.tumblr
				, param: 'jsonp'
				, success: function(data) {
					// Get the post
					var post = null;

					try {
						post = data.response.posts[0];
					} catch (e) {}

					if (!post) return;

					// Figure out what the post type is
					switch (post.type) {
						case 'photo':
							var images = post.photos;
							var urls = [];

							for (var i = 0; i < images.length; i += 1) {
								urls.push(images[i].alt_sizes[1].url);
							}

							fillPlaceholder(placeholder, templates.album({
								images: urls
							}));

							break;
						case 'answer':
							fillPlaceholder(placeholder, templates.answer({
								question: post.question
								, answer: selfText(post.answer)
							}));

							break;
						case 'text':
							fillPlaceholder(placeholder, selfText(post.body));

							break;
						case 'chat':
							fillPlaceholder(placeholder, templates.chat({
								messages: post.dialogue
							}));

							break;
						case 'link':
							fillPlaceholder(placeholder, selfText(post.description));

							break;
						case 'quote':
							fillPlaceholder(placeholder, templates.quote({
								text: post.text
							}));

							break;
						case 'audio':
							fillPlaceholder(placeholder, post.player);

							break;
						case 'video':
							var html = post.player[post.player.length - 1].embed_code;

							html = html.replace('<video ', '<video controls="controls" ');

							fillPlaceholder(placeholder, html);

							break;
						default:
							console.log(post.type, post);
							break;
					}
				}
			});

			return templates.placeholder({
				id: placeholder
			});
		};
	}
});

// Instagram

handlers.push({
	test: /\/\/(www\.)?instagram\.com\/p\/([a-z0-9]{4,14})\/?$/i
	, parse: function(match) {
		return 'http://instagram.com/p/' + match[2] + '/media/?size=l';
	}
});

// Various meme sites

handlers.push({
	test: /\/\/(www\.)?livememe\.com\/([a-z0-9]{4,12})/i
	, parse: function(match) {
		return 'http://i.lvme.me/' + match[2] + '.jpg';
	}
}
, {
	test: /\/\/(www\.)?imgflip\.com\/i\/([a-z0-9]+)/i
	, parse: function(match) {
		return 'https://i.imgflip.com/' + match[2] + '.jpg';
	}
}
, {
	test: /\/\/(www\.)?memedad.com\/meme\/([0-9]+)/i
	, parse: function(match) {
		return 'http://memedad.com/memes/' + match[2] + '.jpg';
	}
}
, {
	test: /\/\/(www\.)?makeameme\.org\/meme\/([a-z0-9\-]+)/i
	, parse: function(match) {
		return 'http://makeameme.org/media/created/'  + match[2] + '.jpg';
	}
});

// Imgur

var imgurSizeRegular = /[sbtmlh]$/;

handlers.push({
	test: /\/\/([a-z]+\.)?imgur\.com\/([a-z0-9]{4,8})\.gifv/i
	, parse: function(match) {
		var id = match[2];

		return function() {
			setTimeout(function() {
				document.getElementById('gifv-' + id).play();
			}, 1000);

			return templates.gifv({
				id: id
				, webm: '//i.imgur.com/' + id + '.webm'
				, mp4: '//i.imgur.com/' + id + '.mp4'
			});
		};
	}
}
, {
	test: /\/\/([a-z]+\.)?imgur\.com\/((a|album)\/([a-z0-9]{4,8})|(g|gallery)\/([a-z0-9]{5})(\.|\/|$))/i
	, parse: function(match) {
		var id = match[4] || match[6];
		var placeholder = 'imgur-album-' + tiny.util.id();

		return function() {
			tiny.ajax({
				url: 'https://api.imgur.com/3/album/' + id + '.json'
				, headers: {
					'Authorization': 'Client-ID ' + settings.imgur
				}
				, success: function(data) {
					if (!data.success) return;

					var images = data.data.images;
					var urls = [];

					for (var i = 0; i < images.length; i += 1) {
						urls.push(images[i].link.replace('.jpg', 'l.jpg'));
					}

					fillPlaceholder(placeholder, templates.album({
						images: urls
					}));
				}
			});

			return templates.placeholder({
				id: placeholder
			});
		};
	}
}
, {
	test: /\/\/([a-z]+\.)?imgur\.com\/(g|gallery)\/([a-z0-9]{4,8})/i
	, parse: function(match) {
		var id = match[3];

		// Use the large size if it isn't already resized
		if (!imgurSizeRegular.test(id)) id += 'l';

		return 'http://i.imgur.com/' + id + '.jpg';
	}
}
, {
	test: /\/\/([a-z]+\.)?imgur\.com\/([a-z0-9]{4,8})(\.gif)?/i
	, parse: function(match) {
		var id = match[2];

		// It's a gif, so use the full size
		if (match[3]) {
			return 'http://i.imgur.com/' + id + '.gif'
		}

		// Use the large size if it isn't already resized
		if (!imgurSizeRegular.test(id)) id += 'l';

		return 'http://i.imgur.com/' + id + '.jpg';
	}
});

// Fallback for images

handlers.push({
	test: /\.(gif|png|jpg|jpeg)$/i
	, parse: function(match) {
		return match.input;
	}
});

// Some helpful functions
function isEmbed(url) {
	for (var i = 0, o; i < handlers.length; i += 1) {
		o = handlers[i];

		if (o.test.test(url)) return o.parse(url.match(o.test));
	}

	return false;
};

function fillPlaceholder(placeholder, content) {
	var div = document.getElementById(placeholder);

	// This shouldn't happen
	if (!div) return;

	div.className = '';
	div.innerHTML = content;
};
