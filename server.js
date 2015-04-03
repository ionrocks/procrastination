var path = require('path');
var express = require('express');

var app = express();

app.use(express.static(path.join(__dirname, 'release')));

app.use(function(req, res) {
	res.sendFile(path.join(__dirname, 'release/index.html'));
});

app.listen(8080);
