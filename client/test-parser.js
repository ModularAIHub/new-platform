import { markdownToHTML } from './src/utils/blogHelpers.js';
const markdown = 'Here is what [Buffer, Hootsuite, and the other giants](/blogs/comparisons/suitegenie-vs-hootsuite) are doing';
const html = markdownToHTML(markdown);
console.log(html);
