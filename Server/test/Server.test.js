const expect = require('expect');
const request = require('supertest');

var {ObjectID} = require('mongodb');
var {app} = require('./../Server');
var {Todo} = require('./../models/todo');
var {User} = require('./../models/user');

const {todos, users, populateTodos, populateUsers} = require('./seed/seed');

beforeEach(populateTodos);

beforeEach(populateUsers);

describe('POST /todos', () => {

	it('should create a Todo', (done) => {

		var text = 'Test todo text';
		request(app)
			.post('/todos')
			.set('x-auth', users[0].tokens[0].token)
			.send({text})
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe(text);
			})
			.end((err, res) => {
				if (err){
					return done(err);
				}

				Todo.find({text}).then((todos) => {
					expect(todos.length).toBe(1);
					expect(todos[0].text).toBe(text);
					done();
				}).catch((err) => {
					done(err);
				});

		});
	});

	it('should not create a Todo', (done) => {

		request(app)
			.post('/todos')
			.set('x-auth', users[0].tokens[0].token)
			.send({})
			.expect(400)
			.end((err, res) => {
				if (err){
					return done(err);
				}

				Todo.find().then((todos) => {
					expect(todos.length).toBe(2);
					done();
				}).catch((err) => {
					done(err);
				});
			});

	});

});

describe('GET /todos', () => {

	it('should get all todos', (done) => {
		request(app)
			.get('/todos')
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body.todos.length).toBe(1);
			})
			.end(done);
	});
});

describe('GET /todos/:id', () => {

	it('should return a todo', (done) => {
		request(app)
			.get(`/todos/${todos[0]._id.toHexString()}`)
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(todos[0].text);
			})
			.end((err, res) => {
				if (err){
					return done(err);
				}
				done();
			});
	});

	it('should return no todo', (done) => {
		var HexId = new ObjectID().toHexString();

		request(app)
			.get(`/todos/${HexId}`)
			.set('x-auth', users[0].tokens[0].token)
			.expect(404)
			.end(done);
	});

	it('should return a 404', (done) => {
		request(app)
			.get('/todos/123acs')
			.set('x-auth', users[0].tokens[0].token)
			.expect(404)
			.end(done);
	});
});

describe('DELETE /todos/:id', () => {

	var HexId = todos[0]._id.toHexString();

	it('should delete a todo', (done) => {
		request(app)
			.delete(`/todos/${HexId}`)
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(todos[0].text);
			})
			.end((err, res) => {
				if (err){
					return done(err);
				}
				
				Todo.findById(HexId).then((todo) => {
					expect(todo).toBe(null);
					done();
				}).catch((e) => done(e));
			});
	});

	it('should not delete a todo', (done) => {
		request(app)
			.delete(`/todos/${new ObjectID().toHexString()}`)
			.set('x-auth', users[0].tokens[0].token)
			.expect(404)
			.end(done);
	});

	it('should return a 404', (done) => {
		request(app)
			.delete('/todos/123sefc')
			.set('x-auth', users[0].tokens[0].token)
			.expect(404)
			.end(done);
	});
});

describe('PATCH /todos/:id', () => {
	it('should update a todo', (done) => {
		var HexId = todos[1]._id.toHexString();
		var text = 'Test todo text2(mod)'
		request(app)
			.patch(`/todos/${HexId}`)
			.set('x-auth', users[1].tokens[0].token)
			.send({
				text,
				completed: true
			})
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(text)
				expect(res.body.todo.completed).toBe(true)
				expect(res.body.todo.completedAt).toBeA('number')
			})
			.end((err, res) => {
				if (err)
					return done(err);

				Todo.findOne({
					_id: HexId,
					_creator: users[1]._id
				}).then((todo) => {
					expect(todo.text).toBe(text)
					expect(todo.completed).toBe(true)
					expect(todo.completedAt).toBeA('number')
					done();
				}).catch((e) => done(e));
			});
	});

	it('should set completedAt to null', (done) => {
		var HexId = todos[1]._id.toHexString();
		var completed = false;
		request(app)
			.patch(`/todos/${HexId}`)
			.set('x-auth', users[1].tokens[0].token)
			.send({
				text: todos[1].text,
				completed
			})
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.completedAt).toBe(null)
			})
			.end((err, res) => {
				if (err)
					return done(err);

				Todo.findById(HexId).then((todo) => {
					expect(todo.text).toBe(todos[1].text)
					expect(todo.completedAt).toBe(null)
					done();
				}).catch((e) => done(e));
			});
	});
});

describe('GET /users/me', () => {
	it('should return a user if authenticated', (done) => {

		request(app)
			.get('/users/me')
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body._id).toBe(users[0]._id.toHexString());
				expect(res.body.email).toExist();
			})
			.end(done);
	});

	it('should return a 401 if not authenticated', (done) => {

		request(app)
			.get('/users/me')
			.expect(401)
			.expect((res) => {
				expect(res.body).toEqual({});
			})
			.end(done);
	});
});

describe('POST /users', () => {
	it('should create a user', (done) => {

		var email = 'Aakashshukla@example.com';
		var password = 'aksh1234';

		request(app)
			.post('/users')
			.send({email, password})
			.expect(200)
			.expect((res) => {
				expect(res.header['x-auth']).toExist();
				expect(res.body._id).toExist();
				expect(res.body.email).toBe(email);
			})
			.end((err) => {
				if (err){
					return done(err);
				}

				User.findOne({email}).then((user) => {
					expect(user).toExist();
					expect(user.password).toNotBe('aksh1234');
					done();
				}).catch((err) => {
					done(err);
				});
			});
	});

	it('should return validation errors if request invalid', (done) => {

		request(app)
			.post('/users')
			.send({
				email: 'asas',
				password: '3122e2e12'})
			.expect(400)
			.end(done);
	});

	it('should not create user', (done) => {

		request(app)
			.post('/users')
			.send({
				email: users[0].email,
				password: '13143141'})
			.expect(400)
			.end(done);
	});
});

describe('DELETE /users/me/token', () => {
	it('should log out the user', (done) => {

		request(app)
			.delete('/users/me/token')
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body).toEqual({})
			})
			.end((err, res) => {
				if (err){
					return done(err);
				}

				User.findOne({email: users[0].email}).then((user) => {
					expect(user.tokens.length).toBe(0);
					done();
				}).catch((err) => {
					done(err);
				});
			});
	});
});