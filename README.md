# About

This is an implementation of the English-language Porter stemmer, as described [here](http://snowball.tartarus.org/algorithms/english/stemmer.html).

# Usage

```html
<script src="https://cdn.jsdelivr.net/gh/codekansas/porter-stemmer-js@master/porter.min.js"></script>
<script>
porter.stem('this is a test sentence');  // ['thi', 'is', 'a', 'test', 'sentenc']
porter.stem(['this', 'sentence']);  // ['thi', 'sentenc']
porter.stem_word('this');  // 'thi'
</script>
```
