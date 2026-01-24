import texts from '../i18n/locales';
//import texts from '../i18n';
import { useLanguage } from './LanguageContext';

export default function useTexts() {
    const { language } = useLanguage();
    //return Object.assign({}, ...Object.values(texts[language]));
    return texts[language];

}