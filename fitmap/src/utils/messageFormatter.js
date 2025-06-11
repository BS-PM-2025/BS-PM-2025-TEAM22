// src/utils/messageFormatter.js

export const formatMessage = (content) => {
    if (!content) return '';
    const withEmojis = replaceEmoticons(content);
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hashtagRegex = /#(\w+)/g;
    const mentionRegex = /@(\w+)/g;
  
    return {
      text: withEmojis,
      hasUrls: urlRegex.test(withEmojis),
      hasHashtags: hashtagRegex.test(withEmojis),
      hasMentions: mentionRegex.test(withEmojis)
    };
  };
  
  const replaceEmoticons = (text) => {
    return text
      .replace(/:\)/g, '😊')
      .replace(/:\(/g, '😔')
      .replace(/:D/g, '😁')
      .replace(/;\)/g, '😉')
      .replace(/<3/g, '❤️')
      .replace(/:P/g, '😛')
      .replace(/:\|/g, '😐')
      .replace(/:O/g, '😮');
  };
  
  export const isEmojiOnlyMessage = (text) => {
    if (!text) return false;
    const emojiRegex = /^([\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]+\s*)+$/u;
    return emojiRegex.test(text.trim());
  };
  
  export const textToComponents = (text) => {
    if (!text) return [];
  
    const emojiRegex = /([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/gu;
    const urlRegex = /^https?:\/\/[^\s]+$/;
    const hashtagRegex = /^#\w+$/;
    const mentionRegex = /^@\w+$/;
  
    const withEmojis = replaceEmoticons(text);
    const tokens = withEmojis.split(/(\s+)/);
    const parts = [];
  
    for (const token of tokens) {
      if (!token.trim()) {
        parts.push({ type: 'text', content: token });
      } else if (urlRegex.test(token)) {
        parts.push({ type: 'url', content: token, url: token });
      } else if (hashtagRegex.test(token)) {
        parts.push({ type: 'hashtag', content: token });
      } else if (mentionRegex.test(token)) {
        parts.push({ type: 'mention', content: token });
      } else if (emojiRegex.test(token)) {
        for (const char of [...token]) {
          if (emojiRegex.test(char)) {
            parts.push({ type: 'emoji', content: char });
          } else {
            parts.push({ type: 'text', content: char });
          }
        }
      } else {
        parts.push({ type: 'text', content: token });
      }
    }
  
    return parts;
  };
  