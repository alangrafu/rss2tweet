var Twit = require('twit')
var fs = require('fs');



var config = require('./config.json');
var T = new Twit(config.credentials)



var FeedParser = require('feedparser'),
    request = require('request');
var options = {};

(function getFeed(i){
  if(i >= config.blogs.length){
    for(var j=0; j < config.blogs.length; j++){
      if(config.blogs[j].lasttimestamp != undefined){
        config.blogs[j].timestamp = config.blogs[j].lasttimestamp;
        delete config.blogs[j].lasttimestamp;
      }
    }
    fs.writeFile("config.json", JSON.stringify(config));
    return;
  }
  var feedparser = new FeedParser([options]);
  console.log("request "+i+" "+ config.blogs[i].url);
  var req = request(config.blogs[i].url);

  req.on('error', function (error) {  console.log("can;'t connect!");});
  req.on('response', function (res) {
    var stream = this;
    if (res.statusCode != 200) return this.emit('error', new Error('Bad status code'));
    stream.pipe(feedparser);
    setTimeout(function(){getFeed(i+1);}, 1000);

  });


  feedparser.on('error', function(error) {console.log("not readble!");console.log(error)});
  feedparser.on('readable', function() {

    // This is where the action is!
    var stream = this
      , meta = this.meta // **NOTE** the "meta" is always available in the context of the feedparser instance
      , item;

      while (item = stream.read()) {
        setTimeout(
          (function(post){
                      var maxLength = 140;
                      var thisDate = parseInt(new Date(post.pubdate).getTime());
                      if(thisDate > config.blogs[i].timestamp){
                        config.blogs[i].lasttimestamp = thisDate;
                        console.log("     ---->   "+post.title+" "+post.link+" "+thisDate+" "+i+" "+config.blogs[i].timestamp);
                        var maxLengthMsg = Math.min(maxLength - post.link.length -1, post.title.length);
                        var msg = post.title.substring(0, maxLengthMsg)+" "+post.link;
                        //T.post('statuses/update', { status:msg }, function(err, data, response) {})
                      }

                  })(item), 5000);
      }
  });

})(0);
