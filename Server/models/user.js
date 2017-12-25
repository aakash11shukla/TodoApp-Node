const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		minlength: 1,
		validate: {
			isAsync: false,
			validator: validator.isEmail,
			message: '{VALUE} is not a valid email'
		}
	},
	password: {
		type: String,
		require: true,
		minlength: 6,
	},
	tokens: [{
		access: {
			type: String,
			require: true
		},
		token: {
			type: String,
			require: true
		}
	}]
}, {usePushEach: true});

UserSchema.methods.toJSON = function (){

	var user = this;
	var UserObject = user.toObject();

	return _.pick(UserObject, ['_id', 'email']);
}

UserSchema.methods.generateAuthToken = function (){
	var user = this;
	var access = 'auth';
	var token = jwt.sign({_id: user._id.toHexString(), access}, '123abc').toString();
	
	user.tokens.push({access, token});

	return user.save().then((user) => {
		return token;
	}); 
};

UserSchema.methods.removeByToken = function (token){
	var user = this;

	return user.update({
		$pull: {
			tokens: {token}
		}
	});
};

UserSchema.statics.findByToken = function (token){
	var User = this;

	try {
		var decode = jwt.verify(token, '123abc');	
	} catch (e){
		return Promise.reject();
	}

	return User.findOne({
		_id: decode._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	});
};

UserSchema.pre('save', function (next){
	var user = this;
	if (user.isModified('password')){
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {
				user.password = hash;
				next();
			});
		});	
	}
	else {
		next();
	}
});

var User = mongoose.model('User', UserSchema);

module.exports = {User};