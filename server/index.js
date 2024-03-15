'use strict';

const express = require('express');
const morgan = require('morgan'); // logging middleware
const { check, validationResult } = require('express-validator'); // validation middleware
const dao = require('./dao'); // module for accessing the DB
const passport = require('passport'); // auth middleware
const LocalStrategy = require('passport-local').Strategy; // username and password for login
const session = require('express-session'); // enable sessions
const cors = require('cors');

/*** Set up Passport ***/
// set up the "username and password" login strategy. 
// by setting a function to verify username and password

passport.use(new LocalStrategy(
  function (username, password, done) {
    dao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { message: 'Incorrect username and/or password.' });

      return done(null, user);
    })
  }
));

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {  //come identificativo unico per passport userò l'id dell'utente, che non userò in chiaro ma lo codificherò nel cookie! Chiamata nella dao getUserById
  done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
  dao.getUserById(id)
    .then(user => {
      done(null, user); // this will be available in req.user
    }).catch(err => {
      done(err, null);
    });
});


// init express
const app = new express();
app.use(express.static('public'));
const port = 3001;  //PORTA DEL SERVER

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json());
const corsOptions = {
  origin: 'http://localhost:5173', //PORTA DEL CLIENT
  credentials: true,
};
app.use(cors(corsOptions));


// custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
    return next();

  return res.status(401).json({ error: 'Not authenticated' });
}


// set up the session
app.use(session({
  // by default, Passport uses a MemoryStore to keep track of the sessions
  secret: 'zaw8d239jdj93trskb',   //personalize this random string, should be a secret value.
  resave: false,
  saveUninitialized: false
}));

// then, init passport
app.use(passport.initialize());
app.use(passport.session());

/*** Users APIs ***/
// POST /sessions 
// login

app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json(info);
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err)
        return next(err);
      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser()
      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE /sessions/current 
// logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => { res.end(); });
});

//SERVE PERCHE MAGARI VUOI TIRAR FUORI DELLE INFORMAZIONI SULL'UTENTE AUTENTICATO!. QUESTA API FUNZIONA SE C'è UNA SESSIONE ATTIVA!
// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  }
  else
    res.status(401).json({ error: 'Unauthenticated user!' });;
});

// GET /api/pages
app.get('/api/pages', (req, res) => {
  dao.listPages()
    .then(pages => setTimeout(() => res.json(pages)))
    .catch((err) => { console.log(err); res.status(500).end() });
});

// GET /api/images
app.get('/api/images', (req, res) => {
  dao.listImages()
    .then(images => setTimeout(() => res.json(images)))
    .catch((err) => { console.log(err); res.status(500).end() });
});

// GET /api/title
app.get('/api/title', (req, res) => {
  dao.getTitle()
    .then(title => setTimeout(() => res.json(title)))
    .catch((err) => { console.log(err); res.status(500).end() });
});

// GET /api/authors
app.get('/api/authors', (req, res) => {
  dao.listAuthors()
    .then(authors => setTimeout(() => res.json(authors)))
    .catch((err) => { console.log(err); res.status(500).end() });
});


// POST /api/pages
app.post('/api/pages', isLoggedIn, [
  check('creationDate').isDate({ format: 'YYYY-MM-DD', strictMode: true }),
  check('title').isLength({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  else {
    const page = {
      title: req.body.title,
      authorId: req.user.id,
      creationDate: req.body.creationDate,
      publishDate: req.body.publishDate,
      blocks_array: req.body.blocks_array,
    };
    try {
      const pageId = await dao.createPage(page);
      // Return the newly created id of the question to the caller. 
      setTimeout(() => res.status(201).json(pageId));
    } catch (err) {
      console.log(err);
      res.status(503).json({ error: `Database error during the creation of page ${page.title} by ${page.authorId}.` });
    }
  }
});

// DELETE /api/pages/<id>  PAGINE
app.delete('/api/pages/:id', isLoggedIn, async (req, res) => {
  try {
    const numRowChanges = await dao.deletePage(req.params.id, req.user);
    // number of changed rows is sent to client as an indicator of success
    setTimeout(() => res.json(numRowChanges));
  } catch (err) {
    console.log(err);
    res.status(503).json({ error: `Database error during the deletion of page ${req.params.id}.` });
  }
});

// PUT /api/pages/<id>  
app.put('/api/pages/:id', isLoggedIn, [
  check('title').isLength({ min: 1 }),
  check('creationDate').isDate({ format: 'YYYY-MM-DD', strictMode: true }),
  check('authorId').isInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const page = req.body;
  // you can also check here if the id passed in the URL matches with the id in req.body,
  // and decide which one must prevail, or return an error
  page.id = req.params.id;
  try {     //req.userid ti fa capire chi è l'utente attualmente loggato alla sessione attuale!
    const numRowChanges = await dao.updatePage(page, req.user);
    setTimeout(() => res.json(numRowChanges));
  } catch (err) {
    console.log(err);
    res.status(503).json({ error: `Database error during the update of page ${req.params.id}.` });
  }
});

// PUT /api/title 
app.put('/api/title', isLoggedIn, [
  check('titleName').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  const title = req.body;

  try {     //req.userid ti fa capire chi è l'utente attualmente loggato alla sessione attuale!
    const numRowChanges = await dao.updateTitle(title, req.user);
    setTimeout(() => res.json(numRowChanges));
  } catch (err) {
    console.log(err);
    res.status(503).json({ error: `Database error during the update of title.` });
  }
});

// GET /api/users
app.get('/api/users', isLoggedIn, async (req, res) => {
  if (req.user.administrator) {
    try {
      const users = await dao.listUsers();
      res.json(users);
    } catch (err) {
      console.log(err);
      res.status(500).end();
    }
  }
  else {
    res.status(401).end();
  }
});

