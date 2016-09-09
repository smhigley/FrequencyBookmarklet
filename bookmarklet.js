(function() {
  // First get all raw text in the page
  // use document tree walker to get all text nodes, since it's more performant than iterating elements
  // to do so, create a filter to exclude all style and script tags
  // ASSUMPTIONS:
  //  1. capitalization doesn't matter for words matching
  //  2. We display all words in lowercase at the end
  //  3. I'm mapping word frequencies to text sizes from 8px to 26px;

  var walkerFilter = function(node) {
    // use parentElement since we'll be getting text nodes
    // TODO: add a test for hidden elements?
    if (/^(STYLE|SCRIPT)$/i.test(node.parentElement.nodeName)) {
      return NodeFilter.FILTER_SKIP;
    } else {
      return NodeFilter.FILTER_ACCEPT;
    }
  };
  var textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, walkerFilter, false);

  function tolkenizeText(walker) {
    // now set up some empty variables to use later
    // words should be an array of arrays in the form [word, frequency]
    var words = [],
        maxFrequency = 1,
        splitRE = /\s*,?.?\s*\n*/,
        isaWordRE = /^[a-z\u00C0-\u017F]{4,}$/i,
        matchRE,
        wordExists,
        node,
        tmpWords,
        i, w;

    // go through all text nodes
    while (walker.nextNode()) {
      // split current text node into words
      node = walker.currentNode;
      tmpWords = node.nodeValue.split(/\b/);

      // loop through tmpWords, and either increment an existing word or add a new one
      for(i = 0; i < tmpWords.length; i++) {
        // if the word is less than four characters, or has special characters (not alphabetical or accented alphabetical), then pass
        if (!isaWordRE.test(tmpWords[i])) {
          continue;
        }


        wordExists = false;

        //iterate through existing words and check for matches
        for(w = 0; w < words.length; w++) {
          matchRE = new RegExp(words[w], 'gi');
          if (matchRE.test(tmpWords[i])) {
            // increment word frequency by one, set wordExists to true, and exit loop
            words[w][1] += 1;
            wordExists = true;
            // if we've exceeded the current max frequency, update it
            if (words[w][1] > maxFrequency) maxFrequency = words[w][1];
            break;
          }
        }

        // now, if the word is new and unique, add it to the words array with a frequency of 1
        if (!wordExists) {
          words.push([tmpWords[i].toLowerCase(), 1]);
        }
      }
    }

    return {
      words: words,
      maxFrequency: maxFrequency
    };
  }

  function getTextSize(frequency, max) {
    // as stated above, we'll use text sizes from 8px to 26px
  }

  // Create a modal overlay to display word cloud
  // use namespaced classes
  var modal = document.createElement('div');
  modal.classList.add('higley-modal');
  modal.innerHTML = '<h1>Word Cloud for this page:</h1>';
  modal.innerHTML += '<a href="#" class="higley-close">Close Modal</a>';
  modal.innerHTML += '<ul>';

  // now

  // add some styles
  var styles = '
    .higley-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 30px;
      box-shadow: 0 0 10px 10px rgba(0, 0, 0, 0.5);
      border-radius: 10px;
      background-color: #fff;
      z-index: 99;
    }
    .higley-modal h1 {
      margin-bottom: 10px;
      font-size: 36px;
      text-transform: uppercase;
    }
    .higley-modal li {
      margin-bottom: 4px;
      font-size: 16px;
    }
  ';
  var stylesheet = document.createElement('style');
  stylesheet.type = 'text/css';
  stylesheet.innerHTML = styles;
  document.getElementsByTagName("head")[0].appendChild(stylesheet);

  var wordData = tolkenizeText(textWalker);

})();
