import { X } from "lucide-react";
import { motion } from "motion/react";

export type GameType = "blocs" | "quiz" | "2048" | "sort" | "swipe" | "pendu" | "hache";

interface ModalInstructionsProps {
  game: GameType;
  onClose: () => void;
}

export default function ModalInstructions({
  game,
  onClose,
}: ModalInstructionsProps) {
  const instructions = {
    hache: {
      title: "L'Élan du Bûcheron (Lancer de Hache)",
      rules: [
        "Pesez sur le gros bouton vert de haut-parleur pour écouter Gaston le Bûcheron parler avec son accent québécois.",
        "Choisissez parmi les 3 rondins de bois le sens ou la traduction de ce que vous avez entendu.",
        "Cliquez ou appuyez sur le rondin ciblé pour y lancer votre hache de bûcheron !",
        "Si vous touchez dans le mille, vous empochez 5,00 $ (piasses) dans votre portefeuille !",
        "Attention, vous commencez la run avec 3 arbres de vie (vies). Ne visez pas dans l'vide !"
      ]
    },
    pendu: {
      title: 'Le Pendu',
      rules: [
        "Découvrez le mot caché en proposant des lettres.",
        "À chaque erreur, le dessin du pendu avance ! (Max 7 erreurs)",
        "Gagnez 15 piasses en réussissant.",
        "Un indice sous forme de définition vous est donné pour vous aider.",
      ]
    },
    swipe: {
      title: "Swipe Québec",
      rules: [
        "Lisez le mot et essayez de vous rappeler sa définition.",
        "Tapez sur la carte pour voir la réponse et l'exemple.",
        "Glissez à droite si vous connaissiez la réponse (Acquis).",
        "Glissez à gauche si vous vous êtes trompé (À réviser).",
        "Gagnez 5 piasses par mot bien retenu !",
      ],
    },
    blocs: {
      title: "Blocs Québec",
      rules: [
        "Sélectionnez une forme en bas de l'écran en cliquant dessus.",
        "Cliquez sur la grille pour placer la forme.",
        "Formez des lignes complètes (verticales ou horizontales) pour casser les blocs.",
        "Gagnez des piasses à chaque bloc cassé !",
      ],
    },
    quiz: {
      title: "Mots du Québec (Quiz)",
      rules: [
        "Lisez attentivement la question sur la culture ou le vocabulaire québécois.",
        "Choisissez la bonne réponse parmi les 4 options.",
        "Découvrez des faits intéressants grâce aux explications.",
        "Gagnez 2 piasses pour chaque bonne réponse !",
      ],
    },
    "2048": {
      title: "Mots Fusion",
      rules: [
        "Glissez sur l'écran pour déplacer toutes les tuiles.",
        "Fusionnez les syllabes de base pour construire le mot cible affiché.",
        "L'ordre a de l'importance ! Pour faire POU + TI, fusionnez-les selon leur position.",
        "Formez le grand mot pour passer au niveau suivant et gagner 50 piasses !"
      ],
    },
    sort: {
      title: "Le Trieur de Rue",
      rules: [
        "Un mot ou une expression québécoise vous est présenté(e).",
        "Identifiez à quel thème il/elle appartient parmi les choix possibles.",
        "Lisez la définition pour mieux retenir son sens après avoir joué.",
        "Gagnez 1 piasse pour chaque mot correctement classé !",
      ],
    },
  };

  const gameInstructions = instructions[game] || { title: "Instructions", rules: [] };
  const { title, rules } = gameInstructions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4 text-slate-600 md:text-lg mb-8">
            {rules.map((rule, idx) => (
              <p key={idx} className="flex gap-2">
                <strong className="text-blue-600">{idx + 1}.</strong>
                <span>{rule}</span>
              </p>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl transition-colors"
          >
            J'ai compris !
          </button>
        </div>
      </motion.div>
    </div>
  );
}
