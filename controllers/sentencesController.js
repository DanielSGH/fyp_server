const axios = require('axios');
const striptags = require('striptags');
const ISO6391 = require('iso-639-1');

const sendBstRequest = async (selectedLanguage, npage) => {
  const { generate } = await import('random-words');

  const response = await axios.post('https://context.reverso.net/bst-query-service', {
    "source_text": generate(),
    "target_text": "",
    "source_lang": "en",
    "target_lang": selectedLanguage,
    "npage": npage,
    "mode": 0
  },
  {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
    }
  });

  return response;
};

module.exports.sentences = async (req, res) => {
  let { selectedLanguage } = req.query;
  selectedLanguage = ISO6391.getCode(selectedLanguage);
  
  const response = await sendBstRequest(selectedLanguage, 1);

  const { npages, list } = response.data;
  for (let i = 2; i < (npages >= 6 ? 6 : npages); i++) {
    const response = await sendBstRequest(selectedLanguage, i);
    list.push(...response.data.list);
  }

  const sentences = list.map(sentence => {
    const target = striptags(sentence.t_text);
    return {
      source: striptags(sentence.s_text),
      target,
      shuffled: shuffle(target.split(' ')),
    };
  });

  const top5_shortest = sentences.sort((a, b) => a.source.length - b.source.length).slice(0, 5);
  res.send(top5_shortest);
}

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};