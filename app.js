// import  modules
const Sequelize = require ('sequelize')
const express = require ('express')
const session = require ('express-session')
var bodyParser = require('body-parser')
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
	name: Sequelize.STRING,
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
	let firstProm = Post.findAll( {
		attributes: [ 'id', 'title', 'content']
		// include: [User]
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
			message: req.session.message,
			user: req.session.user,
			posts: data
		} )
	})
})

app.get( '/login', (req, res) => {
	var user = req.session.user
	if (user == undefined) {
		res.redirect( '/?message=' + encodeURIComponent('log in'))
	} else {
		let firstProm = Post.findAll( {
			attributes: ['id', 'title', 'content']
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
				message: req.session.message,
				user: user,
				posts: data
			} )
		})
	}
})

app.post( '/login', bodyParser.urlencoded({extended: true}), (req, res) => {
	if ( req.body.email.length === 0 ) {
		res.redirect( '/?message=' + encodeURIComponent('WRONG'))
		return
	}
	User.findOne( {
		where: {
			email: req.body.email
		}
	}).then( user => {
		if ( user != null ) {
			// assign the session user
			req.session.user = user
			res.redirect( '/' )
		}
	}, error => {
		res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
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
	let userDets = {
		name: req.body.name,
		email: req.body.email,
		password: req.body.password
	}
	if ( req.body.password != req.body.repeatpassword ) {
		res.redirect('/register?message=' + encodeURIComponent("passwords are different"))
	} else { 
	// see if the email has already been used
		User.count ( {
			where: {
				email: req.body.email
			}
		} ).then( num => {
			if ( num > 0 ) {
				res.redirect('/register?message=' + encodeURIComponent("email already exists"))
			} else {
				User.create( userDets )
				res.redirect( '/' )
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

app.post( '/showpost', bodyParser.urlencoded({extended: true}), ( req, res ) => {
	// use this to write a comment for a blog post
	var user = req.session.user
	var queryObject = req.query
	var id = document.getElementById('para')
	console.log(req.body)
	// Post.findOne( { 
	// 	where: { title: queryObject.title },
	// }).then( post => {
	// 	// post.createComment({
	// 	// 	comText: req.body.comment
	// 	// })
	// 	// console.log(post)
	// })
})

app.get( '/showcomments', (req, res) => {
	var user = req.session.user
	var queryObject = req.query
	console.log("hello, it's me")
	Post.findOne({
		where: { title: queryObject.title},
		attributes: [ 'title' ],
		include: [
			{model: Comment}
			]
	}).then( post => {
		// res.send
		for (var i = post.dataValues.comments.length - 1; i >= 0; i--) {
			console.log(post.dataValues.comments[i].dataValues.comText)
		}
		// console.log(post.dataValues.title)
	})
})

app.get( '/showpost', bodyParser.urlencoded({extended: true}), ( req, res ) => {
	// show post selected by the user on separate page
	var user = req.session.user
	var queryObject = req.query
	Post.findOne( {
		// find the post which has been clicked on
		where: { title: queryObject.title},
		attributes: [ 'id', 'title', 'content']
	}).then( post => {
			res.render( 'post', {
				user: user,
				// message: req.session.message,
				thePost: post
			} )
		}
	)
})
// sync the database
db.sync( {force: true} ).then((  ) => { // ({force: true})
	console.log( 'synced yay' )
	User.create( {
		name: 'Auguste', 
		email: 'hello@it.is',
		password: 'trial'
	})
	User.create( {
		name: 'Guga', 
		email: 'bye@it.is',
		password: 'no'
	})
	Post.create( {
		title: "Example title",
		content: "Example text"
	}).then( post => {
		post.createComment({
			comText: "Commentt"
		})
		post.createComment({
			comText: "Another One"
		})
	})
	Post.create( {
		title: "Example 2",
		content: "Example text 2"
	}).then( post => {
		post.createComment({
			comText: "Some comment text"
		})
	})
	// Comment.create( {
	// 	comText: "Some comment text"
	// })
})

// use this when app finished
// db.sync()

// set up the server connection
app.listen( 8000 )