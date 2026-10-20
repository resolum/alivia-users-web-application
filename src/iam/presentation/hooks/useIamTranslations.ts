import {
  useTranslations,
  type Translations,
} from '@/shared/presentation/i18n/index.ts';

type IamTranslations = Translations['iam'];

/** Returns the IAM slice of the shared dictionaries. */
export function useIamTranslations(): IamTranslations {
  return useTranslations().iam;
}
