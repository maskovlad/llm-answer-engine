import { HfInference } from '@huggingface/inference';

export async function translateText(inputText: string, sourceLanguage?: string, targetLanguage?: string): Promise <string> {
  const hf = new HfInference(process.env.HUGGINGFACEHUB_API_KEY);

  const model = 'Helsinki-NLP/opus-mt-'+sourceLanguage+'-'+targetLanguage
  console.log({model})

  try {
    const translation = await hf.translation({
      model,
      inputs: inputText,
    });
    // const translation1 = await hf.translation({
    //   model: 'facebook/nllb-200-3.3B',
    //   inputs: inputText,
    //   parameters: {
    //     "src_lang": "uk_XX",
    //     "tgt_lang": "en_XX"
    //   }
    // })
    // console.log({translation1})
    // @ts-ignore тому що: Property 'translation_text' does not exist on type 'TranslationOutput'. Property 'translation_text' does not exist on type 'TranslationOutputValue[]'
    return translation.translation_text
  } catch (err) {
    const errText = 'Помилка перекладу на ' + targetLanguage === 'uk' ? 'українську' : 'англійську: ' + err
    console.log(errText)
    return errText
  }

}