const expect = require('expect');
const request = require('supertest');

var {ObjectID} = require('mongodb');
var {app} = require('./../Server');
var {Todo} = require('./../models/todo');

beforeEach((done) => {
	Todo.remove({}).then(() => {
		return Todo.insertMany(todos);
	}).then(() => done());
});

var todos = [{
	_id: new ObjectID(),
	text: 'Test todo text1'
},{
	_id: new ObjectID(),
	text: 'Test todo text2',
	completed: true
}];

describe('POST /todos', () => {

	it('should create a Todo', (done) => {

		var text = 'Test todo text';
		request(app)
			.post('/todos')
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
			.expect(200)
			.expect((res) => {
				expect(res.body.todos.length).toBe(2);
			})
			.end(done);
	});
});

describe('GET /todos/:id', () => {

	it('should return a todo', (done) => {
		request(app)
			.get(`/todos/${todos[0]._id.toHexString()}`)
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
			.expect(404)
			.end(done);
	});

	it('should return a 404', (done) => {
		request(app)
			.get('/todos/123acs')
			.expect(404)
			.end(done);
	});
});

describe('DELETE /todos/:id', () => {

	var HexId = todos[1]._id.toHexString();

	it('should delete a todo', (done) => {
		request(app)
			.delete(`/todos/${HexId}`)
			.expect(200)
			.expect((res) => {
				expect(res.body.todo.text).toBe(todos[1].text);
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
			.expect(404)
			.end(done);
	});

	it('should return a 404', (done) => {
		request(app)
			.delete('/todos/123sefc')
			.expect(404)
			.end(done);
	});
});

describe('PATCH /todos/:id', () => {
	it('should update a todo', (done) => {
		var HexId = todos[0]._id.toHexString();
		var text = 'Test todo text1(mod)'
		request(app)
			.patch(`/todos/${HexId}`)
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

				Todo.findById(HexId).then((todo) => {
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