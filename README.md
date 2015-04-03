# Procrastination

An infinitely scrolling reddit browser. It works by being a custom 404 error page, allowing to to use the same url structure as reddit. It embeds content from the following sites:

- Flickr
- Gfycat
- Imgur
- Instagram
- Tumblr
- Twitter
- Vimeo
- Vine
- YouTube

## Commands

```
node server.js # Runs a simple http server on port 8080
grunt dev # Creates an unminified deployment in release/
grunt prod # Creates a minified deployment in release/
```

## Setup

The file `src/config.js` contains settings required for content from [Imgur](http://api.imgur.com/), [Tumblr](https://www.tumblr.com/docs/en/api/v2), and [Twitter](https://dev.twitter.com/) to embed correctly. These must be configured before running `grunt`.
