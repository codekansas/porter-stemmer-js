// Written by Ben Bolte, November 15th, 2017
//
// Following the description of the Porter stemmer available here:
//   http://snowball.tartarus.org/algorithms/english/stemmer.html
//
// Usage:
//   porter.stem('test sentence'); -> ['test', 'sentenc']
//   porter.stem(['test', 'sentence']); -> ['test', 'sentenc']
//   porter.stem_word('sentence') -> 'sentenc'

const porter = (function() {
  const STEP_2_REPLACEMENTS = {
    'enci' : 'ence',
    'anci' : 'ance',
    'abli' : 'able',
    'entli' : 'ent',
    'izer': 'ize',
    'ization': 'ize',
    'ation': 'ate',
    'ator': 'ate',
    'alism': 'al',
    'aliti': 'al',
    'alli': 'al',
    'fulness': 'ful',
    'ousli': 'ous',
    'ousness': 'ous',
    'iveness': 'ive',
    'iviti': 'ive',
    'biliti': 'ble',
    'bli': 'ble',
    'logi': 'log',
    'fulli': 'ful',
    'lessli': 'less',
  };

  const STEP_3_REPLACEMENTS = {
    'tional': 'tion',
    'ational': 'ate',
    'alize': 'al',
    'icate': 'ic',
    'iciti': 'ic',
    'ical': 'ic',
    'ful': '',
    'ness': '',
  };

  const STEP_4_DELETES = [
    'al', 'ance', 'ence', 'er', 'ic', 'able', 'ible', 'ant', 'ement', 'ment',
    'ent', 'ism', 'ate', 'iti', 'ous', 'ive', 'ize', 'sion', 'tion',
  ];

  // Puts parens around a regex.
  const _p = s => '(' + s + ')';

  // Regex for vowels.
  const V_RE = '[aeiouy]', C_RE = '[^aeiou]';
  const L_RE = '[cdeghkmnrt]';

  // Replaces doubles with singles.
  const D_RE = new RegExp('bdfgmnprt'.split('')
    .map(v => _p(v) + v + '$').join('|'));

  // Regex for R1, R2, short syllables / words.
  const R1_RE = V_RE + C_RE + '.*?';
  const R2_RE = R1_RE + V_RE + C_RE + '.*?';
  const SS1_RE = C_RE + V_RE + '[^aeiouwxY]', SS2_RE = '$' + V_RE + C_RE;
  const SS_RE = _p(SS1_RE) + '|' + _p(SS2_RE);
  const SW_RE = C_RE + '*' + SS1_RE + '|' + SS2_RE;

  // Function for step 0.
  const step_0 = word => {
    return word.replace(/('s?'?)$/, '');
  }

  // Regex for step 1.
  const S1A1_RE = new RegExp('(ss|i)es$|(i)ed$');  // -> $1$2
  const S1A2_RE = new RegExp('([^su])s$');  // -> $1
  const S1B1_RE = new RegExp(_p(R1_RE) + 'eed(ly)*$');  // -> $1ee
  const S1B2_RE = new RegExp(_p(C_RE + V_RE + '.*') + '(ed(ly)*|ing(ly)*)$');
  const S1B3_RE = new RegExp('(at|bl|iz)$');  // -> $1e
  const S1C_RE = new RegExp(_p('.' + C_RE) + '(y|Y)');  // -> $1i

  // Functions for step 1.
  const step_1a = word => {
    if (S1A1_RE.test(word)) return word.replace(S1A1_RE, '$1$2');
    return word.replace(S1A2_RE, '$1');
  }

  const step_1b = word => {
    if (S1B1_RE.test(word)) return word.replace(S1B1_RE, '$1ee');
    if (S1B2_RE.test(word)) {
      word = word.replace(S1B2_RE, '');
      if (S1B3_RE.test(word)) return word.replace(S1B3_RE, '$1e');
      if (D_RE.test(word))    return word.replace(D_RE, '$1$2$3$4$5$6$7$8$9');
      if (SW_RE.test(word))   return word + 'e';
    } else {
      return word;
    }
  }

  const step_1c = word => {
    return word.replace(S1C_RE, '$1i');
  }

  // Regex for step 2.
  const S2_PRE = Object.keys(STEP_2_REPLACEMENTS)
    .sort((a, b) => b.length - a.length)
    .reduce((a, x) => a + '|' + x);
  const S21_RE = new RegExp('(.+?)' + _p(S2_PRE) + '$');
  const S22_RE = new RegExp('(.+?' + L_RE + ')li4');  // -> $1

  // Function for step 2.
  const step_2 = word => {
    const m = S21_RE.exec(word);
    if (m === null) {
      return word.replace(S22_RE, '$1');
    } else {
      return m[1] + STEP_2_REPLACEMENTS[m[2]];
    }
  }

  // Regex for step 3.
  const S3_PRE = Object.keys(STEP_3_REPLACEMENTS)
    .sort((a, b) => b.length - a.length)
    .reduce((a, x) => a + '|' + x);
  const S31_RE = new RegExp(_p(R1_RE) + _p(S3_PRE) + '$');
  const S32_RE = new RegExp(_p(R2_RE) + 'ative$');  // -> $1

  const step_3 = word => {
    const m = S31_RE.exec(word);
    if (m === null) {
      return word.replace(S32_RE, '$1');
    } else {
      return m[1] + STEP_3_REPLACEMENTS[m[2]];
    }
  }

  // Regex for step 4.
  const S4_SUF = STEP_4_DELETES
    .sort((a, b) => b.length - a.length)
    .reduce((a, x) => a + '|' + x);
  const S4_RE = new RegExp(_p(R2_RE) + _p(S4_SUF) + '$');  // -> $1

  // Function for step 4.
  const step_4 = word => {
    return word.replace(S4_RE, '$1');
  }

  // Regex for step 5.
  const S51_RE = new RegExp(_p(_p(R2_RE) + '|' + _p(R1_RE + SS_RE)) + 'e$');
  const S52_RE = new RegExp(_p(R2_RE + 'l') + 'l$');  // -> 1

  // Function for step 5.
  const step_5 = word => {
    return word.replace(S52_RE, '$1').replace(S51_RE, '$1');
  }

  const stem_word = word => {
    if (word.length <= 2) return word;
    word = word.replace(/^\'/, '');  // Replaces first '.
    word = word.replace(/^y|[aeiouy]y/g, 'Y');  // Replaces y -> Y.
    word = step_0(word);
    word = step_1a(word);
    word = step_1b(word);
    word = step_1c(word);
    word = step_2(word);
    word = step_3(word);
    word = step_4(word);
    word = step_5(word);
    return word.replace(/Y/g, 'y');
  }

  const stem = doc => {
    if (typeof doc === 'string') {
      doc = $.trim(doc).toLowerCase().replace(/(\s|[^a-z'])+/g,' ').split(' ');
    }
    return doc.map(stem_word);
  }

  return {
    stem_word: stem_word,
    stem: stem,
  }
})();
