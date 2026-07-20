import { useNavigate } from "react-router-dom";
import { SYMPTOMES } from "../../content/symptomes";
import { CarteElement } from "../../components/ui/Carte";
import { EnTete } from "../../components/ui/EnTete";
import { SECTIONS } from "../../lib/sections";

export function SymptomesListePage() {
  const navigate = useNavigate();
  return (
    <div>
      <EnTete titre="Signaler un symptôme" couleur={SECTIONS.symptomes.couleurFonce} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SYMPTOMES.map((s) => (
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
