import { useNavigate } from "react-router-dom";
import { useSuivis } from "../../content/autresSuivis";
import { CarteElement } from "../../components/ui/Carte";
import { EnTete } from "../../components/ui/EnTete";
import { SECTIONS } from "../../lib/sections";

export function SuivisListePage() {
  const navigate = useNavigate();
  const suivis = useSuivis();
  return (
    <div>
      <EnTete
        titre="Suivre autre chose"
        couleur={SECTIONS.suivis.couleurFonce}
        action={
          <button
            onClick={() => navigate("/suivis/gerer")}
            className="text-sm font-semibold cursor-pointer underline"
            style={{ color: SECTIONS.suivis.couleurFonce }}
          >
            Gérer
          </button>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {suivis
          .filter((s) => !s.masque)
          .map((s) => (
            <CarteElement
              key={s.id}
              icone={s.icone}
              label={s.label}
              couleur={SECTIONS.suivis.couleurClaire}
              onClick={() => navigate(`/suivis/${s.id}`)}
            />
          ))}
      </div>
    </div>
  );
}
