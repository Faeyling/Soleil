import { useNavigate } from "react-router-dom";
import { AUTRES_SUIVIS } from "../../content/autresSuivis";
import { CarteElement } from "../../components/ui/Carte";
import { EnTete } from "../../components/ui/EnTete";
import { SECTIONS } from "../../lib/sections";

export function SuivisListePage() {
  const navigate = useNavigate();
  return (
    <div>
      <EnTete titre="Suivre autre chose" couleur={SECTIONS.suivis.couleurFonce} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {AUTRES_SUIVIS.map((s) => (
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
