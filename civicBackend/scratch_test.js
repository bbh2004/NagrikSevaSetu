const Joi = require('joi');

const schema = Joi.object({
  description: Joi.string().empty('').allow(null).optional(),
  voiceNoteUrl: Joi.string().empty('').allow(null).optional()
}).xor('description', 'voiceNoteUrl');

const test = (data) => {
  const { error } = schema.validate(data);
  console.log(JSON.stringify(data), '=>', error ? error.message : 'OK');
};

test({ description: 'valid desc' });
test({ voiceNoteUrl: 'http://voice.com' });
test({ description: 'valid desc', voiceNoteUrl: 'http://voice.com' });
test({});
test({ description: '', voiceNoteUrl: 'http://voice.com' });
test({ description: 'hello world', voiceNoteUrl: '' });
test({ description: null, voiceNoteUrl: 'http://voice.com' });
