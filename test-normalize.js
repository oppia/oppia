const html1 = "<p>Mock translation of: Congratulations, you have finished!</p>";
const html2 = "Mock translation of: Congratulations, you have finished!";

const normalize = (html) => {
  let str = html.replace(/\u200B/g, '').trim();
  if (str.startsWith('<p>') && str.endsWith('</p>')) {
    str = str.substring(3, str.length - 4).trim();
  }
  // mock div behavior using simple string manipulation or jsdom if available
  return str;
};

console.log("normalize(html1):", normalize(html1));
console.log("normalize(html2):", normalize(html2));
console.log("Match?", normalize(html1) === normalize(html2));
