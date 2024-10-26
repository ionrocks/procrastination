# Procrastination

An infinitely scrolling reddit browser. It works by being a custom 404 error page, allowing it to use the same url structure as reddit. It embeds content from a variety of sites. Now built with [Hugo](https://gohugo.io).

## Commands

```
hugo server # For testing
hugo --minify # For production
```

## Setup

The file `assets/js/config.js` contains settings required for content from [Imgur](http://api.imgur.com/), [Tumblr](https://www.tumblr.com/docs/en/api/v2), and [Twitter](https://dev.twitter.com/) to embed correctly. These must be configured for proper deployment.
