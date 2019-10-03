'use strict';
const {PassThrough} = require('stream');
const isCwebpReadable = require('is-cwebp-readable');
const cwebp = require('cwebp-bin');
const execa = require('execa');
const isStream = require('is-stream');

const createCwebpStream = (input, options = {}) => {
	const args = [
		'-quiet',
		'-mt'
	];

	if (options.preset) {
		args.push('-preset', options.preset);
	}

	if (options.quality) {
		args.push('-q', options.quality);
	}

	if (options.alphaQuality) {
		args.push('-alpha_q', options.alphaQuality);
	}

	if (options.method) {
		args.push('-m', options.method);
	}

	if (options.size) {
		args.push('-size', options.size);
	}

	if (options.sns) {
		args.push('-sns', options.sns);
	}

	if (options.filter) {
		args.push('-f', options.filter);
	}

	if (options.autoFilter) {
		args.push('-af');
	}

	if (options.sharpness) {
		args.push('-sharpness', options.sharpness);
	}

	if (options.lossless) {
		args.push('-lossless');
	}

	if (options.nearLossless) {
		args.push('-near_lossless', options.nearLossless);
	}

	if (options.crop) {
		args.push('-crop', options.crop.x, options.crop.y, options.crop.width, options.crop.height);
	}

	if (options.resize) {
		args.push('-resize', options.resize.width, options.resize.height);
	}

	if (options.metadata) {
		args.push('-metadata', Array.isArray(options.metadata) ? options.metadata.join(',') : options.metadata);
	}

	const cwebpStream = execa(cwebp, [...args, '-o', '-', '--', '-'], {
		buffer: options.buffer,
		encoding: null,
		input
	});

	return cwebpStream;
};

module.exports = (options = {}) => input => {
	if (!Buffer.isBuffer(input)) {
		return Promise.reject(new TypeError(`Expected \`input\` to be of type \`Buffer\` but received type \`${typeof input}\``));
	}

	if (!isCwebpReadable(input)) {
		return Promise.resolve(input);
	}

	return createCwebpStream(input, Object.assign(options, {buffer: true})).then(({stdout}) => stdout);
};

module.exports.stream = (options = {}) => input => {
	if (!isStream.readable(input)) {
		throw new TypeError(`Expected \`input\` to be of type \`stream.Readable\` but received type \`${typeof input}\``);
	}

	const cwebpStream = createCwebpStream(input, Object.assign(options, {buffer: false}));
	const outStream = new PassThrough();

	cwebpStream.on('error', error => {
		outStream.emit('error', error);
	});

	cwebpStream.stderr.setEncoding('utf8');
	cwebpStream.stderr.on('data', data => {
		outStream.emit('error', data);
	});

	cwebpStream.stdout.pipe(outStream);

	return outStream;
};
