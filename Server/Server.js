const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

var {ObjectID} = require('mongodb');
var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');

var app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
	var newTodo = new Todo({
		text: req.body.text
	});

	newTodo.save().then((doc) => {
		res.send(doc);
	}, (err) => {
		res.status(400).send(err);
	});
});

app.get('/todos', (req, res) => {
	Todo.find().then((todos) => {
		res.send({todos});
	}, (e) => {
		res.status(400).send(e);
	});
});

app.get('/todos/:id', (req, res) => {
	if (!ObjectID.isValid(req.params.id)){
		res.status(404).send();
	}
	else {
		Todo.findById(req.params.id).then((todo) => {
			if (!todo){
				return res.status(404).send();
			}
			res.send({todo});
		}, (e) => {
			res.status(400).send();
		})
	}
});

app.delete('/todos/:id', (req, res) => {
	if (!ObjectID.isValid(req.params.id)){
		res.status(404).send();
	}
	else{
		Todo.findByIdAndRemove(req.params.id).then((todo) => {
			if (!todo){
				return res.status(404).send();
			}
			res.send({todo});
		}, (err) => {
			res.status(400).send();
		});
	}
});

app.patch('/todos/:id', (req, res) => {
	var id = req.params.id;
	var body = _.pick(req.body, ['text', 'completed']);

	if (!ObjectID.isValid(req.params.id)){
		res.status(404).send();
	}
	else{
		if(_.isBoolean(body.completed) && body.completed)
			body.completedAt = new Date().getTime();
		else{
			body.completed = false;
			body.completedAt = null;
		}

		Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
			if(!todo)
				return res.status(404).send();
			res.send({todo});
		}).catch((e) => {
			res.status(400).send();
		});
	}
});

app.listen(3000, () => {
	console.log(`Server started at port ${port}`);
});

module.exports = {app};