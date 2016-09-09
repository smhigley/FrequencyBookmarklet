(function() {
  // First get all raw text in the page
  // use document tree walker to get all text nodes, since it's more performant than iterating elements
  // to do so, create a filter to exclude all style and script tags
  // ASSUMPTIONS:
  //  1. capitalization doesn't matter for words matching
  //  2. We display all words in lowercase at the end
  //  3. I'm mapping word frequencies to text sizes from 10px to 36px;

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
          matchRE = new RegExp(words[w][0], 'gi');
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

    // sort words alphabetically by first value
    words.sort(function(a, b){
      if(a[0] < b[0]) return -1;
      if(a[0] > b[0]) return 1;
      return 0;
    });

    return {
      words: words,
      maxFrequency: maxFrequency
    };
  }

  function getTextStyles(frequency, max) {
    // as stated above, we'll use text sizes from 10px to 36px
    // add a text opacity style from 0.5 to 1
    // frequency range is 1 - max
    // TODO: try using logarithmic mapping instead of linear
    return {
      size: (frequency - 1) * (36 - 10)/(max - 1) + 10,
      opacity: (frequency - 1) * (1 - 0.5)/(max - 1) + 0.5
    };
  }

  function createModal(words, maxFrequency) {
    // Create a modal overlay to display word cloud
    // use namespaced classes
    // TODO: Create modal overlay, or catch outside clicks to close modal
    var modal = document.createElement('div');
    modal.classList.add('higley-modal');
    modal.innerHTML = '<h1>Word Cloud for this page:</h1>';
    modal.innerHTML += '<a href="#" class="higley-close">Close Modal</a>';
    modal.innerHTML += '<ul>';

    // now iterate through words and add <li>'s for each with the correct text size
    var textSize;
    for(var i = 0; i < words.length; i++) {
      textStyle = getTextStyles(words[i][1], maxFrequency);
      modal.innerHTML += '<li style="font-size:' + textStyle.size + 'px;opacity:' + textStyle.opacity + '">' + words[i][0] + '</li>';
      if (i == words.length - 1) {
        modal.innerHTML += '</ul>';
      }
    }

    // add some styles
    // somehow, a z-index of 9999999999 is necessary on some sites
    // not all browser prefixes are present; I usually use a mini sass library to add prefixes, and for conciseness, I only added a few here.
    // TODO: add better styles to headings, etc. to protect against inherited styles
    var styles = "
      .higley-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        max-width: 85%;
        max-height: 85%;
        -webkit-transform: translate(-50%, -50%);
        -moz-transform: translate(-50%, -50%);
        -ms-transform: translate(-50%, -50%);
        transform: translate(-50%, -50%);
        padding: 30px;
        box-shadow: 0 0 10px 10px rgba(0, 0, 0, 0.5);
        border-radius: 10px;
        background-color: #fff;
        z-index: 9999999999;
        overflow: scroll;
      }
      .higley-modal h1 {
        padding-right: 40px;
        margin: 0 0 10px;
        font-size: 36px;
        text-transform: uppercase;
      }
      .higley-modal li {
        display: inline-block;
        padding: 0 4px;
        color: #103f5e;
      }
      .higley-close {
        display: block;
        position: absolute;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        text-indent: -999px;
        text-decoration: none;
        border: none;
        overflow: hidden;
        -webkit-transition: all 0.3s ease;
        -moz-transition: all 0.3s ease;
        -ms-transition: all 0.3s ease;
        transition: all 0.3s ease;
      }
      .higley-close:before, .higley-close:after {
        content: '';
        display: block;
        position: absolute;
        top: 18px;
        left: 0;
        width: 40px;
        height: 4px;
        -webkit-transform: rotate(45deg);
        -moz-transform: rotate(45deg);
        -ms-transform: rotate(45deg);
        transform: rotate(45deg);
        background-color: #103f5e;
      }
      .higley-close:after {
        -webkit-transform: rotate(-45deg);
        -moz-transform: rotate(-45deg);
        -ms-transform: rotate(-45deg);
        transform: rotate(-45deg);
      }
      .higley-close:hover, .higley-close:focus {
        transform: scale(1.2);
      }
    ";
    var stylesheet = document.createElement('style');
    stylesheet.type = 'text/css';
    stylesheet.innerHTML = styles;
    document.getElementsByTagName("head")[0].appendChild(stylesheet);

    // append modal
    document.body.appendChild(modal);

    // add event listener to close link
    var closeButton = modal.querySelector('.higley-close');
    closeButton.onclick = function(e) {
      e.preventDefault();
      document.body.removeChild(modal);
    }
  }

  var wordData = tolkenizeText(textWalker);
  createModal(wordData.words, wordData.maxFrequency);

})();
