#!/usr/bin/env node

var GitHubAPI = require("github");
var minimist  = require("minimist");
var exec      = require("child_process").exec;
var cache     = []

configuration = minimist(process.argv.slice(2), {
  alias: {
    username: "u",
    password: "p",
    frequency: "f",
    verbose: "v"
  },
  boolean: "verbose",
  default: {
    frequency: "30",
    verbose: false
  }
});

var github = new GitHubAPI({
  version: "3.0.0",
});

if (configuration.username && configuration.password) {
  github.authenticate({
    type: "basic",
    username: configuration.username,
    password: configuration.password
  });
}

function query(path) {
  var components = path.split("/");

  var user       = components[0];
  var repository = components[1];

  repository = github.repos.get({ user: user, repo: repository }, function(error, data) {
    if (error) console.log(error);

    var cachedRepository = cache.filter(function(o){ return o.path == path })[0];

    if (cachedRepository) {
      if (cachedRepository.stars < data.watchers) {
        if (configuration.verbose) {
          console.log("New stars on " + cachedRepository.path + "!");
        }

        exec('afplay ' + __dirname + '/victory.mp3');
      }

      cachedRepository.stars = data.watchers;
    } else {
      cache.push({
        path: path,
        stars: data.watchers
      });
    }

    if (configuration.verbose) {
      console.log("Queried " + path);
    }
  });
}

interval = setInterval(function() {
  configuration._.forEach(function(repository) {
    query(repository);
  });
}, parseInt(configuration.frequency) * 1000)
