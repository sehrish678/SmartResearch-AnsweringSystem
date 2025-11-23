import { useState, useEffect, useRef } from 'react';
import { FiSun } from 'react-icons/fi';
import { BsLightbulb } from 'react-icons/bs';
import '../styles/query-box.css';

export function QueryBox({ onSend }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

 const COMMON_TYPOS = {
  // Classic English 
  "teh": "the", "recieve": "receive", "seperate": "separate", "occured": "occurred",
  "accomodate": "accommodate", "definately": "definitely", "embarass": "embarrass",
  "wierd": "weird", "alot": "a lot", "untill": "until", "thier": "their", "neccessary": "necessary",
  "langauge": "language", "pronounciation": "pronunciation", "goverment": "government",
  "enviroment": "environment", "reccomend": "recommend", "occassion": "occasion",
  "achive": "achieve", "beleive": "believe", "cemetary": "cemetery", "concious": "conscious",
  "definately": "definitely", "existance": "existence", "foriegn": "foreign", "guage": "gauge",
  "hieght": "height", "independant": "independent", "jewlery": "jewelry", "leisure": "leisure",
  "maintanance": "maintenance", "neccesary": "necessary", "ocassion": "occasion", "paralell": "parallel",
  "quesion": "question", "recieve": "receive", "seperate": "separate", "tommorow": "tomorrow",
  "untill": "until", "vaccum": "vacuum", "wether": "whether", "wierd": "weird",

  // Question starters  
  "waht": "what", "wht": "what", "whats": "what", "whatt": "what", "whats the": "what's the",
  "whats is": "what is", "what is the": "what is the", "what are the": "what are the",
  "whay": "why", "whys": "why", "wyh": "why", "whyy": "why",
  "how do": "how do", "how to": "how to", "how can": "how can", "how does": "how does",
  "howw": "how", "hoow": "how", "hwo": "how",
  "whre": "where", "wher": "where", "wher is": "where is",
  "whn": "when", "whens": "when", "whe": "when",
  "whos": "who", "whois": "who is", "whose": "who's",

  // AI / Tech domain typos 
  "modle": "model", "mdoel": "model", "modell": "model", "modles": "models", "moddel": "model",
  "attetnion": "attention", "attension": "attention", "atention": "attention", "attn": "attention",
  "transfromer": "transformer", "trasnformer": "transformer", "transformr": "transformer",
  "tokeniztion": "tokenization", "tockenization": "tokenization", "toknization": "tokenization",
  "enbedding": "embedding", "embeddding": "embedding", "embedings": "embeddings", "embeding": "embedding",
  "retreival": "retrieval", "retrival": "retrieval", "retieval": "retrieval", "retreive": "retrieve",
  "similiar": "similar", "relavance": "relevance", "irrelavant": "irrelevant", "relavant": "relevant",
  "embeded": "embedded", "fien tune": "fine-tune", "fien tuning": "fine-tuning",
  "pretrain": "pretrained", "pre train": "pretrain", "pre trained": "pretrained",
  "rag system": "RAG system", "retreival augmented": "retrieval-augmented",
  "llm": "LLM", "lmm": "LLM", "llms": "LLMs", "gpts": "GPTs",

  // Common research
  "explain me": "explain to me", "explian": "explain", "exlain": "explain",
  "tell me about": "tell me about", "tells me": "tell me", "telle": "tell",
  "difference between": "difference between", "differnce": "difference", "diffrence": "difference",
  "comparision": "comparison", "comparsion": "comparison",
  "impliment": "implement", "implemnt": "implement", "implemenation": "implementation",
  "architechture": "architecture", "architecht": "architect",
  "paramater": "parameter", "paramters": "parameters", "param": "parameter",
  "optmization": "optimization", "optmize": "optimize",
  "performace": "performance", "efficieny": "efficiency",

  // With spaces 
  "what isthe": "what is the", "how doi": "how do i", "why doesit": "why does it",
  "where canifind": "where can i find", "how can iuse": "how can i use",
  "what arethe": "what are the", "tell meabout": "tell me about",

  //common contractions & grammar slips
  "dont": "don't", "cant": "can't", "wont": "won't", "isnt": "isn't", "arent": "aren't",
  "doesnt": "doesn't", "havent": "haven't", "hadnt": "hadn't", "couldnt": "couldn't",
  "youre": "you're", "theyre": "they're", "its": "it's", "theres": "there's", "whos": "who's"
};

  const protectedTerms = new Set([
    "nlp", "bert", "roberta", "gpt", "llm", "llama", "mistral", "gemma", "qwen", "groq", "claude", "gemini", "phi", "olmo", "deepseek",
    "transformer", "attention", "self-attention", "multi-head", "feed-forward", "tokenization", "tokenizer", "bpe", "wordpiece", "unigram", "subword",
    "embedding", "word2vec", "glove", "fasttext", "bert embedding", "roberta embedding",
    "pos", "ner", "named entity", "chunking", "lemmatization", "stemming",
    "backprop", "backpropagation", "fine-tuning", "pretraining", "rag", "retrieval-augmented",
    "seq2seq", "encoder", "decoder", "autoregressive", "causal masking",
    "bm25", "tf-idf", "tfidf", "vector space model", "inverted index",
    "lucene", "elasticsearch", "opensearch",
    "dense retrieval", "sparse retrieval", "colbert", "splade", "ance", "dpr", "contriever", "co-condenser", "tas-b",
    "query expansion", "pseudo-relevance", "rocchio", "reranking", "cross-encoder",
    "cipher", "aes", "rsa", "ecc", "ecdsa", "sha256", "sha3", "hash", "encryption", "decryption",
    "public key", "private key", "pgp", "openssl",
    "zero trust", "zero-trust", "mitre", "attack", "cve", "exploit", "payload",
    "malware", "ransomware", "phishing", "ddos", "botnet", "rootkit", "backdoor",
    "firewall", "ids", "ips", "siem", "soc", "threat intelligence", "yara",
    "qubit", "quantum bit", "superposition", "entanglement", "bell state",
    "quantum teleportation", "teleportation", "no-cloning", "no cloning theorem",
    "shor", "shor's algorithm", "grover", "grover's algorithm",
    "vqe", "qaqa", "quantum gate", "hadamard", "cnot", "pauli", "x gate", "z gate", "y gate",
    "qiskit", "cirq", "pennylane", "braket", "ionq", "rigetti", "ibm quantum",
    "quantum error correction", "surface code", "cat code", "qec",
    "arxiv", "pgvector", "hnsw", "faiss", "annoy", "milvus", "weaviate", "qdrant",
    "cohere", "voyage", "jina", "openai", "anthropic", "meta ai", "huggingface", "hugging face",
    "sentence-transformers", "all-minilm", "multilingual-e5"
  ]);

  const handleChange = (e) => {
    let value = e.target.value;
    const cursor = e.target.selectionStart;

    const before = value.slice(0, cursor);
    const match = before.match(/[\w'-]+$/);
    if (!match) {
      setQuery(value);
      return;
    }

    const word = match[0].toLowerCase();
    if (word.length < 3 || protectedTerms.has(word)) {
      setQuery(value);
      return;
    }

    const fix = COMMON_TYPOS[word];
    if (fix) {
      const start = cursor - word.length;
      const corrected = value.slice(0, start) + fix + value.slice(cursor);
      const newPos = start + fix.length;

      setQuery(corrected);
      requestAnimationFrame(() => {
        inputRef.current?.setSelectionRange(newPos, newPos);
      });
      return;
    }

    setQuery(value);
  };

  const handleSend = () => {
    const text = query.trim();
    if (text && onSend) onSend(text);
    setQuery('');
  };

  const toggleMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  return (
    <div className="query-box-container">
      <input
        ref={inputRef}
        placeholder="Ask anything..."
        className="query-box-input"
        value={query}
        onChange={handleChange}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
      <button onClick={toggleMode} className={`switch-toggle-btn${isDark ? ' deep' : ''}`}>
        <span className="switch-track">
          <span className="switch-knob" style={{ transform: isDark ? 'translateX(22px)' : 'translateX(2px)' }}>
            {isDark ? <BsLightbulb size={18} color="#ef6a36" /> : <FiSun size={18} color="#ef6a36" />}
          </span>
        </span>
      </button>
      <button className="query-box-button" onClick={handleSend}>Send</button>
    </div>
  );
}