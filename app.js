// import  modules
const Sequelize = require ('sequelize')
const express = require ('express')
const session = require ('express-session')
const bodyParser = require('body-parser')
const bcrypt = require ( 'bcrypt' )
const htmlParser = require ( 'html-parser' )
const app = express()

// set up the views engine
app.set('views', './views')
app.set('view engine', 'pug')

// For logged in user start session
app.use( 
	express.static( 'includes' ),
	session ({
		secret: 'this is some secret',
		resave: true,
		saveUninitialized: false
	})
)

// connect to database blog_app
let db = new Sequelize( 'blog_app', 'augustenausedaite', null, {
	server: 'localhost',
	dialect: 'postgres'
})

// Define the models of the database
let User = db.define( 'user', {
	name: {type: Sequelize.STRING, unique: true},
	// make email unique!
	email: {type: Sequelize.STRING, unique: true},
	password: Sequelize.STRING
})

let Post = db.define( 'post', {
	title: Sequelize.STRING,
	content: Sequelize.TEXT
})

let Comment = db.define( 'comments', {
	comText: Sequelize.TEXT,
})

// Define relations
User.hasMany( Post )
User.hasMany( Comment )
Post.hasMany( Comment )
Post.belongsTo( User )
Comment.belongsTo( User )
Comment.belongsTo( Post )

// set up the express routes

app.get( '/', (req, res) => {
	var user = req.session.user
	let firstProm = Post.findAll( {
		attributes: [ 'id', 'title', 'content']
	})
	let secondProm = firstProm.then( data => {
		let ddata = []
		for (var i = data.length - 1; i >= 0; i--) {
			ddata.push( data[i].dataValues )
		}
		return ddata
	})
	let thirdProm = secondProm.then( ( data ) => {
		res.render( 'index', {
			filter: "off",
			message: req.session.message,
			user: req.session.user,
			posts: data
		} )
	})
})

app.get( '/filter', (req, res) => {
	var user = req.session.user
	let firstProm = Post.findAll( {
		// filter out the posts to show only users
		where: {userId: user.id},
		attributes: [ 'id', 'title', 'content']
	})
	let secondProm = firstProm.then( data => {
		let ddata = []
		for (var i = data.length - 1; i >= 0; i--) {
			ddata.push( data[i].dataValues )
		}
		return ddata
	})
	let thirdProm = secondProm.then( ( data ) => {
		res.render( 'index', {
			filter: "on",
			message: req.session.message,
			user: req.session.user,
			posts: data
		} )
	})
})

app.get( '/login', (req, res) => {
	var user = req.session.user
	res.redirect('/?hello')
})

app.post( '/login', bodyParser.urlencoded({extended: true}), (req, res) => {
	if ( req.body.email.length === 0 || req.body.password.length === 0 ) {
		res.redirect( '/?message=' + encodeURIComponent('WRONG'))
		return
	}
	User.findOne( {
		where: {
			email: req.body.email
			// password: req.body.password
		}
	}).then( user => {
		if ( user != null ) {
			//if user not empty compare hashed passwords
			bcrypt.compare( req.body.password, user.dataValues.password, (err, result) => {
				if (result == true) {
					req.session.user = user
					res.redirect( '/' )
				} else {
					res.redirect('/?message=' + encodeURIComponent("Invalid email or password."))
				}
			})
		} else {
			res.redirect('/?message=' + encodeURIComponent("Invalid email or password."))
		}
	}, error => {
		res.redirect('/?message=' + encodeURIComponent("Invalid email or password."))
	})
})

app.get('/logout', function (req, res) {
	req.session.destroy( error => {
		if (error) {
			throw error;
		}
		res.redirect('/?message=' + encodeURIComponent("logged out."))
	})
})

app.get('/register', (req, res) => {
	res.render( 'register' )
})

app.post('/register', bodyParser.urlencoded({extended: true}), (req, res) => {
	// post request to register new user
	let userDets = {
		name: req.body.name,
		email: req.body.email,
		password: req.body.password
	}
	if ( req.body.password != req.body.repeatpassword ) {
		res.redirect('/register?message=' + encodeURIComponent("passwords are different"))
	} else if (req.body.password.length < 8) {
		res.redirect('/register?message=' + encodeURIComponent("password too short"))
	} else { 
	// see if the email or username has already been used
		User.count ( {
			where: Sequelize.or(
				{email: req.body.email},
				{ name: req.body.name }
				)
		} ).then( num => {
			if ( num > 0 ) {
				res.redirect('/register?message=' + encodeURIComponent("username or email already exists"))
			} else {				
				bcrypt.hash(req.body.password, 8, ( err, hash ) => {
					if (err) throw err
					User.create({
						name: req.body.name,
						email: req.body.email,
						password: hash
					})
					res.redirect( '/' )
				})
			}
		})
	}
})

app.get( '/create', (req, res) => {
	// show the page to create the post
	var user = req.session.user
	res.render( 'createpost', {
		user: user,
		message: req.session.message
	})
})

app.post( '/create', bodyParser.urlencoded({extended: true}), ( req, res ) => {
	var user = req.session.user
	// find the user
	User.findOne( {
		where: {email: user.email}
		})
	.then( user => {
		// add post to the database acccording to the blogPost model
		// and it belongs to the logged in user
		user.createPost({
			title: req.body.title,
			content: req.body.textarea
		})
	})
	.then( () => {
		res.redirect ( '/' )
	})
})

app.get( '/showcomments', (req, res) => {
	var user = req.session.user
	var queryObject = req.query
	// with first promise we find all coments of the post and put them in an array
	let firstProm = Post.findOne({
		where: { title: queryObject.title},
		attributes: [ 'title' ],
		include: [
			{model: Comment}
			]
	}).then( post => {
		let commentArray = []
		for (var i = post.dataValues.comments.length - 1; i >= 0; i--) {
			commentArray.push(post.dataValues.comments[i].dataValues)
			// console.log(post.dataValues.comments[i].dataValues.comText)
		}
		return commentArray
	})
	// with second promise send the array back to the front-end
	let secondProm = firstProm.then( comments => {
		res.send( comments )
	} )
})

app.get( '/showpost', bodyParser.urlencoded({extended: true}), ( req, res ) => {
	// show post selected by the user on separate page
	var user = req.session.user
	var queryObject = req.query
	Post.findOne( {
		// find the post which has been clicked on
		where: { title: queryObject.title},
		attributes: [ 'id', 'title', 'content', 'userId'], 
		include: [User, Comment]
	}).then( post => {
		User.findOne({
			where: {id: post.dataValues.userId }
		}).then( author => {
				res.render( 'post', {
					user: user,
					author: author.dataValues.name,
					thePost: post
				} )
			})
		}
	)
})

app.post( '/addcomment', bodyParser.urlencoded({extended: true}), ( req, res ) => {
	let user = req.session.user
	// fetch the comment of the user
	let comment = req.body.comment
	// Find Post
	// Create comment to the post by the user!
	User.findOne ({
		// first identify user posting comment
		where: {name: user.name}
	}).then ( user => {
		Post.findOne ( {
			// identify the post on which the comment is being posted on
			where: {title: req.body.title},
			attributes: [ 'id', 'title', 'content']
		}).then( post => {
			post.createComment({
				// finally create the comment!
				comText: req.body.comment
			}).then( comment => {
				// set the comment to belong to the user
				comment.setUser( user )
				res.send( {
					user: user,
					thePost: post,
					comment: comment.dataValues.comText
				} )
			})
		})
	})
	// res.send(req.body.comment)
})

// use this when app finished
db.sync()

// set up the server connection
app.listen( 8000 )