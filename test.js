import fs from 'fs';
import path from 'path';
import isWebP from 'is-webp';
import pify from 'pify';
import test from 'ava';
import getStream from 'get-stream';
import pEvent from 'p-event';
import imageminPngquant from '.';

const fsP = pify(fs);

test('convert an image into a WebP', async t => {
	const buf = await fsP.readFile(path.join(__dirname, 'fixtures/test.png'));
	const data = await imageminPngquant()(buf);

	t.true(data.length < buf.length);
	t.true(isWebP(data));
});

test('skip optimizing unsupported files', async t => {
	const buf = await fsP.readFile(path.join(__dirname, 'fixtures/test-unsupported.bmp'));
	const data = await imageminPngquant()(buf);

	t.deepEqual(data, buf);
});

test('throw error when an image is corrupt', async t => {
	const buf = await fsP.readFile(path.join(__dirname, 'fixtures/test-corrupt.webp'));
	await t.throws(imageminPngquant()(buf), /BITSTREAM_ERROR/);
});

test('convert an image into a WebP using streams', async t => {
	const stream = fsP.createReadStream(path.join(__dirname, 'fixtures/test.png'));
	const buf = await fsP.readFile(path.join(__dirname, 'fixtures/test.png'));
	const data = await getStream.buffer(imageminPngquant.stream()(stream));

	t.true(data.length < buf.length);
	t.true(isWebP(data));
});

test('throw error when an image is corrupt using streams', async t => {
	const stream = fsP.createReadStream(path.join(__dirname, 'fixtures/test-corrupt.webp'));
	await t.throws(pEvent(imageminPngquant.stream()(stream), 'data'), /BITSTREAM_ERROR/);
});
