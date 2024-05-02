import { HfInference } from '@huggingface/inference';
import { TranslationOutputValue } from '@huggingface/inference';

// export interface TranslationOutputValue {
//   /**
//    * The string after translation
//    */
//   translation_text: string;
// }

export async function translateText(inputText: string, sourceLanguage?: string, targetLanguage?: string): Promise <string | string[]> {
  const hf = new HfInference(process.env.HUGGINGFACEHUB_API_KEY);

  const model = 'Helsinki-NLP/opus-mt-'+sourceLanguage+'-'+targetLanguage
  console.log({model})

  try {
    const translation = await hf.translation({
      model,
      inputs: inputText,
    });
    console.log(translation)
    // @ts-ignore тому що: Property 'translation_text' does not exist on type 'TranslationOutput'. Property 'translation_text' does not exist on type 'TranslationOutputValue[]'
    return translation.translation_text
  } catch (err) {
    const errText = 'Помилка перекладу на ' + targetLanguage === 'uk' ? 'українську' : 'англійську: ' + err
    console.log(errText)
    return errText
  }

}