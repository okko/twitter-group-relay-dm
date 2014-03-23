var Stream = require('user-stream'),
    Twit = require('twit');

var options = {
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    follow_password: process.env.FOLLOW_PASSWORD,
    recipients: process.env.RECIPIENTS.split(","),
    self_screen_name: process.env.SELF_SCREEN_NAME
};

for (var opt in options) {
  if (options[opt] == null) {
      console.log(opt + ' must be specified');
      process.exit(1);
  }
}

var T = new Twit({
    consumer_key: options['consumer_key'],
    consumer_secret: options['consumer_secret'],
    access_token: options['access_token_key'],
    access_token_secret: options['access_token_secret']
});
    
// https://github.com/aivis/user-stream
var stream = new Stream(options);
stream.stream();

function follow_back(user_id, screen_name) {
    T.post('friendships/create', {user_id: user_id}, function (err, reply) {
            if (err == null) {
                console.log('Followed back ' + screen_name + ',' + user_id);
                console.log(reply);
            } else {
                console.log('ERROR unable to follow back ' + screen_name + ':');
                console.log(err);
            }
    });
}

//listen stream data
stream.on('data', function(json) {
    if (json.event == 'follow') {
        follow_back(json.source.id, json.source.screen_name);
    } else if (json.direct_message) {
        var msg = json.direct_message;
        if (msg.sender.screen_name == options['self_screen_name']) {
            return;
        };
        var txt = msg.text;
        var recipients = options['recipients'];
        recipients.forEach(function (recipient) {
                T.post('direct_messages/new', {screen_name: recipient, text: '@' + msg.sender.screen_name + ' ' + txt}, function (err, reply) {
                        if (err != null) {
                            console.log('ERROR in direct_messaging to ' + recipient + ':');
                            console.log(err);
                        }
                });
        });
    } else if (json.text && json.text.substring(0,1) == '@') {
        var words = json.text.split(" ");
        if (words[1] == options['follow_password']) {
            console.log('password correct');
        }
    }
    console.log(json);
});
