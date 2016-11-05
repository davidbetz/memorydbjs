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

class TrieNode {
    constructor(last) {
        this.children = {}
        this.end = last
    }
    add(letter, last) {
        let _ = this.children[letter]
        if (typeof _ === 'undefined') {
            this.children[letter] = new TrieNode(last)
        }
        return this.children[letter]
    }
    find(text, whole) {
        whole = whole || false
        const letters = text.trim().split('')
        let index = 0
        let _
        let node = this
        do {
            _ = node.children[letters[index]]
            node = _
        }
        while (++index < letters.length && typeof _ !== 'undefined')
        if (whole === true) {
            return typeof _ !== 'undefined' && _.end === true
        }
        else {
            return typeof _ !== 'undefined'
        }
    }
}

class Trie {
    static run(text, node) {
        const rootNode = node || new TrieNode()
        const words = text.trim().split(' ')
        let wordNode
        words.forEach(p => {
            const letters = p.split('')
            wordNode = rootNode
            for (let n = 0; n < letters.length; n++) {
                const l = letters[n]
                wordNode = wordNode.add(l, n + 1 == letters.length)
            }
        })
        return new Trie(rootNode)
    }

    get root() {
        return this.node
    }

    constructor(node) {
        this.node = node
    }

    find(text) {
        return this.node.find(text)
    }
    whole(text) {
        return this.node.find(text, true)
    }
}

module.exports = { TrieNode, Trie }
