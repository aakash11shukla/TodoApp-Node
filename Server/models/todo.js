const mongoose = require('mongoose');

var Todo = mongoose.model('Todo', {
	text: {
		type: String,
		required: true,
		trim: true,
		minlength: 1
	},
	completed: {
		type: Boolean,
		default: false
	},
	completedAt: {
		type: Number,
		default: null
	},
	_creator: {
		require: true,
		type: mongoose.Schema.Types.Object
	}
});

module.exports = {Todo};