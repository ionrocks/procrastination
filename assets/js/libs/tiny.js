var tiny = (function(){
	var module = {};
	var exports = module.exports = {};

	var ajax = exports.ajax = function(o_options) {
		var url = o_options.url;
		var method = (o_options.method || 'GET').toUpperCase();
		var data = o_options.data;
		var headers = (o_options.headers || {});
		var type = (o_options.type || 'default').toLowerCase();
		var body = null;

		var error = o_options.error;
		var success = o_options.success;
		var complete = o_options.complete;

		url = exports.url.parse(url);

		// Handler for all request types
		var handle = function(request) {
			var data = request.responseText;

			if (request.getAllResponseHeaders) {
				var responseHeaders = ajax.headers(request.getAllResponseHeaders());

				// Figure out how to parse and return the data
				if (type === 'default' && typeof responseHeaders['content-type'] === 'string') {
					var ct = responseHeaders['content-type'];

					if (ct.match(/application\/json/i)) type = 'json';
					else type = 'text';
				}
			}

			// Parse the data appropriately
			switch (type) {
				case 'json':
					try {
						data = JSON.parse(data);
					} catch (e) {
						return console.log('TODO: Send Error');
					}
					break;
				case 'text': break;
				default: break;
			}

			// Send it off
			if (typeof success === 'function') success(data);
		};

		// Get ready to make the request
		var cors = false;
		if (url.host && !exports.url.sameorigin(url, '' + window.location)) cors = true;

		// Put the url back to a string
		url = exports.url.stringify(url);

		var request;
		if (cors && window.XDomainRequest) {
			request = new XDomainRequest();
			request.open(method, url, true);

			request.onload = handle;
			request.onerror = handle;
			request.ontimeout = handle;
		} else if (window.XMLHttpRequest || window.ActiveXObject) {
			if (window.XMLHttpRequest) request = new XMLHttpRequest();
			else if (window.ActiveXObject) request = new ActiveXObject('Microsoft.XMLHTTP');

			request.open(method, url, true);

			request.onreadystatechange = function() {
				if (request.readyState == 4) handle(request);
			};
		}

		if (!request) throw new Error('Cannot Make Request In This Browser');

		// Send the extra headers, if that's supported
		// TODO: Handle headers such as accept, which have special methods, better
		if (request.setRequestHeader) {
			for (var key in headers) {
				request.setRequestHeader(key, headers[key]);
			}
		}

		// Send the body (if applicable) and close the connection
		request.send(body);
	};
	ajax.headers = function(s_headers) {
		if (typeof s_headers !== 'string') throw new Error('Argument Must Be String');

		var r = {};

		s_headers = s_headers.split('\n');

		for (var i = 0, h, key, value; i < s_headers.length; i += 1) {
			h = s_headers[i];

			// In case of blank lines
			if (!h) continue;

			h = h.split(': ');

			key = h.shift().toLowerCase();
			value = h.join(': ');

			r[key] = value;
		}

		return r;
	};
	ajax.jsonp = function(o_options) {
		var originalUrl = o_options.url;
		var success = o_options.success;
		var param = (o_options.param || 'callback');

		var callback = '_jsonp_' + util.id();

		var url = exports.url.parse(originalUrl, true);
		url.query[param] = callback;

		url = exports.url.stringify(url);

		var scriptTag = document.createElement('script');
		scriptTag.type = 'text/javascript';
		scriptTag.async = 1;
		scriptTag.src = url;

		window[callback] = function(data) {
			// Call it
			if (typeof success === 'function') success(data, originalUrl, url);

			// Remove the script tag
			scriptTag.parentNode.removeChild(scriptTag);

			// Delete this callback
			delete window[callback];
		};

		var firstScript = document.getElementsByTagName('script')[0];
		firstScript.parentNode.insertBefore(scriptTag, firstScript);
	};
	var array = exports.array = {};
	array.random = function(a_array) {
		if (!Array.isArray(a_array)) throw new Error('Argument Must Be Array');

		return a_array[Math.floor(Math.random() * a_array.length)];
	};
	var querystring = exports.querystring = {};
	querystring.parse = function(s_qs) {
		if (typeof s_qs !== 'string') throw new Error('Argument Must Be String');

		var r = {};

		s_qs = s_qs.split('&');

		for (var i = 0, x = s_qs.length; i < x; i += 1) {
			var d = s_qs[i].split('=');

			if (d.length == 2) {
				var key = d[0], value = d[1], match;

				key = decodeURIComponent(key);
				value = decodeURIComponent(value);

				if (match = key.match(/(\[([A-Za-z0-9]+)?\])+$/)) {
					var prop = match[1];

					key = key.substr(0, match.index);

					if (prop) {
						// Object
						if (typeof r[key] === 'undefined') {
							r[key] = {};
						}

						r[key][prop] = value;
					} else {
						// Array
						if (typeof r[key] === 'undefined') {
							r[key] = [];
						}

						if (Array.isArray(r[key])) {
							r[key].push(value);
						}
					}
				} else {
					r[key] = value;
				}
			}
		}

		return r;
	};
	querystring.stringify = function(o_data) {
		var root = (arguments.length == 2 && arguments[1] == true);

		var params = [];
		var isArray = Array.isArray(o_data);

		for (var key in o_data) {
			var value = o_data[key];
			var wkey;

			if (isArray) {
				wkey = '';
			} else {
				wkey = key;
			}

			if (root) {
				wkey = root + encodeURIComponent('[' + wkey + ']');
			} else {
				wkey = encodeURIComponent(wkey);
			}

			if (value === null || value === undefined || value === NaN) {
				params.push(wkey + '=');
			} else {
				switch (typeof value) {
					case 'string':
					case 'number':
						params.push(wkey + '=' + encodeURIComponent('' + value));
						break;
					case 'array':
					case 'object':
						params = params.concat(querystring.stringify(value, wkey));
						break;
					case 'boolean':
						params.push(wkey + '=' + (value ? 'true' : 'false'));
						break;
					default:
						if (value) {
							try {
								params.push(wkey + '=' + encodeURIComponent(value.toString()));
							} catch (e) {}
						} else {
							params.push(wkey + '=');
						}
						break;
				}
			}
		}

		return (root ? params : params.join('&'));
	};
	var url = exports.url = {};
	url.parse = function(s_url, b_query) {
		if (typeof s_url !== 'string') throw new Error('Argument Must Be String');
		if (b_query === true && (!querystring || !querystring.parse)) throw new Error('Optional Depenency "querystring.parse" Not Included');

		var reg = /^(([a-z]+):\/\/)?([^:\/]+)?(:([0-9]+))?([^\?#]+)?(\?([^\#]+))?(#(.*))?$/i;
		var match = s_url.match(reg);

		if (!match) return false;

		var query = (match[8] || '');
		if (b_query) query = querystring.parse(query);

		return {
			protocol: match[2] || ''
			, host: match[3] || ''
			, port: match[5] || ''
			, path: match[6] || ''
			, query: query
			, hash: match[10] || ''
		};
	};
	url.sameorigin = function(os_url1, os_url2) {
		if (typeof os_url1 === 'string') os_url1 = url.parse(os_url1);
		if (typeof os_url2 === 'string') os_url2 = url.parse(os_url2);

		if (os_url1.host != os_url2.host) return false;
		if (os_url1.port != os_url2.port) return false;
		if (os_url1.protocol != os_url2.protocol) return false;

		return true;
	};
	url.stringify = function(o_url) {
		if (typeof o_url !== 'object') throw new Error('Argument Must Be Object');

		var r = '';

		if (o_url.protocol) r += o_url.protocol + '://';
		if (o_url.host) r += o_url.host;
		if (o_url.port) r += ':' + o_url.port;
		if (o_url.path) r += o_url.path;
		if (o_url.query) {
			if (typeof o_url.query == 'object' && querystring && querystring.stringify) {
				r += '?' + querystring.stringify(o_url.query);
			} else {
				r += '?' + o_url.query;
			}
		}
		if (o_url.hash) r += '#' + o_url.hash;

		return r;
	};
	var util = exports.util = {};
	util.id = function() {
		return Date.now() + '' + (util.id._counter += 1);
	};

	util.id._counter = 0;

	return module.exports;
})();
