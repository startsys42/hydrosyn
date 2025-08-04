import texts from '../i18n/locales';
import { useLanguage } from './LanguageContext';

export default function useTexts() {
    const { language } = useLanguage();
    return texts[language];
}