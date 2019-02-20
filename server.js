const express = require('express');
const Twitter = require('twitter');
const http = require('http');
const session = require('express-session');
const cors = require('cors');
const passport = require('passport');
const socketio = require('socket.io');
const TwitterStrategy = require('passport-twitter').Strategy;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors({ origin: 'http://localhost:8080' }));
app.use(express.json());
app.use(
  session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Authenticate user to obtain their Twitter info
passport.use(
  new TwitterStrategy(
    {
      consumerKey: 'ffb8Sc2OmYPsCVi0O9xa8fC7U',
      consumerSecret: 'vzbagOURxzDmI55g1C6lU7rI1BQAYjpZUZXwEUA5TL5rVuR5As',
      callbackURL: 'http://127.0.0.1:8001/api/auth/twitter/callback'
    },
    (token, tokenSecret, profile, cb) => {
      return cb(null, profile);
    }
  )
);

// Used for Twitter RESTful API
const twitter = new Twitter({
  consumer_key: 'ffb8Sc2OmYPsCVi0O9xa8fC7U',
  consumer_secret: 'vzbagOURxzDmI55g1C6lU7rI1BQAYjpZUZXwEUA5TL5rVuR5As',
  access_token_key: '175254675-zf1n7VzVCk30MYMt6VyrD9gVV3UAFdKQP9vRpyvb',
  access_token_secret: 'ZJH4XCevAN2qh6cxfCWVsth57PZusXgiirIZWeOLHIcXp'
});

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});

const twitterAuth = passport.authenticate('twitter');

app.get('/api/auth/twitter', twitterAuth);

app.get('/api/auth/twitter/callback', twitterAuth, async (req, res) => {
  req.user.friendsToUnfollow = []; // req.user === auth'd Twitter user

  // Get user's friends
  const params = { user_id: req.user.id, count: 200 };
  const friendsResp = await twitter.get('friends/list', params).catch(err => {
    console.log('GET friends/list error', err);
  });
  let friends = friendsResp.users;

  // Loop through friends
  friends.forEach(async friend => {
    const params = {
      source_screen_name: friend.screen_name,
      target_screen_name: 'realDonaldTrump'
    };
    // Determine relationship w/ target celebrity
    const friendshipsResp = await twitter
      .get('friendships/show', params)
      .catch(err => {
        console.log('GET friendships/show error', err);
      });
    const relationship = friendshipsResp.relationship;
    // If friend follows target, add them to unfollow list
    if (relationship.target.followed_by === true) {
      req.user.friendsToUnfollow.push(friend);
      io.emit('user', req.user);
    }
  });

  res.end();
});

const port = process.env.PORT || 8001;

server.listen(port, () => {
  console.log('Server listening on port', port);
});
