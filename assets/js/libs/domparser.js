(function(DOMParser) {
	'use strict';
	
	var DOMParser_proto = DOMParser.prototype
	, real_parseFromString = DOMParser_proto.parseFromString;

	try {
		if ((new DOMParser).parseFromString('', 'text/html')) {
			return;
		}
	} catch (e) {}

	DOMParser_proto.parseFromString = function(markup, type) {
		if ((/^\s*text\/html\s*(?:;|$)/i).test(type)) {
			var doc = document.implementation.createHTMLDocument('');

			if (markup.toLowerCase().indexOf('<!doctype') > -1) {
				doc.documentElement.innerHTML = markup;
			} else {
				doc.body.innerHTML = markup;
			}
			
			return doc;
		} else {
			return real_parseFromString.apply(this, arguments);
		}
	};
})(DOMParser);
