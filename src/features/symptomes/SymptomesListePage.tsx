import { useNavigate } from "react-router-dom";
import { useSymptomes } from "../../content/symptomes";
import { CarteElement } from "../../components/ui/Carte";
import { EnTete } from "../../components/ui/EnTete";
import { SECTIONS } from "../../lib/sections";

export function SymptomesListePage() {
  const navigate = useNavigate();
  const symptomes = useSymptomes();
  return (
    <div>
      <EnTete
        titre="Signaler un symptôme"
        couleur={SECTIONS.symptomes.couleurFonce}
        action={
          <button
            onClick={() => navigate("/symptomes/gerer")}
            className="text-sm font-semibold cursor-pointer underline"
            style={{ color: SECTIONS.symptomes.couleurFonce }}
          >
            Gérer
          </button>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {symptomes
          .filter((s) => !s.desactive)
          .map((s) => (
            <CarteElement
              key={s.id}
              icone={s.icone}
              label={s.label}
              couleur={SECTIONS.symptomes.couleurClaire}
              onClick={() => navigate(`/symptomes/${s.id}`)}
            />
          ))}
      </div>
    </div>
  );
}
