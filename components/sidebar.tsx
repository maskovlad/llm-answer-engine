import { MessageSettings } from "@/types/types";
import { useEffect, useState } from "react";
import { defaultMessageSettings } from "@/lib/message-settings";

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: any }) => {

  const [settings, setSettings] = useState<MessageSettings>(defaultMessageSettings);

  const [changed, setChanged] = useState(false)

  useEffect(() => {
    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    } else {
      localStorage.setItem('settings', JSON.stringify(settings));
    }
  }, []);

  useEffect(() => {
    if (changed === true) {
      localStorage.setItem('settings', JSON.stringify(settings));
      setChanged(false)
    }
  }, [changed]);

  //   useEffect(()=>{
  // handleSettingsChange('embeddingsModel', settings.searchLang === 'uk' || settings.searchLang === 'ru' ? 'mistral' : 'nomic-embed-text-v1')
  //   }, [settings.searchLang])

  const handleSettingsChange = (fields: { field: string, value: string | boolean | number }[]): void => {
    for (const f of fields) {
      setSettings((prevSettings) => ({
        ...prevSettings,
        [f.field]: f.value,
      }));
    }
    setChanged(true)
  };

  function getEmbeddingsModel(value: string): string {
    if (value === 'uk' || value === 'ru') {
      return 'mistral'
    }
    return 'nomic-embed-text-v1'
  }

  return (
    <div
      className={`fixed inset-y-0 right-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out transform ${!isOpen ? 'translate-x-full' : '-translate-x-0'}`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-600 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 px-4 py-6 overflow-y-auto">
          {/* Мова Запиту */}
          <div className="my-4">
            <label className="block mb-2 font-semibold">Мова Запиту</label>
            <select
              value={settings.messageLang}
              onChange={(e) => handleSettingsChange([{ field: 'messageLang', value: e.target.value }])}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="uk">Українська</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          {/* Мова пошуку */}
          <div className="my-4">
            <label className="block mb-2 font-semibold">Мова пошуку</label>
            <select
              value={settings.searchLang}
              onChange={(e) => {
                handleSettingsChange([{ field: 'searchLang', value: e.target.value }])
              }}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="uk">Українська</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          {/* Мова відповіді */}
          <div className="my-4">
            <label className="block mb-2 font-semibold">Мова відповіді</label>
            <select
              value={settings.answerLang}
              onChange={(e) => handleSettingsChange([{ field: 'answerLang', value: e.target.value}])}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
            <option value="uk">Українська</option>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>

        <hr />
        {/* Пошукова система */}
        <div className="my-4">
          <label className="block mb-2 font-semibold">Пошукова система</label>
          <select
            value={settings.searchSystem}
            onChange={(e) => handleSettingsChange([{ field: 'searchSystem', value: e.target.value}])}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
          <option value="google">Google</option>
          <option value="ru">Brave</option>
          <option value="en" disabled>Bing</option>
        </select>
      </div>

      <hr />

      {/* Embeddings Model */}
      <div className="my-4">
        <label className="block mb-2 font-semibold">Embeddings Model</label>
        <select
          value={settings.embeddingsModel}
          onChange={(e) => handleSettingsChange([{ field: 'embeddingsModel', value: e.target.value }])}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="nomic-embed-text-v1">nomic-embed-text-v1</option>
          <option value="sentence-transformers/all-MiniLM-L6-v2">all-MiniLM-L6-v2(en)</option>
          <option value="mistral" disabled>Mistral</option>
          <option value="text-embedding-3-small" disabled>OpenAI: text-embedding-3-small</option>
        </select>
      </div>
      {/* Inference Model */}
      <div className="my-4">
        <label className="block mb-2 font-semibold">Inference Model</label>
        <select
          value={settings.inferenceModel}
          onChange={(e) => handleSettingsChange([{ field: 'inferenceModel', value: e.target.value }])}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="mixtral-8x7b-32768">Groq: Mixtral</option>
          <option value="llama3-8b-8192">Groq: Llama 3 8B</option>
          <option value="gemma-7b-it">Groq: Gemma</option>
          <option value="gpt-3.5-turbo" disabled>Pro: OpenAI: GPT3.5-turbo</option>
          <option value="gpt-4" disabled>Pro: OpenAI: GPT4</option>
        </select>
      </div>

      <hr />

      <label className="block mb-4 font-semibold">Показувати джерела</label>
      <div className="my-4">
        <label className="inline-flex items-center cursor-pointer">
          <input type="checkbox"
            className="sr-only peer"
            checked={settings.showSources}
            onChange={(e) => handleSettingsChange([{ field: 'showSources', value: e.target.checked.valueOf() }])} />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Посилання</span>
        </label>
      </div>
      {/* Зображення */}
      <div className="my-4">
        <label className="inline-flex items-center cursor-pointer">
          <input type="checkbox"
            className="sr-only peer"
            checked={settings.showImages}
            onChange={(e) => handleSettingsChange([{ field: 'showImages', value: e.target.checked.valueOf() }])} />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Зображення</span>
        </label>
      </div>
      {/* Відео */}
      <div className="my-4">
        <label className="inline-flex items-center cursor-pointer">
          <input type="checkbox"
            className="sr-only peer"
            checked={settings.showVideo}
            onChange={(e) => handleSettingsChange([{ field: 'showVideo', value: e.target.checked.valueOf() }])} />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Відео</span>
        </label>
      </div>
      {/* Дод. питання */}
      <div className="my-4">
        <label className="inline-flex items-center cursor-pointer">
          <input type="checkbox"
            className="sr-only peer"
            checked={settings.showFollowup}
            onChange={(e) => handleSettingsChange([{ field: 'showFollowup', value: e.target.checked.valueOf() }])} />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Дод. питання</span>
        </label>
      </div>

      <hr />

      <div className="my-4">
        <h3 className="mb-2 font-semibold">Розширені опції (Pro)</h3>
        {/* Оптимізація запит */}
        <div className="my-4">
          <label className="block mb-4 font-semibold">Оптимізація запиту</label>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox"
              className="sr-only peer"
              checked={settings.messageOptimization}
              onChange={(e) => handleSettingsChange([{ field: 'questionOptimization', value: e.target.checked.valueOf() }])} />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {/* Text Chunk Size */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">
            Text Chunk Size: {settings.textChunkSize}
          </label>
          <input
            type="range"
            min="500"
            max="2000"
            step="100"
            value={settings.textChunkSize}
            onChange={(e) => handleSettingsChange([{ field: 'textChunkSize', value: Number(e.target.value) }])}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        {/* Text Chunk Overlap */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">
            Text Chunk Overlap: {settings.textChunkOverlap}
          </label>
          <input
            type="range"
            min="200"
            max="800"
            step="100"
            value={settings.textChunkOverlap}
            onChange={(e) => handleSettingsChange([{ field: 'textChunkOverlap', value: Number(e.target.value) }])}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        {/* Number of Similarity Results */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">
            Number of Similarity Results: {settings.similarityResults}
          </label>
          <input
            type="range"
            min="2"
            max="10"
            step="1"
            value={settings.similarityResults}
            onChange={(e) => handleSettingsChange([{ field: 'similarityResults', value: Number(e.target.value) }])}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        {/* Number of Pages to Scan */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">
            Number of Pages to Scan: {settings.pagesToScan}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={settings.pagesToScan}
            onChange={(e) => handleSettingsChange([{ field: 'pagesToScan', value: Number(e.target.value) }])}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        {/*Таймаут сканування посилань */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">
            Таймаут сканування посилань(ms): {settings.timeoutGetBlueLinks}
          </label>
          <input
            type="range"
            min="800"
            max="2000"
            step="100"
            value={settings.timeoutGetBlueLinks}
            onChange={(e) => handleSettingsChange([{ field: 'timeoutGetBlueLinks', value: Number(e.target.value) }])}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
      </div >
    </div >
  );
};

export default Sidebar;