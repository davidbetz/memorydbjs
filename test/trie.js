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

"use strict"

const expect = require('chai').expect
const assert = require('chai').assert

const $trie = require('../trie')
const Trie = $trie.Trie

const u = require('../utility')

describe("Trie", function () {
    it("run", function () {
        const trie = Trie.run('abc abgl cdf abcd lmn')
        expect(JSON.stringify(trie.root).length).to.eq(385)
    })

    it("find (true)", function () {
        const trie = Trie.run('abc abgl cdf abcd lmn')
        const result = trie.find('abc')
        expect(result).to.be.true
    })

    it("find (false)", function () {
        const trie = Trie.run('abc abgl cdf abcd lmn')
        const result = trie.find('asbc')
        expect(result).to.be.false
    })

    it("whole (true)", function () {
        const trie = Trie.run('abc abgl cdf abcd lmn')
        const result = trie.whole('abc')
        expect(result).to.be.true
    })

    it("whole (false)", function () {
        const trie = Trie.run('abc abgl cdf abcd lmn')
        const result = trie.whole('ab')
        expect(result).to.be.false
    })
})