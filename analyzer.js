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

const $trie = require('./trie')
const Trie = $trie.Trie

class AnalyzerFactory {
    static create(name) {
        name = name || ''
        switch (name.toLowerCase()) {
            /* istanbul ignore next */
            case 'trie':
                return new TrieAnalyzer()
            case 'word':
                return new WordAnalyzer()
            case 'combined':
                return new CombinedAnalyzer()
            default:
                return new WordAnalyzer()
        }
    }
}
class Analyzer {
    /* istanbul ignore next */
    run() {
        throw new Error('Not implemented')
    }
}
class WordAnalyzer extends Analyzer {
    run(item, field, index) {
        const weight = index.weight || 1
        let p = (_ => _[field])(item)
        let split = p.trim().split(' ')
        let value = split.reduce((groups, n) => {
            groups[n] = groups[n] || 0
            groups[n]++
            return groups
        }, {})
        let weighted = split.reduce((groups, n) => {
            groups[n] = groups[n] || 0
            groups[n] += weight
            return groups
        }, {})
        return {
            value,
            weighted
        }
    }
}
class TrieAnalyzer extends Analyzer {
    run(item, field, index) {
        let p = (_ => _[field])(item)
        return {
            trie: Trie.run(p)
        }
    }
}
class CombinedAnalyzer extends Analyzer {
    run(item, field, index) {
        const $wa = new WordAnalyzer()
        const $ta = new TrieAnalyzer()
        return Object.assign($wa.run(item, field, index), $ta.run(item, field, index))
    }
}

module.exports = { AnalyzerFactory, Analyzer, WordAnalyzer, TrieAnalyzer }