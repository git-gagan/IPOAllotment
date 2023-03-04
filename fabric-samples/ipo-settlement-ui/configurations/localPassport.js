import passport from 'passport'
import LocalStrategy from 'passport-local'
import db from './sqliteConnection.js'

// AUth using passport
passport.use(new LocalStrategy({
    usernameField: 'user_name',
}, (username, password, done) => {
    console.log("INSIDEEEE Passport");
    db.get(`SELECT * FROM tbl_user where user_name = ? and user_pwd = ?`, [username, password], async (err, row) => {
        if (err) {
            return done(err);
        }
        else if (row) {
            return done(null, row)
        } else {
            return done(null, false)
        }
    })
}))


// serializing the user
passport.serializeUser((user, done) => {
    done(null, user.user_name)
})

// deserializing the user
passport.deserializeUser((user_name, done) => {
    db.get(`SELECT * FROM tbl_user where user_name = ?`, [user_name], async (err, user) => {
        if (err) {
            return done(err);;
        }
        return done(null, user)
    })
})

passport.checkAuthentication = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next()
    }
    return res.redirect('/users/login')
}

passport.checkLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    return next()
}


passport.setAuthenticatedUser = (req, res, next) => {
    if (req.isAuthenticated()) {
        res.locals.user = req.user
    }
    next()
}


export default passport