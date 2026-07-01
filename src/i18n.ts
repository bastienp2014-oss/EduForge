import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Traductions de survie
const resources = {
  fr: {
    translation: {
      survie: {
        title: "Informations Critiques",
        bail: "Bail et Logement: Un bail au Québec est un contrat légal. Vous ne pouvez pas l'annuler facilement.",
        sante: "Santé: Inscrivez-vous à la RAMQ dès que possible. Le délai est d'environ 3 mois."
      },
      nav: {
        back: "Retour"
      }
    }
  },
  en: {
    translation: {
      survie: {
        title: "Critical Information",
        bail: "Lease and Housing: A lease in Quebec is a legal contract. You cannot cancel it easily.",
        sante: "Health: Register for RAMQ as soon as possible. The delay is about 3 months."
      },
      nav: {
        back: "Back"
      }
    }
  },
  es: {
    translation: {
      survie: {
        title: "Información Crítica",
        bail: "Contrato de alquiler y Vivienda: Un contrato de alquiler (bail) en Quebec es un contrato legal. No se puede cancelar fácilmente.",
        sante: "Salud: Regístrese en la RAMQ lo antes posible. El tiempo de espera es de aproximadamente 3 meses."
      },
      nav: {
        back: "Volver"
      }
    }
  },
  zh: {
    translation: {
      survie: {
        title: "关键信息",
        bail: "租约与住房：魁北克的租约是一项法律合同。您不能轻易取消它。",
        sante: "健康：尽快注册 RAMQ (健康保险)。等待期大约为 3 个月。"
      },
      nav: {
        back: "返回"
      }
    }
  },
  uk: {
    translation: {
      survie: {
        title: "Важлива інформація",
        bail: "Оренда та Житло: Оренда (bail) у Квебеку — це юридичний договір. Ви не можете його легко скасувати.",
        sante: "Здоров'я: Зареєструйтесь у RAMQ якнайшвидше. Період очікування становить близько 3 місяців."
      },
      nav: {
        back: "Назад"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "fr", // default language
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
