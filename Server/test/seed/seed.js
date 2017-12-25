const jwt = require('jsonwebtoken');
const {ObjectID} = require('mongodb');

var userOneId = new ObjectID();
var userTwoId = new ObjectID();

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const users = [{
	_id: userOneId, 
	email: "aakash@example.com",
	password: "userOnePass",
	tokens: [{
		access: 'auth',
		token: jwt.sign({_id: userOneId.toHexString(), access: 'auth'}, '123abc').toString()
	}]
},{
	_id: userTwoId,
	email: "light@gmail.com",
	password: "userTwoPass",
	tokens: [{
		access: 'auth',
		token: jwt.sign({_id: userTwoId.toHexString(), access: 'auth'}, '123abc').toString()
	}]
}];

const todos = [{
	_id: new ObjectID(),
	_creator: userOneId,
	text: 'Test todo text1'
},{
	_id: new ObjectID(),
	_creator: userTwoId,
	text: 'Test todo text2',
	completed: true
}];

const populateTodos = (done) => {
	Todo.remove({}).then(() => {
		return Todo.insertMany(todos);
	}).then(() => done());
};

const populateUsers = (done) => {
	User.remove({}).then(() => {
		var userOne = new User(users[0]).save();
		var userTwo = new User(users[1]).save();

		return Promise.all([userOne, userTwo]);
	}).then(() => done());
};

module.exports = {todos, users, populateTodos, populateUsers};