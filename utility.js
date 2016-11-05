// MIT License

// Copyright (c) 2016-2017 David Betz

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const debug = require('debug')('test')

let beautify
try {
    beautify = require('js-beautify')
}
catch (ex) {
}

/* istanbul ignore next */
function b(obj) {
    if (typeof obj === 'number' || typeof obj === 'string') {
        return obj
    }
    if (!obj) {
        return "[BLANK]"
    }
    return typeof beautify !== 'undefined' ? beautify.js_beautify(JSON.stringify(obj)) : JSON.stringify(obj)
}

/* istanbul ignore next */
function dump(title, obj, output = debug) {
    output(`${title}:${b(obj)}`)
}

/* istanbul ignore next */
function m(name) {
    // console.trace('')
    throw new Error(`missing ${name}`)
}

/* istanbul ignore next */
function validate_type(obj = m('obj'), type = m('type')) {
    if (typeof obj !== type) {
        console.trace('parameter is expected to be ' + type)
        throw 'type mismatch'
    }
}

exports.validate_type = validate_type
exports.dump = dump
exports.b = b
exports.m = m 
