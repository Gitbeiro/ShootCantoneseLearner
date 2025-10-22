// Cantonese words database with Traditional Chinese, Jyutping, and English translations
const cantoneseWords = [
    // Basic words
    { chinese: "你好", jyutping: "nei5 hou2", english: "hello", category: "greetings" },
    { chinese: "再見", jyutping: "zoi3 gin3", english: "goodbye", category: "greetings" },
    { chinese: "多謝", jyutping: "do1 ze6", english: "thank you", category: "greetings" },
    { chinese: "對唔住", jyutping: "deoi3 m4 zyu6", english: "sorry", category: "greetings" },
    { chinese: "早晨", jyutping: "zou2 san4", english: "good morning", category: "greetings" },

    // Numbers
    { chinese: "一", jyutping: "jat1", english: "one", category: "numbers" },
    { chinese: "二", jyutping: "ji6", english: "two", category: "numbers" },
    { chinese: "三", jyutping: "saam1", english: "three", category: "numbers" },
    { chinese: "四", jyutping: "sei3", english: "four", category: "numbers" },
    { chinese: "五", jyutping: "ng5", english: "five", category: "numbers" },
    { chinese: "六", jyutping: "luk6", english: "six", category: "numbers" },
    { chinese: "七", jyutping: "cat1", english: "seven", category: "numbers" },
    { chinese: "八", jyutping: "baat3", english: "eight", category: "numbers" },
    { chinese: "九", jyutping: "gau2", english: "nine", category: "numbers" },
    { chinese: "十", jyutping: "sap6", english: "ten", category: "numbers" },

    // Colors
    { chinese: "紅色", jyutping: "hung4 sik1", english: "red", category: "colors" },
    { chinese: "藍色", jyutping: "laam4 sik1", english: "blue", category: "colors" },
    { chinese: "黃色", jyutping: "wong4 sik1", english: "yellow", category: "colors" },
    { chinese: "綠色", jyutping: "luk6 sik1", english: "green", category: "colors" },
    { chinese: "白色", jyutping: "baak6 sik1", english: "white", category: "colors" },
    { chinese: "黑色", jyutping: "hak1 sik1", english: "black", category: "colors" },

    // Family
    { chinese: "爸爸", jyutping: "baa4 baa1", english: "father", category: "family" },
    { chinese: "媽媽", jyutping: "maa4 maa1", english: "mother", category: "family" },
    { chinese: "哥哥", jyutping: "go4 go1", english: "older brother", category: "family" },
    { chinese: "姐姐", jyutping: "ze4 ze2", english: "older sister", category: "family" },
    { chinese: "弟弟", jyutping: "dai6 dai2", english: "younger brother", category: "family" },
    { chinese: "妹妹", jyutping: "mui6 mui2", english: "younger sister", category: "family" },

    // Food
    { chinese: "飯", jyutping: "faan6", english: "rice/meal", category: "food" },
    { chinese: "水", jyutping: "seoi2", english: "water", category: "food" },
    { chinese: "茶", jyutping: "caa4", english: "tea", category: "food" },
    { chinese: "咖啡", jyutping: "gaa3 fe1", english: "coffee", category: "food" },
    { chinese: "麵包", jyutping: "min6 baau1", english: "bread", category: "food" },
    { chinese: "生果", jyutping: "saang1 gwo2", english: "fruit", category: "food" },
    { chinese: "蘋果", jyutping: "ping4 gwo2", english: "apple", category: "food" },
    { chinese: "橙", jyutping: "caang2", english: "orange", category: "food" },

    // Common verbs
    { chinese: "食", jyutping: "sik6", english: "to eat", category: "verbs" },
    { chinese: "飲", jyutping: "jam2", english: "to drink", category: "verbs" },
    { chinese: "睇", jyutping: "tai2", english: "to look/watch", category: "verbs" },
    { chinese: "行", jyutping: "haang4", english: "to walk", category: "verbs" },
    { chinese: "跑", jyutping: "paau2", english: "to run", category: "verbs" },
    { chinese: "講", jyutping: "gong2", english: "to speak", category: "verbs" },
    { chinese: "聽", jyutping: "teng1", english: "to listen", category: "verbs" },
    { chinese: "學", jyutping: "hok6", english: "to learn", category: "verbs" },

    // Common adjectives
    { chinese: "好", jyutping: "hou2", english: "good", category: "adjectives" },
    { chinese: "靚", jyutping: "leng3", english: "beautiful", category: "adjectives" },
    { chinese: "大", jyutping: "daai6", english: "big", category: "adjectives" },
    { chinese: "細", jyutping: "sai3", english: "small", category: "adjectives" },
    { chinese: "快", jyutping: "faai3", english: "fast", category: "adjectives" },
    { chinese: "慢", jyutping: "maan6", english: "slow", category: "adjectives" },
    { chinese: "新", jyutping: "san1", english: "new", category: "adjectives" },
    { chinese: "舊", jyutping: "gau6", english: "old", category: "adjectives" },

    // Time
    { chinese: "今日", jyutping: "gam1 jat6", english: "today", category: "time" },
    { chinese: "聽日", jyutping: "ting1 jat6", english: "tomorrow", category: "time" },
    { chinese: "尋日", jyutping: "cam4 jat6", english: "yesterday", category: "time" },
    { chinese: "而家", jyutping: "ji4 gaa1", english: "now", category: "time" },
    { chinese: "朝早", jyutping: "ziu1 zou2", english: "morning", category: "time" },
    { chinese: "夜晚", jyutping: "je6 maan5", english: "night", category: "time" }
];

// Function to get a random word
function getRandomWord() {
    return cantoneseWords[Math.floor(Math.random() * cantoneseWords.length)];
}

// Function to get words by category
function getWordsByCategory(category) {
    return cantoneseWords.filter(word => word.category === category);
}

// Function to pronounce Cantonese using Web Speech API
function pronounceCantonese(word) {
    // Try to use Speech Synthesis API
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word.chinese);

        // Try to find a Cantonese voice (zh-HK only, not zh-CN which is Mandarin)
        const voices = speechSynthesis.getVoices();
        const cantoneseVoice = voices.find(voice =>
            voice.lang.includes('zh-HK') ||
            voice.lang.includes('yue-HK')
        );

        if (cantoneseVoice) {
            utterance.voice = cantoneseVoice;
            utterance.lang = 'zh-HK';
        } else {
            // Only use zh-TW (Taiwan) as fallback, NOT zh-CN (Mandarin)
            const taiwaneseVoice = voices.find(voice => voice.lang.includes('zh-TW'));
            if (taiwaneseVoice) {
                utterance.voice = taiwaneseVoice;
                utterance.lang = 'zh-TW';
            } else {
                // Show warning that proper Cantonese voice is not available
                console.warn('No Cantonese (zh-HK) or Taiwanese (zh-TW) voice found. Pronunciation may be incorrect.');
                utterance.lang = 'zh-HK'; // Set language even without voice
            }
        }

        utterance.rate = 0.7; // Slower for learning

        speechSynthesis.cancel(); // Cancel any ongoing speech
        speechSynthesis.speak(utterance);

        return true;
    }
    return false;
}

// Load voices when they become available
if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
    };
}
