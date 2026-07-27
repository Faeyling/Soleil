import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSymptomes, ORDRE_CATEGORIES_SYMPTOME, LABEL_CATEGORIE_SYMPTOME, categorieSymptome } from "../../content/symptomes";
import { CarteElement } from "../../components/ui/Carte";
import { EnTete } from "../../components/ui/EnTete";
import { SECTIONS } from "../../lib/sections";
import type { SymptomeDef } from "../../data/types";

export function SymptomesListePage() {
  const navigate = useNavigate();
  const symptomes = useSymptomes();

  const groupes = useMemo(() => {
    const parCategorie = new Map<string, SymptomeDef[]>();
    for (const s of symptomes) {
      if (s.desactive) continue;
      const cle = categorieSymptome(s);
      const liste = parCategorie.get(cle) ?? [];
      liste.push(s);
      parCategorie.set(cle, liste);
    }
    return ORDRE_CATEGORIES_SYMPTOME.map((categorie) => ({
      categorie,
      symptomes: parCategorie.get(categorie) ?? [],
    })).filter((g) => g.symptomes.length > 0);
  }, [symptomes]);

  return (
    <div>
      <EnTete
        titre="Signaler un symptôme"
        couleur={SECTIONS.symptomes.couleurFonce}
        action={
          <button
            onClick={() => navigate("/symptomes/gerer")}
            className="text-sm font-semibold cursor-pointer underline"
            style={{ color: "var(--color-texte)" }}
          >
            Gérer
          </button>
        }
      />
      {groupes.map(({ categorie, symptomes: symptomesGroupe }) => (
        <section key={categorie} className="mb-6">
          <h2 className="font-bold text-sm mb-2 text-texte-doux">{LABEL_CATEGORIE_SYMPTOME[categorie]}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {symptomesGroupe.map((s) => (
              <CarteElement
                key={s.id}
                icone={s.icone}
                label={s.label}
                couleur={SECTIONS.symptomes.couleurClaire}
                onClick={() => navigate(`/symptomes/${s.id}`)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
